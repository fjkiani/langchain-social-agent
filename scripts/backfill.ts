import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

/**
 * Performs a manual data backfill operation using LangGraph.
 *
 * This function creates a new thread and initiates a data ingestion run
 * to backfill historical data. It's useful for one-time data imports
 * or catching up on missed data ingestion periods.
 *
 * The default configuration looks back 7 days, but this can be adjusted
 * via the `maxDaysHistory` parameter in the config.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the backfill run is created
 * @throws {Error} If there's an issue creating the thread or initiating the run
 *
 * @example
 * ```bash
 * yarn cron:backfill
 * ```
 */
export async function backfill() {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const thread = await client.threads.create();
  const res = await client.runs.create(thread.thread_id, "ingest_data", {
    config: {
      configurable: {
        slackChannelId: "ADD_SLACK_CHANNEL_ID_HERE",
        maxDaysHistory: 10, // Or change to desired number of days
      },
    },
    input: {},
  });
  console.log("Created run");
  console.log(res);
}

// backfill().catch(console.error);

/**
 * Backfill with links instead of ingesting from Slack.
 */
export async function backfillWithLinks() {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const newLinksArr: string[] = [
    // Add your new links here
  ];

  const { thread_id } = await client.threads.create();
  await client.runs.create(thread_id, "ingest_data", {
    input: {
      links: newLinksArr,
    },
    config: {
      configurable: {
        skipIngest: true,
      },
    },
  });
}

// backfillWithLinks().catch(console.error);
