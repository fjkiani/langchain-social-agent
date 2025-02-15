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
  console.log("\n\nGENERATED POST:\n", run.outputs.post.join("\n---\n"));
  console.log("\nEXAMPLE POST:\n", example.outputs.post);

  return {
    key: "correct_generation",
    score: true,
  };
};

async function runEval() {
  const datasetName = "sma:generate-post:github";
  await evaluate(runGraph, {
    data: datasetName,
    evaluators: [evaluatePost],
    experimentPrefix: "Post Generation-Github",
  });
}

runEval().catch(console.error);

// Should be approved and posts generated
// https://x.com/LangChainAI/status/1861108590792036799
// https://x.com/LangChainAI/status/1860760295188185246
// https://x.com/LangChainAI/status/1860745200668201148
// https://x.com/LangChainAI/status/1860714493661106562
// https://x.com/LangChainAI/status/1860485484683911584
// https://x.com/LangChainAI/status/1860397908451033240

// Would need review:
// https://x.com/LangChainAI/status/1858175010612916272
