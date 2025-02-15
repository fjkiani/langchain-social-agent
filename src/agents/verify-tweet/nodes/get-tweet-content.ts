import { VerifyTweetAnnotation } from "../verify-tweet-state.js";
import { extractTweetId } from "../../utils.js";
import { TwitterClient } from "../../../clients/twitter/client.js";
import { resolveAndReplaceTweetTextLinks } from "../../../clients/twitter/utils.js";
import { TweetV2SingleResult } from "twitter-api-v2";

export async function getTweetContent(
  state: typeof VerifyTweetAnnotation.State,
) {
  const tweetId = extractTweetId(state.link);
  if (!tweetId) {
    return {};
  }

  let twitterClient: TwitterClient;
  const useArcadeAuth = process.env.USE_ARCADE_AUTH;
  const useTwitterApiOnly = process.env.USE_TWITTER_API_ONLY;

  if (useTwitterApiOnly === "true" || useArcadeAuth !== "true") {
    twitterClient = TwitterClient.fromBasicTwitterAuth();
  } else {
    const twitterUserId = process.env.TWITTER_USER_ID;
    if (!twitterUserId) {
      throw new Error("Twitter user ID not found in configurable fields.");
    }

    const twitterToken = process.env.TWITTER_USER_TOKEN;
    const twitterTokenSecret = process.env.TWITTER_USER_TOKEN_SECRET;

    twitterClient = await TwitterClient.fromArcade(twitterUserId, {
      twitterToken,
      twitterTokenSecret,
    });
  }

  let tweetContent: TweetV2SingleResult | undefined;

  try {
    tweetContent = await twitterClient.getTweet(tweetId);
  } catch (e: any) {
    console.error("Failed to get tweet content", e);
    // TODO: IMPLEMENT DELAYING RUNS ONCE GOTO GRAPH HAS BEEN IMPLEMENTED IN LANGGRAPH SDK
    // const graphDelayed = config.configurable?.graphDelayed;
    // if (graphDelayed) {
    //   // Graph already has been delayed. Do not attempt to delay again.
    //   throw new Error(
    //     "Failed to fetch tweet. Graph already delayed." + e.message,
    //   );
    // }

    // const { thread_id, assistant_id, run_id, ...restOfConfigurable } =
    //   config.configurable || {};
    // if (!thread_id || !assistant_id || !run_id) {
    //   console.warn(
    //     "Can not delay run because one of thread_id, assistant_id, run_id is missing.",
    //     {
    //       thread_id,
    //       assistant_id,
    //       run_id,
    //     },
    //   );
    //   throw new Error(
    //     "Failed to fetch tweet. One of thread_id, assistant_id, run_id is missing." +
    //       `thread_id: ${thread_id}, assistant_id: ${assistant_id}, run_id: ${run_id}` +
    //       "Error message:" +
    //       e.message,
    //   );
    // }
    // await delayRun({
    //   seconds: 60 * 15, // 15 min delay for Twitter API rate limits
    //   resumeNode: "verifyTweetSubGraph",
    //   threadId: thread_id,
    //   assistantId: assistant_id,
    //   runId: run_id,
    //   state: {
    //     // Since we're resuming from the start of the subgraph, only pass the input the subgraph expects.
    //     link: state.link,
    //   },
    //   configurable: {
    //     ...restOfConfigurable,
    //     graphDelayed: true,
    //   },
    // });
    return {};
  }

  if (!tweetContent) {
    throw new Error("Failed to get tweet content");
  }

  const mediaUrls: string[] =
    tweetContent.includes?.media
      ?.filter((m) => (m.url && m.type === "photo") || m.type.includes("gif"))
      .flatMap((m) => (m.url ? [m.url] : [])) || [];

  let tweetContentText = "";
  if (tweetContent.data.note_tweet?.text) {
    tweetContentText = tweetContent.data.note_tweet.text;
  } else {
    tweetContentText = tweetContent.data.text;
  }

  const { content, externalUrls } =
    await resolveAndReplaceTweetTextLinks(tweetContentText);

  if (!externalUrls.length) {
    return {
      tweetContent: tweetContentText,
      imageOptions: mediaUrls,
    };
  }

  return {
    tweetContent: content,
    tweetContentUrls: externalUrls,
    imageOptions: mediaUrls,
  };
}
