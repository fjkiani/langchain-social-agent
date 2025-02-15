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
  const datasetName = "sma:generate-post:general";
  await evaluate(runGraph, {
    data: datasetName,
    evaluators: [evaluatePost],
    experimentPrefix: "Post Generation-General",
  });
}

runEval().catch(console.error);

// https://x.com/LangChainAI/status/1858311912091476455
// https://x.com/LangChainAI/status/1857811436984217835
// https://x.com/LangChainAI/status/1856026604180242636
// https://x.com/LangChainAI/status/1855437724536504482
