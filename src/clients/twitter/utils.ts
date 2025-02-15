import { TweetV2 } from "twitter-api-v2";
import { extractUrls } from "../../agents/utils.js";
import { TweetV2WithURLs } from "../../agents/curate-data/types.js";

/**
 * Generates a link to a tweet based on its author ID and tweet ID.
 * @param authorId The ID of the author of the tweet
 * @param tweetId The ID of the tweet
 * @returns The link to the tweet
 */
export function getTweetLink(authorId: string, tweetId: string): string {
  return `https://twitter.com/${authorId}/status/${tweetId}`;
}

export function isTweetSelfReply(
  tweet: TweetV2,
  originalAuthorId: string,
): boolean {
  const referencedTweet = tweet.referenced_tweets?.[0];
  return (
    tweet.author_id === originalAuthorId &&
    referencedTweet?.type === "replied_to" &&
    tweet.in_reply_to_user_id === originalAuthorId
  );
}

/**
 * Identifies tweets that form a valid thread with the original tweet
 * @param {TweetV2} originalTweet - The main/original tweet in the thread
 * @param {TweetV2[]} tweets - Array of tweets to check for thread membership
 * @returns {TweetV2[]} Array of tweets that form a valid thread, including the original tweet.
 * Empty array if no valid thread is found.
 *
 * A tweet is considered part of the thread if:
 * - It has referenced tweets
 * - It has a 'replied_to' reference to another tweet already in the thread
 *
 * @see {@link TweetV2} from 'twitter-api-v2' package
 */
export function getThreadTweets(
  originalTweet: TweetV2,
  tweets: TweetV2[],
): TweetV2[] {
  // Create a Set of all tweet IDs in the potential thread
  const tweetIds = new Set(tweets.map((tweet) => tweet.id));
  tweetIds.add(originalTweet.id);

  // Check each tweet (except the main tweet) references another tweet in the thread
  const validThreadTweets = [originalTweet];
  for (const tweet of tweets) {
    // Skip the main tweet
    if (tweet.id === originalTweet.id) continue;

    // Check if this tweet has referenced tweets
    if (!tweet.referenced_tweets || tweet.referenced_tweets.length === 0) {
      continue;
    }

    // Find a 'replied_to' reference that points to another tweet in the thread
    const hasValidReference = tweet.referenced_tweets.some(
      (ref) => ref.type === "replied_to" && tweetIds.has(ref.id),
    );

    if (hasValidReference) {
      validThreadTweets.push(tweet);
    }
  }

  return validThreadTweets;
}

/**
 * Resolves a shortened Twitter URL to the original URL.
 * This is because Twitter shortens URLs in tweets and makes
 * you follow a redirect to get the original URL.
 * @param shortUrl The shortened Twitter URL
 * @returns The resolved Twitter URL
 */
export async function resolveTwitterUrl(
  shortUrl: string,
): Promise<string | undefined> {
  try {
    const response = await fetch(shortUrl, {
      method: "HEAD",
      redirect: "follow",
    });
    return response.url;
  } catch (error) {
    console.warn(`Failed to resolve Twitter URL ${shortUrl}:`, error);
    return undefined;
  }
}

/**
 * Resolves and replaces shortened Twitter URLs in a tweet's text content.
 * @param content The text content of the tweet
 * @returns The text content with shortened Twitter URLs replaced
 */
export async function resolveAndReplaceTweetTextLinks(
  content: string,
): Promise<{
  content: string;
  externalUrls: string[];
}> {
  const urlsInTweet = extractUrls(content);
  if (!urlsInTweet) return { content, externalUrls: [] };

  const cleanedUrls = (
    await Promise.all(
      urlsInTweet.map(async (url) => {
        if (
          !url.includes("https://t.co") &&
          !url.includes("https://x.com") &&
          !url.includes("https://twitter.com")
        ) {
          return {
            original: url,
            resolved: undefined,
          };
        }
        const resolvedUrl = await resolveTwitterUrl(url);
        if (
          !resolvedUrl ||
          resolvedUrl.includes("https://t.co") ||
          resolvedUrl.includes("https://twitter.com") ||
          resolvedUrl.includes("https://x.com")
        ) {
          // Do not return twitter URLs.
          return {
            original: url,
            resolved: undefined,
          };
        }
        return {
          original: url,
          resolved: resolvedUrl,
        };
      }),
    )
  ).flat();

  let updatedContent = content;
  for (const urlPair of cleanedUrls) {
    if (urlPair.resolved) {
      updatedContent = updatedContent.replaceAll(
        urlPair.original,
        urlPair.resolved,
      );
    }
  }

  return {
    content: updatedContent,
    externalUrls: cleanedUrls
      .filter(
        (url): url is { resolved: string; original: string } => !!url.resolved,
      )
      .map((url) => url.resolved),
  };
}

/**
 * Processes an array of tweets and resolves any shortened URLs in their text content.
 * For each tweet, it extracts URLs from both regular text and note_tweet text (if present),
 * resolves them to their full form, and adds them to the tweet object.
 *
 * @param {TweetV2[]} tweets - An array of Twitter V2 API tweet objects to process
 * @returns {Promise<TweetV2WithURLs[]>} A promise that resolves to an array of processed tweets.
 *                                       Each tweet will have an additional `external_urls` field
 *                                       containing an array of resolved URLs found in the tweet's text.
 *
 * @example
 * const tweets = await client.getTweets();
 * const processedTweets = await resolveTweetsWithUrls(tweets);
 * // Each tweet in processedTweets will have resolved URLs in external_urls field
 */
export async function resolveTweetsWithUrls(
  tweets: TweetV2[],
): Promise<TweetV2WithURLs[]> {
  const resolvedTweets: TweetV2WithURLs[] = [];

  for (const tweet of tweets) {
    const tweetText = tweet.note_tweet?.text || tweet.text || "";
    if (!tweetText) {
      continue;
    }

    const contentAndUrls = await resolveAndReplaceTweetTextLinks(tweetText);

    if (tweet.note_tweet?.text) {
      resolvedTweets.push({
        ...tweet,
        note_tweet: {
          ...tweet.note_tweet,
          text: contentAndUrls.content,
        },
        external_urls: contentAndUrls.externalUrls,
      });
    } else {
      if (tweet.note_tweet?.text) {
        resolvedTweets.push({
          ...tweet,
          text: contentAndUrls.content,
          external_urls: contentAndUrls.externalUrls,
        });
      }
    }
  }

  return resolvedTweets;
}
