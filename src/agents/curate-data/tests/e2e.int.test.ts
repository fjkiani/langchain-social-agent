import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import * as ls from "langsmith/jest";
import { SimpleEvaluator } from "langsmith/jest";
import { curateDataGraph } from "../index.js";
import { Client } from "@langchain/langgraph-sdk";
import { NUM_POSTS_PER_SUBREDDIT } from "../constants.js";
import { CurateDataState } from "../state.js";

const e2eEvaluator: SimpleEvaluator = () => {
  return {
    key: "successful_run",
    score: 1,
  };
};

ls.describe("SMA - Curate Data - E2E", () => {
  ls.test.only(
    "Can run end-to-end for Reddit posts",
    {
      inputs: {},
      expected: {},
    },
    async () => {
      const client = new Client({
        apiUrl: `http://localhost:${process.env.PORT || "2024"}`,
      });

      console.log("Before invoking curateDataGraph");
      const { thread_id } = await client.threads.create();
      const result = await client.runs.wait(thread_id, "curate_data", {
        input: {},
        config: {
          configurable: {
            sources: ["reddit"],
            [NUM_POSTS_PER_SUBREDDIT]: 2,
          },
        },
      });
      console.log("After invoking curateDataGraph");
      console.log(
        "result.\nresult.rawRedditPosts.length:",
        (result as CurateDataState).rawRedditPosts.length,
      );

      const { threadRunIds } = result as CurateDataState;

      console.log("Waiting for all generate post results");
      const allGeneratePostResults = await Promise.allSettled(
        threadRunIds.map(async ({ thread_id, run_id }) => {
          const result = await client.runs.join(thread_id, run_id);
          console.log("Got generate post result:\n", result);
          return result;
        }),
      );

      await ls.expect(allGeneratePostResults).evaluatedBy(e2eEvaluator).toBe(1);
      return result;
    },
    240000, // 4 minutes
  );

  ls.test(
    "Can run end-to-end for GitHub repos",
    {
      inputs: {},
      expected: {},
    },
    async () => {
      const store = new InMemoryStore();
      const checkpointer = new MemorySaver();

      curateDataGraph.store = store;
      curateDataGraph.checkpointer = checkpointer;

      const result = await curateDataGraph.invoke(
        {},
        {
          configurable: {
            sources: ["github"],
            [NUM_POSTS_PER_SUBREDDIT]: undefined,
          },
        },
      );

      await ls.expect(result).evaluatedBy(e2eEvaluator).toBe(1);
      return result;
    },
    240000, // 4 minutes
  );

  ls.test(
    "Can run end-to-end for Twitter posts",
    {
      inputs: {},
      expected: {},
    },
    async () => {
      const store = new InMemoryStore();
      const checkpointer = new MemorySaver();

      curateDataGraph.store = store;
      curateDataGraph.checkpointer = checkpointer;

      const result = await curateDataGraph.invoke(
        {},
        {
          configurable: {
            sources: ["twitter"],
            [NUM_POSTS_PER_SUBREDDIT]: undefined,
          },
        },
      );

      await ls.expect(result).evaluatedBy(e2eEvaluator).toBe(1);
      return result;
    },
    240000, // 4 minutes
  );
});
