import { type Example, Run } from "langsmith";
import { evaluate, EvaluationResult } from "langsmith/evaluation";
// eslint-disable-next-line import/no-extraneous-dependencies
import "dotenv/config";
import { generatePostGraph } from "../../agents/generate-post/generate-post-graph.js";

const runGraph = async (
  input: Record<string, any>,
): Promise<Record<string, any>> => {
  return await generatePostGraph.invoke(input);
};

const evaluatePost = (run: Run, example?: Example): EvaluationResult => {
  if (!example) {
    throw new Error("No example provided");
  }
  if (!example.outputs) {
    throw new Error("No example outputs provided");
  }
  if (!run.outputs) {
    throw new Error("No run outputs provided");
  }

  // TODO: Implement evaluation logic
  throw new Error("Evaluation logic not implemented");
};

async function runEval() {
  const datasetName = "sma:generate-post:youtube";
  await evaluate(runGraph, {
    data: datasetName,
    evaluators: [evaluatePost],
    experimentPrefix: "Post Generation-YouTube",
  });
}

runEval().catch(console.error);

// https://x.com/LangChainAI/status/1860438927892709871
// https://x.com/LangChainAI/status/1860352611834069056
// https://x.com/LangChainAI/status/1855629502690349326
// https://x.com/LangChainAI/status/1855362227420967092
// https://x.com/LangChainAI/status/1854925528031195148
