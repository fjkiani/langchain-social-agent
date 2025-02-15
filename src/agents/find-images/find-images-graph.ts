import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { findImages } from "./nodes/find-images.js";
import { validateImages } from "./nodes/validate-images.js";
import { reRankImages } from "./nodes/re-rank-images.js";
import { VerifyLinksResultAnnotation } from "../verify-links/verify-links-state.js";

export const FindImagesAnnotation = Annotation.Root({
  ...VerifyLinksResultAnnotation.spec,
  /**
   * The report generated on the content of the message. Used
   * as context for generating the post.
   */
  report: Annotation<string>,
  /**
   * The generated post for LinkedIn/Twitter.
   */
  post: Annotation<string>,
});

function validateImagesOrEnd(state: typeof FindImagesAnnotation.State) {
  if (state.imageOptions?.length) {
    return "validateImages";
  }
  return END;
}

const findImagesWorkflow = new StateGraph(FindImagesAnnotation)
  .addNode("findImages", findImages)
  .addNode("validateImages", validateImages)
  .addNode("reRankImages", reRankImages)

  .addEdge(START, "findImages")

  .addConditionalEdges("findImages", validateImagesOrEnd, [
    "validateImages",
    END,
  ])

  .addEdge("validateImages", "reRankImages")

  .addEdge("reRankImages", END);

export const findImagesGraph = findImagesWorkflow.compile();
findImagesGraph.name = "Find Images Graph";
