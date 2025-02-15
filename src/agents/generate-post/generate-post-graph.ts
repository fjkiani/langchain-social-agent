import {
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  GeneratePostAnnotation,
  GeneratePostConfigurableAnnotation,
  GeneratePostInputAnnotation,
} from "./generate-post-state.js";
import { generateContentReport } from "./nodes/generate-report/index.js";
import { generatePost } from "./nodes/geterate-post/index.js";
import { humanNode } from "./nodes/human-node/index.js";
import { rewritePost } from "./nodes/rewrite-post.js";
import { schedulePost } from "./nodes/schedule-post/index.js";
import { condensePost } from "./nodes/condense-post.js";
import { isTextOnly, removeUrls } from "../utils.js";
import { verifyLinksGraph } from "../verify-links/verify-links-graph.js";
import { authSocialsPassthrough } from "./nodes/auth-socials.js";
import { findImagesGraph } from "../find-images/find-images-graph.js";
import { updateScheduledDate } from "../shared/nodes/update-scheduled-date.js";

function routeAfterGeneratingReport(
  state: typeof GeneratePostAnnotation.State,
): "generatePost" | typeof END {
  if (state.report) {
    return "generatePost";
  }
  return END;
}

function rewriteOrEndConditionalEdge(
  state: typeof GeneratePostAnnotation.State,
):
  | "rewritePost"
  | "schedulePost"
  | "updateScheduleDate"
  | "humanNode"
  | typeof END {
  if (state.next) {
    if (state.next === "unknownResponse") {
      // If the user's response is unknown, we should route back to the human node.
      return "humanNode";
    }
    return state.next;
  }
  return END;
}

function condenseOrHumanConditionalEdge(
  state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
): "condensePost" | "findImagesSubGraph" | "humanNode" {
  const cleanedPost = removeUrls(state.post || "");
  if (cleanedPost.length > 280 && state.condenseCount <= 3) {
    return "condensePost";
  }
  const isTextOnlyMode = isTextOnly(config);
  if (isTextOnlyMode) {
    return "humanNode";
  }
  return "findImagesSubGraph";
}

function generateReportOrEndConditionalEdge(
  state: typeof GeneratePostAnnotation.State,
): "generateContentReport" | typeof END {
  if (state.pageContents?.length) {
    return "generateContentReport";
  }
  return END;
}

const generatePostBuilder = new StateGraph(
  { stateSchema: GeneratePostAnnotation, input: GeneratePostInputAnnotation },
  GeneratePostConfigurableAnnotation,
)
  .addNode("authSocialsPassthrough", authSocialsPassthrough)

  .addNode("verifyLinksSubGraph", verifyLinksGraph)

  // Generates a Tweet/LinkedIn post based on the report content.
  .addNode("generatePost", generatePost)
  // Attempt to condense the post if it's too long.
  .addNode("condensePost", condensePost)
  // Interrupts the node for human in the loop.
  .addNode("humanNode", humanNode)
  // Schedules the post for Twitter/LinkedIn.
  .addNode("schedulePost", schedulePost)
  // Rewrite a post based on the user's response.
  .addNode("rewritePost", rewritePost)
  // Generates a report on the content.
  .addNode("generateContentReport", generateContentReport)
  // Finds images in the content.
  .addNode("findImagesSubGraph", findImagesGraph)
  // Updated the scheduled date from the natural language response from the user.
  .addNode("updateScheduleDate", updateScheduledDate)

  // Start node
  .addEdge(START, "authSocialsPassthrough")
  .addEdge("authSocialsPassthrough", "verifyLinksSubGraph")

  // After verifying the different content types, we should generate a report on them.
  .addConditionalEdges(
    "verifyLinksSubGraph",
    generateReportOrEndConditionalEdge,
    ["generateContentReport", END],
  )

  // Once generating a report, we should confirm the report exists (meaning the content is relevant).
  .addConditionalEdges("generateContentReport", routeAfterGeneratingReport, [
    "generatePost",
    END,
  ])

  // After generating the post for the first time, check if it's too long,
  // and if so, condense it. Otherwise, route to the human node.
  .addConditionalEdges("generatePost", condenseOrHumanConditionalEdge, [
    "condensePost",
    "findImagesSubGraph",
    "humanNode",
  ])
  // After condensing the post, we should verify again that the content is below the character limit.
  // Once the post is below the character limit, we can find & filter images. This needs to happen after the post
  // has been generated because the image validator requires the post content.
  .addConditionalEdges("condensePost", condenseOrHumanConditionalEdge, [
    "condensePost",
    "findImagesSubGraph",
    "humanNode",
  ])

  // After finding images, we are done and can interrupt for the human to respond.
  .addEdge("findImagesSubGraph", "humanNode")

  // Always route back to `humanNode` if the post was re-written or date was updated.
  .addEdge("rewritePost", "humanNode")
  .addEdge("updateScheduleDate", "humanNode")

  // If the schedule post is successful, end the graph.
  .addConditionalEdges("humanNode", rewriteOrEndConditionalEdge, [
    "rewritePost",
    "schedulePost",
    "updateScheduleDate",
    "humanNode",
    END,
  ])
  // Always end after scheduling the post.
  .addEdge("schedulePost", END);

export const generatePostGraph = generatePostBuilder.compile();

generatePostGraph.name = "Generate Post Subgraph";
