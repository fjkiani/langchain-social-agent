/**
 * Get content
 * Fetch & validate any links in main post
 * Validate main post, including content from links & images
 * return all content as page contents.
 */
import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { verifyYouTubeContent } from "../shared/nodes/verify-youtube.js";
import { verifyGeneralContent } from "../shared/nodes/verify-general.js";
import { verifyGitHubContent } from "../shared/nodes/verify-github.js";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { VerifyRedditPostAnnotation } from "./verify-reddit-post-state.js";
import { validateRedditPost } from "./nodes/validate-reddit-post.js";
import { getExternalUrls } from "./nodes/get-external-urls.js";
import { getUrlType } from "../utils.js";
import { getPost } from "./nodes/get-post.js";

/**
 * This conditional edge will iterate over all the links in a Reddit post.
 * It creates a `Send` for each link, which will invoke a node specific to that website.
 */
function routePostUrls(state: typeof VerifyRedditPostAnnotation.State) {
  if (!state.externalURLs.length) {
    return "validateRedditPost";
  }

  return state.externalURLs.map((link) => {
    const urlType = getUrlType(link);
    if (urlType === "youtube") {
      return new Send("verifyYouTubeContent", {
        link,
      });
    } else if (urlType === "github") {
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

const verifyRedditPostBuilder = new StateGraph(VerifyRedditPostAnnotation)
  .addNode("getPost", getPost)
  .addNode("getExternalUrls", getExternalUrls)

  // Validates any GitHub, YouTube, or other URLs found in the Reddit post content.
  .addNode("verifyYouTubeContent", verifyYouTubeContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyGeneralContent", verifyGeneralContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyGitHubContent", verifyGitHubContent, {
    input: VerifyContentAnnotation,
  })

  // Validates the final Reddit post content, including any content/summaries generated
  // or extracted from URLs inside the Reddit post.
  .addNode("validateRedditPost", validateRedditPost)

  // Start node
  .addEdge(START, "getPost")
  .addEdge("getPost", "getExternalUrls")
  // After getting the content & nested URLs, route to either the nodes, or go
  // straight to validation if no URLs found.
  .addConditionalEdges("getExternalUrls", routePostUrls, [
    "verifyYouTubeContent",
    "verifyGeneralContent",
    "verifyGitHubContent",
    "validateRedditPost",
  ])

  // After verifying the different content types, we should validate them in combination with the Reddit post content.
  .addEdge("verifyYouTubeContent", "validateRedditPost")
  .addEdge("verifyGeneralContent", "validateRedditPost")
  .addEdge("verifyGitHubContent", "validateRedditPost")

  // Finally, finish the graph after validating the Reddit post content.
  .addEdge("validateRedditPost", END);

export const verifyRedditPostGraph = verifyRedditPostBuilder.compile();

verifyRedditPostGraph.name = "Verify Reddit Post Subgraph";
