import { END, START, StateGraph } from "@langchain/langgraph";
import { generateThreadPlan } from "./nodes/generate-thread-plan.js";
import { generateThreadPosts } from "./nodes/generate-thread-posts.js";
import { GenerateThreadAnnotation, GenerateThreadState } from "./state.js";
import { humanNode } from "./nodes/human-node/index.js";
import { updateScheduledDate } from "../shared/nodes/update-scheduled-date.js";
import { rewriteThread } from "./nodes/rewrite-thread.js";
import { scheduleThread } from "./nodes/schedule-thread.js";

function rewriteOrEndConditionalEdge(
  state: GenerateThreadState,
):
  | "rewriteThread"
  | "scheduleThread"
  | "updateScheduleDate"
  | "humanNode"
  | typeof END {
  if (state.next) {
    if (state.next === "unknownResponse") {
      // If the user's response is unknown, we should route back to the human node.
      return "humanNode";
    } else if (state.next === "rewritePost") {
      return "rewriteThread";
    } else if (state.next === "schedulePost") {
      return "scheduleThread";
    }

    return state.next;
  }
  return END;
}

const generateThreadWorkflow = new StateGraph(GenerateThreadAnnotation)
  .addNode("generateThreadPlan", generateThreadPlan)
  .addNode("generateThreadPosts", generateThreadPosts)
  .addNode("humanNode", humanNode)
  // Updated the scheduled date from the natural language response from the user.
  .addNode("updateScheduleDate", updateScheduledDate)
  .addNode("scheduleThread", scheduleThread)
  .addNode("rewriteThread", rewriteThread)
  .addEdge(START, "generateThreadPlan")
  .addEdge("generateThreadPlan", "generateThreadPosts")
  .addEdge("generateThreadPosts", "humanNode")
  .addConditionalEdges("humanNode", rewriteOrEndConditionalEdge, [
    "rewriteThread",
    "scheduleThread",
    "updateScheduleDate",
    "humanNode",
    END,
  ])
  .addEdge("rewriteThread", "humanNode")
  .addEdge("updateScheduleDate", "humanNode")
  .addEdge("scheduleThread", END);

export const generateThreadGraph = generateThreadWorkflow.compile();
generateThreadGraph.name = "Generate Thread Graph";
