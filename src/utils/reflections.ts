import { Item, LangGraphRunnableConfig } from "@langchain/langgraph";

const NAMESPACE = ["reflection_rules"];
const KEY = "rules";
export const RULESET_KEY = "ruleset";
export const PROMPT_KEY = "prompt";

/**
 * Retrieves reflection rules from the store
 * @param {LangGraphRunnableConfig} config - Configuration object containing the store
 * @throws {Error} When no store is provided in the config
 * @returns {Promise<string>} The reflection rules prompt, or an empty string if not found
 */
export async function getReflectionsPrompt(
  config: LangGraphRunnableConfig,
): Promise<string> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  const reflections = await store.get(NAMESPACE, KEY);
  return reflections?.value?.[PROMPT_KEY] || "";
}

/**
 * Stores reflection rules in the store
 * @param {LangGraphRunnableConfig} config - Configuration object containing the store
 * @param {string} reflections - The reflection rules to store
 * @throws {Error} When no store is provided in the config
 * @returns {Promise<void>}
 */
export async function putReflectionsPrompt(
  config: LangGraphRunnableConfig,
  reflections: string,
): Promise<void> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, KEY, {
    [PROMPT_KEY]: reflections,
  });
}

/**
 * Retrieves reflection rules from the store
 * @param {LangGraphRunnableConfig} config - Configuration object containing the store
 * @throws {Error} When no store is provided in the config
 * @returns {Promise<Item | undefined>} The reflection rules, or undefined if not found
 * @deprecated - use `getReflectionsPrompt` instead.
 */
export async function getReflections(
  config: LangGraphRunnableConfig,
): Promise<Item | undefined> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  const reflections = await store.get(NAMESPACE, KEY);
  return reflections || undefined;
}

/**
 * Stores reflection rules in the store
 * @param {LangGraphRunnableConfig} config - Configuration object containing the store
 * @param {string[]} reflections - The reflection rules to store
 * @throws {Error} When no store is provided in the config
 * @returns {Promise<void>}
 * @deprecated - use `memory` graph instead.
 */
export async function putReflections(
  config: LangGraphRunnableConfig,
  reflections: string[],
): Promise<void> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, KEY, {
    [RULESET_KEY]: reflections,
  });
}

export const REFLECTIONS_PROMPT = `You have also been provided with a handful of reflections based on previous requests the user has made. Be sure to follow these rules when writing this new post so the user does not need to repeat their requests:
<reflections>
{reflections}
</reflections>`;

const THREAD_KEY = "thread_rules";
export const THREAD_RULESET_KEY = "ruleset";

/**
 * Retrieves thread reflection rules from the store
 * @param {LangGraphRunnableConfig} config - Configuration object containing the store
 * @throws {Error} When no store is provided in the config
 * @returns {Promise<Item | undefined>} The thread reflection rules if they exist, undefined otherwise
 */
export async function getThreadReflections(
  config: LangGraphRunnableConfig,
): Promise<Item | undefined> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  const threadReflections = await store.get(NAMESPACE, THREAD_KEY);
  return threadReflections || undefined;
}

/**
 * Stores thread reflection rules in the store
 * @param {LangGraphRunnableConfig} config - Configuration object containing the store
 * @param {Record<string, any>} value - The thread reflection rules to store
 * @throws {Error} When no store is provided in the config
 * @returns {Promise<void>}
 */
export async function putThreadReflections(
  config: LangGraphRunnableConfig,
  threadReflections: string[],
): Promise<void> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, THREAD_KEY, {
    [THREAD_RULESET_KEY]: threadReflections,
  });
}

export const THREAD_REFLECTIONS_PROMPT = `<reflections-context>
You have also been provided with a list of reflections generated from previous requests the user has made to change the posts in the thread.
Use these when writing or updating the thread posts to ensure the user's requests are met.
</reflections-context>

<reflection-items>
{reflections}
</reflection-items>`;
