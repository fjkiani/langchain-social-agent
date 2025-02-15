import { LangGraphRunnableConfig } from "@langchain/langgraph";

export const NAMESPACE = ["saved_data", "twitter"];
export const IDS_KEY = "ids";
export const IDS_OBJECT_KEY = "data";

export const LAST_INGESTED_ID_KEY = "last_ingested_id";
export const LAST_INGESTED_ID_OBJECT_KEY = "data";

export async function putTweetIds(
  tweetIds: string[],
  config: LangGraphRunnableConfig,
) {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, IDS_KEY, {
    [IDS_OBJECT_KEY]: tweetIds,
  });
}

export async function getTweetIds(
  config: LangGraphRunnableConfig,
): Promise<string[]> {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  const tweetIds = await store.get(NAMESPACE, IDS_KEY);
  if (!tweetIds) {
    return [];
  }
  return tweetIds.value?.[IDS_OBJECT_KEY] || [];
}

export async function putLastIngestedTweetId(
  id: string,
  config: LangGraphRunnableConfig,
) {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, LAST_INGESTED_ID_KEY, {
    [LAST_INGESTED_ID_OBJECT_KEY]: id,
  });
}

export async function getLastIngestedTweetId(
  config: LangGraphRunnableConfig,
): Promise<string> {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  const idData = await store.get(NAMESPACE, LAST_INGESTED_ID_KEY);
  if (!idData) {
    return "";
  }
  return idData.value?.[LAST_INGESTED_ID_OBJECT_KEY] || "";
}
