import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

/**
 * Deletes a specified cron job from LangGraph.
 *
 * This function connects to the LangGraph API and deletes a cron job with the specified ID.
 * After deletion, it retrieves and displays the updated list of cron jobs.
 *
 * To find available cron IDs that can be deleted, first run the list-crons script:
 *
 * ```bash
 * yarn cron:list
 * ```
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the cron job is deleted
 * and the updated list is displayed
 * @throws {Error} If there's an issue deleting the cron job or retrieving the list
 *
 * @example
 * ```bash
 * yarn cron:delete
 * ```
 */
async function deleteCron() {
  const cronId = "ADD_CRON_ID_HERE";

  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  await client.crons.delete(cronId);
  console.log("Deleted cron");
  const crons = await client.crons.search();
  console.log("Crons");
  console.log(crons);
}

deleteCron().catch(console.error);
