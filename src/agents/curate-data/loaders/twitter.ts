import { TweetV2, TweetV2ListTweetsPaginator } from "twitter-api-v2";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { createdAtAfter } from "../utils/created-at-after.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  getLastIngestedTweetId,
  putLastIngestedTweetId,
} from "../utils/stores/twitter.js";

const LIST_ID = "1585430245762441216";

/**
 * Fetches tweets from a Twitter list, handling pagination and error handling.
 * If an error occurs, the function logs the error and returns undefined.
 * @param client
 * @param paginationToken
 * @returns {Promise<TweetV2ListTweetsPaginator | undefined>}
 */
async function fetchListTweetsWrapper(
  client: TwitterClient,
  paginationToken: string | undefined,
): Promise<TweetV2ListTweetsPaginator | undefined> {
  try {
    return await client.getListTweets(LIST_ID, {
      maxResults: 100,
      paginationToken,
    });
  } catch (error) {
    console.error(`Error fetching tweets: ${error}`);
    return undefined;
  }
}

export async function twitterLoader(): Promise<TweetV2[]> {
  const client = TwitterClient.fromBasicTwitterAuth();

  // Initialize variables for pagination
  let paginationToken: string | undefined;
  let allTweets: TweetV2[] = [];
  let requestCount = 0;
  const maxRequests = 5;

  // Calculate 24 hours ago once, using the provided current time
  const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  const oneDayAgoUTC = new Date(oneDayAgo.toISOString());

  while (requestCount < maxRequests) {
    requestCount += 1;

    const tweets = await fetchListTweetsWrapper(client, paginationToken);
    if (tweets === undefined || !tweets?.data?.data?.length) {
      // No more tweets to fetch
      break;
    }

    const filteredTweets: TweetV2[] = tweets?.data.data.filter(
      (tweet) =>
        tweet.created_at && createdAtAfter(tweet.created_at, oneDayAgoUTC),
    );

    allTweets = [...allTweets, ...filteredTweets];

    // Get the next pagination token
    paginationToken = tweets.data.meta?.next_token;
    // If no more tweets or we got tweets older than 24 hours, stop paginating
    if (
      !paginationToken ||
      tweets.data.data.some(
        (tweet) =>
          tweet.created_at && !createdAtAfter(tweet.created_at, oneDayAgoUTC),
      )
    ) {
      break;
    }
  }

  return allTweets;
}

export async function twitterLoaderWithLangChain(
  config: LangGraphRunnableConfig,
) {
  const lastIngestedTweetId = await getLastIngestedTweetId(config);
  const client = TwitterClient.fromBasicTwitterAuth();
  // Don't return tweets from the LangChain account, or active LangChain employees since these
  // are likely to have already been sent to the agent/are duplicates.
  const excludeUsers =
    "-from:LangChainAI -from:hwchase17 -from:bracesproul -from:Hacubu";
  const query = `@LangChainAI -is:reply -is:retweet -is:quote has:links ${excludeUsers}`;
  const langchainTweets = await client.searchTweets(query, {
    maxResults: 60, // Twitter API v2 limits to 60 req/15 min,
    sinceId: lastIngestedTweetId || undefined,
  });
  const tweets = langchainTweets.data.data;

  if (!tweets) {
    throw new Error("No tweets found");
  }

  const mostRecentTweetId = tweets
    .sort((a, b) => {
      if (!a.created_at || !b.created_at) {
        return 0;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    })
    .map((tweet) => tweet.id)[0];

  if (mostRecentTweetId) {
    await putLastIngestedTweetId(mostRecentTweetId, config);
  }

  return tweets;
}
