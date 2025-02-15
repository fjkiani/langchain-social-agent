import { LangGraphRunnableConfig } from "@langchain/langgraph";

export const NAMESPACE = ["saved_data", "github_repos"];
export const KEY = "urls";
export const OBJECT_KEY = "data";

export async function putGitHubRepoURLs(
  repoUrls: string[],
  config: LangGraphRunnableConfig,
) {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, KEY, {
    [OBJECT_KEY]: repoUrls,
  });
}

export async function getGitHubRepoURLs(
  config: LangGraphRunnableConfig,
): Promise<string[]> {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided");
  }
  const repoUrls = await store.get(NAMESPACE, KEY);
  if (!repoUrls) {
    return [];
  }
  return repoUrls.value?.[OBJECT_KEY] || [];
}
