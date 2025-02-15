import fs from "fs/promises";
import { test, expect } from "@jest/globals";
import { twitterLoader } from "../twitter.js";

test("twitterLoader", async () => {
  const resultsPath =
    "/Users/bracesproul/code/lang-chain-ai/projects/social-media-agent/src/agents/curate-reports/nodes/tests/data/tweets-3.json";
  const results = await twitterLoader();
  console.log("\n\nTEST COMPLETED\n\n");
  console.log("results.length", results.length);
  await fs.writeFile(resultsPath, JSON.stringify(results));
  expect(results.length).toBeGreaterThan(0);
});
