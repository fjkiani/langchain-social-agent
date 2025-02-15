import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

/**
 * Creates a new cron job in LangGraph for data ingestion.
 *
 * This function sets up a daily cron job that runs at midnight (00:00) to ingest data.
 * It uses the LangGraph Client to create a new cron job with specified configuration
 * and then retrieves a list of all existing cron jobs.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the cron job is created
 * and the list of crons is retrieved
 * @throws {Error} If there's an issue creating the cron job or retrieving the list
 *
 * @example
 * ```bash
 * yarn cron:create
 * ```
 */
async function createCron() {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const res = await client.crons.create("ingest_data", {
    schedule: "0 0 * * *",
    config: {
      configurable: {
        slackChannelId: "ADD_SLACK_CHANNEL_ID_HERE",
        maxDaysHistory: 1,
      },
    },
    input: {},
  });
  console.log("Created cron");
  console.log(res);

  const crons = await client.crons.search();
  console.log("Crons");
  console.log(crons);
}

createCron().catch(console.error);
