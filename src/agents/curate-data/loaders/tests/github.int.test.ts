import { test, expect } from "@jest/globals";
import { InMemoryStore } from "@langchain/langgraph";
import { langchainDependencyReposLoader } from "../github/langchain.js";
import { githubTrendingLoader } from "../github/trending.js";

test("githubTrendingLoader", async () => {
  const store = new InMemoryStore();
  const config = {
    store,
  };
  const results = await githubTrendingLoader(config);
  console.log("\n\nTEST COMPLETED\n\n");
  console.log("results.length", results);
  expect(results.length).toBeGreaterThan(0);

  // This should return 0 results due to all the links being in the store
  const results2 = await githubTrendingLoader(config);
  console.log("\n\nTEST COMPLETED\n\n");
  console.log("results2.length", results2);
  expect(results2.length).toBe(0);
});

test("langchainDependencyReposLoader", async () => {
  const store = new InMemoryStore();
  const config = {
    store,
  };
  const results = await langchainDependencyReposLoader(config);
  console.log("\n\nTEST COMPLETED\n\n");
  console.log("results.length", results.length);
  console.log(results);
  expect(results.length).toBe(10);
}, 240000); // 4 minutes since there's 30/s delays after each 5 requests
