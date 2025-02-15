import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";
import { extractUrls } from "../src/agents/utils.js";

async function getCurrentInterrupts() {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const interrupts = await client.threads.search({
    status: "interrupted",
    limit: 100,
  });

  const links: string[] = interrupts.flatMap(
    (i) => (i.values as Record<string, any>).links,
  );

  return links;
}

async function getScheduledPosts() {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const threads = await client.threads.search({
    limit: 300,
    metadata: {
      graph_id: "upload_post",
    },
  });
  const idleAndBusyThreads = threads.filter(
    (t) => t.status === "idle" || t.status === "busy",
  );

  let links: string[] = [];

  for (const { thread_id } of idleAndBusyThreads) {
    const run = await client.runs.list(thread_id);
    const linksFromPost = extractUrls((run[0] as any).kwargs.input.post);
    if (linksFromPost.length > 0) {
      links = links.concat(linksFromPost);
    }
  }

  return links;
}

export async function getAllUsedLinks() {
  const currentInterrupts = await getCurrentInterrupts();
  const scheduledPosts = await getScheduledPosts();
  return [...new Set(currentInterrupts.concat(scheduledPosts))];
}

console.log(await getAllUsedLinks());
