import { test, expect } from "@jest/globals";
import { getRedditPosts } from "../reddit.js";
import { InMemoryStore } from "@langchain/langgraph";

test("getRedditPosts", async () => {
  const store = new InMemoryStore();
  const config = {
    store,
  };
  const results = await getRedditPosts(config);
  console.log("\n\nTEST COMPLETED\n\n");
  console.log("results.length", results.length);
  expect(results.length).toBeGreaterThan(0);
});
