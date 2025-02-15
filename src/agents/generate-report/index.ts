import { END, START, StateGraph } from "@langchain/langgraph";
import { GenerateReportAnnotation } from "./state.js";
import { generateReport } from "./nodes/generate-report.js";
import { extractKeyDetails } from "./nodes/extract-key-details.js";

const generateReportWorkflow = new StateGraph(GenerateReportAnnotation)
  .addNode("extractKeyDetails", extractKeyDetails)
  .addNode("generateReport", generateReport)
  .addEdge(START, "extractKeyDetails")
  .addEdge("extractKeyDetails", "generateReport")
  .addEdge("generateReport", END);

export const generateReportGraph = generateReportWorkflow.compile();
generateReportGraph.name = "Generate Report Graph";
