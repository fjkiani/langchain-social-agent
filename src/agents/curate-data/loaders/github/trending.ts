import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  getGitHubRepoURLs,
  putGitHubRepoURLs,
} from "../../utils/stores/github-repos.js";
import { getUniqueArrayItems } from "../../utils/get-unique-array.js";
import * as cheerio from "cheerio";

const TYPESCRIPT_TRENDING_URL =
  "https://github.com/trending/typescript?since=daily";
const PYTHON_TRENDING_URL = "https://github.com/trending/python?since=daily";

// Check github dependabot for depending on langchain
// Check for github langchain tags
export async function githubTrendingLoader(config: LangGraphRunnableConfig) {
  const fetchRepos = async (url: string) => {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    return $("h2.h3.lh-condensed")
      .map((_, element) => {
        const repoPath = $(element).find("a").attr("href");
        return repoPath ? `https://github.com${repoPath}` : null;
      })
      .get()
      .filter((url): url is string => url !== null);
  };

  const [pythonRepos, typescriptRepos] = await Promise.all([
    fetchRepos(PYTHON_TRENDING_URL),
    fetchRepos(TYPESCRIPT_TRENDING_URL),
  ]);

  const processedRepos = await getGitHubRepoURLs(config);
  const uniqueRepos = getUniqueArrayItems(processedRepos, [
    ...pythonRepos,
    ...typescriptRepos,
  ]);
  const allRepos = Array.from(new Set([...processedRepos, ...uniqueRepos]));

  await putGitHubRepoURLs(allRepos, config);

  return uniqueRepos;
}
