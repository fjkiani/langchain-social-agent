import { Annotation, END, Send, START, StateGraph } from "@langchain/langgraph";
import {
  CurateDataAnnotation,
  CurateDataConfigurableAnnotation,
  CurateDataState,
} from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { verifyGitHubWrapper } from "./nodes/verify-github-wrapper.js";
import { verifyRedditWrapper } from "./nodes/verify-reddit-wrapper.js";
import { verifyGeneralContent } from "../shared/nodes/verify-general.js";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { validateBulkTweets } from "./nodes/validate-bulk-tweets.js";
import { formatData } from "./nodes/format-data.js";
import { groupTweetsByContent } from "./nodes/tweets/group-tweets-by-content.js";
import { reflectOnTweetGroups } from "./nodes/tweets/reflect-tweet-groups.js";
import { reGroupTweets } from "./nodes/tweets/re-group-tweets.js";
import { generatePostsSubgraph } from "./nodes/generate-posts-subgraph.js";
import { extractAINewsletterContent } from "./nodes/extract-ai-newsletter-content.js";

function generatePostOrContinue(
  _state: CurateDataState,
): "generatePostsSubgraph" | "verifyBulkTweets" {
  const useLangChain = process.env.USE_LANGCHAIN_PROMPTS === "true";

  if (useLangChain) {
    return "generatePostsSubgraph";
  }
  return "verifyBulkTweets";
}

function verifyContentWrapper(state: CurateDataState): Send[] {
  const generalSends = state.generalUrls.map((post) => {
    return new Send("verifyGeneralContent", {
      link: post,
    });
  });

  const githubSends = state.rawTrendingRepos?.length
    ? [
        new Send("verifyGitHubContent", {
          rawTrendingRepos: state.rawTrendingRepos,
        }),
      ]
    : [];

  const redditSends = state.rawRedditPosts?.length
    ? [
        new Send("verifyRedditPost", {
          rawRedditPosts: state.rawRedditPosts,
        }),
      ]
    : [];

  const twitterSends = state.validatedTweets?.length
    ? [
        new Send("groupTweetsByContent", {
          validatedTweets: state.validatedTweets,
        }),
      ]
    : [];

  return [...generalSends, ...githubSends, ...redditSends, ...twitterSends];
}

function reGroupOrContinue(
  state: CurateDataState,
): "reGroupTweets" | "formatData" {
  if (state.similarGroupIndices && state.similarGroupIndices.length > 0) {
    return "reGroupTweets";
  }
  return "formatData";
}

const curateDataWorkflow = new StateGraph(
  { stateSchema: CurateDataAnnotation, input: Annotation.Root({}) },
  CurateDataConfigurableAnnotation,
)
  .addNode("ingestData", ingestData)
  .addNode("extractAINewsletterContent", extractAINewsletterContent)
  .addNode("verifyGitHubContent", verifyGitHubWrapper)
  .addNode("verifyRedditPost", verifyRedditWrapper)
  .addNode("verifyGeneralContent", verifyGeneralContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyBulkTweets", validateBulkTweets)
  .addNode("groupTweetsByContent", groupTweetsByContent)
  .addNode("reflectOnTweetGroups", reflectOnTweetGroups)
  .addNode("reGroupTweets", reGroupTweets)

  .addNode("generatePostsSubgraph", generatePostsSubgraph)

  .addNode("formatData", formatData)
  .addEdge(START, "ingestData")
  .addConditionalEdges("ingestData", generatePostOrContinue, [
    "generatePostsSubgraph",
    "verifyBulkTweets",
  ])
  .addEdge("verifyBulkTweets", "extractAINewsletterContent")

  .addConditionalEdges("extractAINewsletterContent", verifyContentWrapper, [
    "verifyGeneralContent",
    "verifyGitHubContent",
    "verifyRedditPost",
    "groupTweetsByContent",
  ])
  // If generatePostsSubgraph is called, we should end.
  .addEdge("generatePostsSubgraph", END)
  .addEdge("verifyGeneralContent", "formatData")
  .addEdge("verifyGitHubContent", "formatData")
  .addEdge("verifyRedditPost", "formatData")
  .addEdge("groupTweetsByContent", "reflectOnTweetGroups")
  .addConditionalEdges("reflectOnTweetGroups", reGroupOrContinue, [
    "reGroupTweets",
    "formatData",
  ])
  .addEdge("reGroupTweets", "formatData")
  .addEdge("formatData", END);

export const curateDataGraph = curateDataWorkflow.compile();
curateDataGraph.name = "Curate Data Graph";
