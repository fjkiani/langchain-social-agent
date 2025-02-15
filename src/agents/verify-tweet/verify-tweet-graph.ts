import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { VerifyTweetAnnotation } from "./verify-tweet-state.js";
import { getTweetContent } from "./nodes/get-tweet-content.js";
import { verifyYouTubeContent } from "../shared/nodes/verify-youtube.js";
import { verifyGeneralContent } from "../shared/nodes/verify-general.js";
import { verifyGitHubContent } from "../shared/nodes/verify-github.js";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { validateTweetContent } from "./nodes/validate-tweet.js";

/**
 * This conditional edge will iterate over all the links in a Tweet.
 * It creates a `Send` for each link, which will invoke a node specific to that website.
 */
function routeTweetUrls(state: typeof VerifyTweetAnnotation.State) {
  if (!state.tweetContentUrls.length) {
    return "validateTweet";
  }

  return state.tweetContentUrls.map((link) => {
    if (link.includes("youtube.com")) {
      return new Send("verifyYouTubeContent", {
        link,
      });
    } else if (link.includes("github.com")) {
      return new Send("verifyGitHubContent", {
        link,
      });
    } else {
      return new Send("verifyGeneralContent", {
        link,
      });
    }
  });
}

const verifyTweetBuilder = new StateGraph(VerifyTweetAnnotation)
  // Calls the Twitter API to get the content, and extracts + validates any
  // URLs found in the Tweet content.
  .addNode("getTweetContent", getTweetContent)

  // Validates any GitHub, YouTube, or other URLs found in the Tweet content.
  .addNode("verifyYouTubeContent", verifyYouTubeContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyGeneralContent", verifyGeneralContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyGitHubContent", verifyGitHubContent, {
    input: VerifyContentAnnotation,
  })

  // Validates the final Tweet content, including any content/summaries generated
  // or extracted from URLs inside the Tweet.
  .addNode("validateTweet", validateTweetContent)

  // Start node
  .addEdge(START, "getTweetContent")
  // After getting the content & nested URLs, route to either the nodes, or go
  // straight to validation if no URLs found.
  .addConditionalEdges("getTweetContent", routeTweetUrls, [
    "verifyYouTubeContent",
    "verifyGeneralContent",
    "verifyGitHubContent",
    "validateTweet",
  ])

  // After verifying the different content types, we should validate them in combination with the Tweet content.
  .addEdge("verifyYouTubeContent", "validateTweet")
  .addEdge("verifyGeneralContent", "validateTweet")
  .addEdge("verifyGitHubContent", "validateTweet")

  // Finally, finish the graph after validating the Tweet content.
  .addEdge("validateTweet", END);

export const verifyTweetGraph = verifyTweetBuilder.compile();

verifyTweetGraph.name = "Verify Tweet Subgraph";
