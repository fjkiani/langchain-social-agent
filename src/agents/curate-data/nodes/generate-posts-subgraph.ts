import { Client } from "@langchain/langgraph-sdk";
import { CurateDataState } from "../state.js";
import { getTweetLink } from "../../../clients/twitter/utils.js";
import { POST_TO_LINKEDIN_ORGANIZATION } from "../../generate-post/constants.js";
import {
  getAfterSecondsFromLinks,
  shouldPostToLinkedInOrg,
} from "../../utils.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  getGitHubRepoURLs,
  putGitHubRepoURLs,
} from "../utils/stores/github-repos.js";
import {
  getRedditPostIds,
  putRedditPostIds,
} from "../utils/stores/reddit-post-ids.js";
import { getTweetIds, putTweetIds } from "../utils/stores/twitter.js";
import { SlackClient } from "../../../clients/slack.js";
import { ThreadRunId } from "../types.js";

async function saveIngestedData(
  state: CurateDataState,
  config: LangGraphRunnableConfig,
) {
  const [existingGitHubRepoURLs, redditPostIds, existingTweetIds] =
    await Promise.all([
      getGitHubRepoURLs(config),
      getRedditPostIds(config),
      getTweetIds(config),
    ]);

  const newGitHubRepoURLs = new Set([
    ...existingGitHubRepoURLs,
    ...state.rawTrendingRepos,
  ]);
  const newRedditPostIds = new Set([
    ...redditPostIds,
    ...state.rawRedditPosts.map((p) => p.post.id),
  ]);
  const newTweetIds = new Set([
    ...existingTweetIds,
    ...state.rawTweets.map((t) => t.id),
  ]);

  await Promise.all([
    putGitHubRepoURLs(Array.from(newGitHubRepoURLs), config),
    putRedditPostIds(Array.from(newRedditPostIds), config),
    putTweetIds(Array.from(newTweetIds), config),
  ]);
}

export async function generatePostsSubgraph(
  state: CurateDataState,
  config: LangGraphRunnableConfig,
): Promise<Partial<CurateDataState>> {
  const postToLinkedInOrg = shouldPostToLinkedInOrg(config);

  const client = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });

  const twitterURLs = state.rawTweets.flatMap((t) =>
    t.author_id ? [getTweetLink(t.author_id, t.id)] : [],
  );
  const redditURLs = state.rawRedditPosts.map((p) => p.post.url);
  const afterSecondsList = getAfterSecondsFromLinks(
    [...twitterURLs, ...redditURLs, ...state.rawTrendingRepos],
    {
      baseDelaySeconds: 60,
    },
  );

  const threadRunIds: ThreadRunId[] = [];

  for (const { link, afterSeconds } of afterSecondsList) {
    const { thread_id } = await client.threads.create();
    const { run_id } = await client.runs.create(thread_id, "generate_post", {
      input: {
        links: [link],
      },
      config: {
        configurable: {
          [POST_TO_LINKEDIN_ORGANIZATION]: postToLinkedInOrg,
        },
      },
      afterSeconds,
    });
    threadRunIds.push({ thread_id, run_id });
  }

  let slackClient: SlackClient | undefined = undefined;
  if (process.env.SLACK_CHANNEL_ID && process.env.SLACK_CHANNEL_ID) {
    slackClient = new SlackClient({
      channelId: process.env.SLACK_CHANNEL_ID,
    });
  }

  try {
    await saveIngestedData(state, config);
    if (slackClient) {
      await slackClient.sendMessage(`✅ INGESTED DATA SAVED SUCCESSFULLY ✅

Number of tweets: *${state.rawTweets.length}*
Number of repos: *${state.rawTrendingRepos.length}*
Number of reddit posts: *${state.rawRedditPosts.length}*
Run ID: *${config.configurable?.run_id || "not found"}*
Thread ID: *${config.configurable?.thread_id || "not found"}*
      `);
    }
  } catch (error: any) {
    console.warn("Error saving ingested data", error);
    if (slackClient) {
      const errMessage = "message" in error ? error.message : String(error);

      await slackClient.sendMessage(`FAILED TO SAVE INGESTED DATA: ${errMessage}
  
Run ID: *${config.configurable?.run_id || "not found"}*
Thread ID: *${config.configurable?.thread_id || "not found"}*
      `);
    }
  }

  return {
    threadRunIds,
  };
}
