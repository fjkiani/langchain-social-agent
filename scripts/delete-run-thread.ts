import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

// Uncomment to delete a single run & thread

// async function deleteRunAndThread() {
//   const threadId = "ADD_THREAD_ID_HERE";
//   const runId = "ADD_RUN_ID_HERE";
//   const client = new Client({
//     apiUrl: process.env.LANGGRAPH_API_URL,
//   });

//   await client.runs.delete(threadId, runId);
//   await client.threads.delete(threadId);
// }

// deleteRunAndThread().catch(console.error);

async function deleteRunsAndThreads() {
  const runAndThreadIds = [
    {
      runId: "ADD_RUN_ID_HERE",
      threadId: "ADD_THREAD_ID_HERE",
    },
    // ...
  ];

  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  await Promise.all(
    runAndThreadIds.map(async ({ runId, threadId }) => {
      try {
        await client.runs.delete(threadId, runId);
      } catch (e) {
        console.error(
          "Failed to delete run",
          runId,
          "from thread",
          threadId,
          e,
        );
      }

      try {
        await client.threads.delete(threadId);
      } catch (e) {
        console.error("Failed to delete thread", threadId, e);
      }
    }),
  );
}

deleteRunsAndThreads().catch(console.error);
