import {
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  IngestDataConfigurableAnnotation,
  IngestDataAnnotation,
} from "./ingest-data-state.js";
import { ingestSlackData } from "./nodes/ingest-slack.js";
import { Client } from "@langchain/langgraph-sdk";
import {
  POST_TO_LINKEDIN_ORGANIZATION,
  TEXT_ONLY_MODE,
} from "../generate-post/constants.js";
import {
  getAfterSecondsFromLinks,
  isTextOnly,
  shouldPostToLinkedInOrg,
} from "../utils.js";

async function generatePostFromMessages(
  state: typeof IngestDataAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  const client = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });

  const linkAndDelay = getAfterSecondsFromLinks(state.links);
  const isTextOnlyMode = isTextOnly(config);
  const postToLinkedInOrg = shouldPostToLinkedInOrg(config);

  for await (const { link, afterSeconds } of linkAndDelay) {
    const thread = await client.threads.create();
    await client.runs.create(thread.thread_id, "generate_post", {
      input: {
        links: [link],
      },
      config: {
        configurable: {
          [POST_TO_LINKEDIN_ORGANIZATION]: postToLinkedInOrg,
          [TEXT_ONLY_MODE]: isTextOnlyMode,
        },
      },
      afterSeconds,
    });
  }
  return {};
}

const builder = new StateGraph(
  IngestDataAnnotation,
  IngestDataConfigurableAnnotation,
)
  // Ingests posts from Slack channel.
  .addNode("ingestSlackData", ingestSlackData)
  // Subgraph which is invoked once for each message.
  // This subgraph will verify content is relevant to
  // LangChain, generate a report on the content, and
  // finally generate and schedule a post.
  .addNode("generatePostGraph", generatePostFromMessages)
  // Start node
  .addEdge(START, "ingestSlackData")
  // After ingesting data, route to the subgraph for each message.
  .addEdge("ingestSlackData", "generatePostGraph")
  // Finish after generating the Twitter post.
  .addEdge("generatePostGraph", END);

export const graph = builder.compile();

graph.name = "Social Media Agent";
