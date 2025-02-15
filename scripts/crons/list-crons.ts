import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

/**
 * Retrieves and displays a list of all configured cron jobs from LangGraph.
 *
 * This function connects to the LangGraph API and fetches all existing cron jobs,
 * then logs them to the console for inspection.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the cron jobs are retrieved
 * and displayed
 * @throws {Error} If there's an issue connecting to the API or retrieving the cron jobs
 *
 * @example
 * ```bash
 * yarn cron:list
 * ```
 */
async function listCrons() {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const crons = await client.crons.search();
  console.log("Crons");
  console.dir(crons, { depth: null });
}

listCrons().catch(console.error);
