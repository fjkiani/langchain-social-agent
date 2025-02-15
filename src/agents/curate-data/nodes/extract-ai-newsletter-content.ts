import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";
import { CurateDataState } from "../state.js";
import { extractTweetId, extractUrls, getUrlType, sleep } from "../../utils.js";
import { RedditPostsWithExternalData } from "../../verify-reddit-post/types.js";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { TweetV2 } from "twitter-api-v2";
import { RedditClient } from "../../../clients/reddit/client.js";
import { SimpleRedditPostWithComments } from "../../../clients/reddit/types.js";

function checkTwitterURLExists(url: string, validatedTweets: TweetV2[]) {
  const tweetId = extractTweetId(url);

  return validatedTweets.some((tweet) => tweet.id === tweetId);
}

function checkRedditURLExists(
  url: string,
  redditPosts: RedditPostsWithExternalData[],
): boolean {
  return redditPosts.some((post) => post.post.url === url);
}

// MUST BE CALLED BEFORE GENERATING TWITTER GROUPS, AND BEFORE VERIFYING REDDIT POSTS
export async function extractAINewsletterContent(
  state: CurateDataState,
): Promise<Partial<CurateDataState>> {
  const relevantTwitterURLs: string[] = [];
  const relevantRedditURLs: string[] = [];
  const generalURLs: string[] = [];

  for await (const url of state.aiNewsPosts) {
    const loader = new FireCrawlLoader({
      url,
      mode: "scrape",
      params: {
        formats: ["markdown"],
      },
    });

    const docs = await loader.load();

    const docsText = docs.map((d) => d.pageContent).join("\n");

    const urls: string[] = [];
    // Content between these sections are from the AI Twitter Recap
    if (
      docsText.includes("AI Twitter Recap") &&
      docsText.includes("AI Reddit Recap")
    ) {
      const twitterRecap = docsText
        .split("AI Twitter Recap")[1]
        .split("AI Reddit Recap")[0];
      if (twitterRecap.length > 0) {
        const twitterURLs = extractUrls(twitterRecap);
        urls.push(...twitterURLs);
      }
    }

    // Content between these sections are from the AI Reddit Recap
    if (
      docsText.includes("AI Reddit Recap") &&
      docsText.includes("AI Discord Recap")
    ) {
      const redditRecap = docsText
        .split("AI Reddit Recap")[1]
        .split("AI Discord Recap")[0];
      if (redditRecap.length > 0) {
        const redditURLs = extractUrls(redditRecap);
        urls.push(...redditURLs);
      }
    }

    const twitterURLsInText = urls
      .filter((url) => getUrlType(url) === "twitter")
      .filter((url) => !checkTwitterURLExists(url, state.validatedTweets));
    relevantTwitterURLs.push(...twitterURLsInText);

    const redditURLsInText = urls
      // Do not include media links
      .filter((url) => getUrlType(url) === "reddit" && !url.includes("/media"))
      .filter((url) => !checkRedditURLExists(url, state.redditPosts));
    relevantRedditURLs.push(...redditURLsInText);

    generalURLs.push(
      ...urls.filter((url) =>
        ["general", "github", "youtube"].includes(getUrlType(url) || ""),
      ),
    );
  }

  const tweets: TweetV2[] = [];
  const twitterClient = TwitterClient.fromBasicTwitterAuth();
  for await (const twitterURL of relevantTwitterURLs) {
    // Sleep for 30/s between requests to avoid rate limits
    await sleep(30000);
    const tweetId = extractTweetId(twitterURL);
    if (!tweetId) {
      console.warn("Failed to extract tweet ID from URL:", twitterURL);
      continue;
    }
    try {
      const tweetContent = await twitterClient.getTweet(tweetId);
      tweets.push(tweetContent.data);
    } catch (e) {
      console.error("Failed to fetch tweet:", e);
      // Break on the first twitter error, as it's likely due to rate limits.
      break;
    }
  }

  const redditPosts: SimpleRedditPostWithComments[] = [];
  const client = await RedditClient.fromUserless();
  for await (const redditURL of relevantRedditURLs) {
    const postAndComments = await client.getSimplePostAndComments(redditURL);
    redditPosts.push(postAndComments);
  }

  return {
    validatedTweets: [...state.validatedTweets, ...tweets],
    rawRedditPosts: [...state.rawRedditPosts, ...redditPosts],
    generalUrls: [...state.generalUrls, ...generalURLs],
  };
}
