import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";
import { TEXT_ONLY_MODE } from "../src/agents/generate-post/constants.js";

async function main() {
  const apiUrl = process.env.LANGGRAPH_API_URL || "http://localhost:54367";
  const client = new Client({ apiUrl });

  const post =
    `E2E upload_post → LinkedIn via Arcade (${new Date().toISOString()}).`;

  console.log("Creating thread against", apiUrl);
  const { thread_id } = await client.threads.create();
  console.log("thread_id", thread_id);

  const run = await client.runs.create(thread_id, "upload_post", {
    input: {
      post,
      image: undefined,
    },
    config: {
      configurable: {
        [TEXT_ONLY_MODE]: true,
      },
    },
  });
  console.log("run created", run.run_id || run);

  // Wait for completion
  const result = await client.runs.join(thread_id, run.run_id);
  console.log("run result:");
  console.dir(result, { depth: 4 });

  const state = await client.threads.getState(thread_id);
  console.log("final state keys:", Object.keys(state.values || {}));
  console.log("UPLOAD_POST_DONE");
}

main().catch((e) => {
  console.error("UPLOAD_POST_FAILED", e);
  process.exit(1);
});
