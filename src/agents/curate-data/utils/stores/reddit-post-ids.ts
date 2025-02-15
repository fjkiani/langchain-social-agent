import { LangGraphRunnableConfig } from "@langchain/langgraph";

export const NAMESPACE = ["saved_data", "reddit"];
export const KEY = "post_ids";
export const OBJECT_KEY = "data";

export async function putRedditPostIds(
  postIds: string[],
  config: LangGraphRunnableConfig,
) {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, KEY, {
    [OBJECT_KEY]: postIds,
  });
}

export async function getRedditPostIds(
  config: LangGraphRunnableConfig,
): Promise<string[]> {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  const savedPostIds = await store.get(NAMESPACE, KEY);
  if (!savedPostIds) {
    return [];
  }
  return savedPostIds.value?.[OBJECT_KEY] || [];
}
