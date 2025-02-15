import { test, expect } from "@jest/globals";
import { aiNewsBlogLoader } from "../ai-news-blog.js";

test("aiNewsBlogLoader", async () => {
  const results = await aiNewsBlogLoader();
  console.log(results);
  expect(results.length).toBeGreaterThan(0);
});
