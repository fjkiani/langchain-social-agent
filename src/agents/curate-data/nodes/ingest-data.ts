import { CurateDataConfigurable, CurateDataState } from "../state.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { aiNewsBlogLoader } from "../loaders/ai-news-blog.js";
import {
  twitterLoader,
  twitterLoaderWithLangChain,
} from "../loaders/twitter.js";
import { getLangChainRedditPosts, getRedditPosts } from "../loaders/reddit.js";
import { githubTrendingLoader } from "../loaders/github/trending.js";
import { TweetV2 } from "twitter-api-v2";
import { latentSpaceLoader } from "../loaders/latent-space.js";
import { SimpleRedditPostWithComments } from "../../../clients/reddit/types.js";
import { langchainDependencyReposLoader } from "../loaders/github/langchain.js";
import { RunnableLambda } from "@langchain/core/runnables";

export async function ingestData(
  _state: CurateDataState,
  config: LangGraphRunnableConfig,
): Promise<Partial<CurateDataState>> {
  const sources = (config.configurable as CurateDataConfigurable | undefined)
    ?.sources;
  if (!sources) {
    throw new Error("No sources provided");
  }
  if (!process.env.PORT) {
    throw new Error("PORT environment variable not set");
  }

  const useLangChain = process.env.USE_LANGCHAIN_PROMPTS === "true";

  let tweets: TweetV2[] = [];
  let trendingRepos: string[] = [];
  let latentSpacePosts: string[] = [];
  let aiNewsPosts: string[] = [];
  let redditPosts: SimpleRedditPostWithComments[] = [];

  // We wrap all of these loaders in RunnableLambda's to ensure proper tracing.

  if (useLangChain) {
    if (sources.includes("twitter")) {
      tweets = await RunnableLambda.from<unknown, TweetV2[]>((_, config) =>
        twitterLoaderWithLangChain(config),
      )
        .withConfig({ runName: "twitter-loader-langchain" })
        .invoke({}, config);
    }
    if (sources.includes("github")) {
      trendingRepos = await RunnableLambda.from<unknown, string[]>(
        (_, config) => langchainDependencyReposLoader(config),
      )
        .withConfig({ runName: "github-loader-langchain" })
        .invoke({}, config);
    }
    if (sources.includes("reddit")) {
      redditPosts = await RunnableLambda.from<
        unknown,
        SimpleRedditPostWithComments[]
      >((_, config) => getLangChainRedditPosts(config))
        .withConfig({ runName: "reddit-loader-langchain" })
        .invoke({}, config);
    }

    // Latent space and AI news are not high signal for LangChain. Return early in this case.
    return {
      rawTweets: tweets,
      rawTrendingRepos: trendingRepos,
      rawRedditPosts: redditPosts,
    };
  }

  if (sources.includes("twitter")) {
    tweets = await RunnableLambda.from<unknown, TweetV2[]>(() =>
      twitterLoader(),
    )
      .withConfig({ runName: "twitter-loader" })
      .invoke({}, config);
  }
  if (sources.includes("github")) {
    trendingRepos = await RunnableLambda.from<unknown, string[]>((_, config) =>
      githubTrendingLoader(config),
    )
      .withConfig({ runName: "github-loader" })
      .invoke({}, config);
  }
  if (sources.includes("reddit")) {
    redditPosts = await RunnableLambda.from<
      unknown,
      SimpleRedditPostWithComments[]
    >((_, config) => getRedditPosts(config))
      .withConfig({ runName: "reddit-loader" })
      .invoke({}, config);
  }
  if (sources.includes("latent_space")) {
    latentSpacePosts = await RunnableLambda.from<unknown, string[]>(
      (_, config) => latentSpaceLoader(config),
    )
      .withConfig({ runName: "latent-space-loader" })
      .invoke({}, config);
  }
  if (sources.includes("ai_news")) {
    aiNewsPosts = await RunnableLambda.from<unknown, string[]>(() =>
      aiNewsBlogLoader(),
    )
      .withConfig({ runName: "ai-news-loader" })
      .invoke({}, config);
  }

  return {
    rawTweets: tweets,
    rawTrendingRepos: trendingRepos,
    generalUrls: latentSpacePosts,
    aiNewsPosts,
    rawRedditPosts: redditPosts,
  };
}
