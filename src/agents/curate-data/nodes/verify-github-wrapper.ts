import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { CurateDataState } from "../state.js";
import { GitHubTrendingData } from "../types.js";
import { verifyGitHubContent } from "../../shared/nodes/verify-github.js";

export async function verifyGitHubWrapper(
  state: CurateDataState,
  config: LangGraphRunnableConfig,
): Promise<Partial<CurateDataState>> {
  const verifiedRepoData: GitHubTrendingData[] = [];

  // Iterate over each raw GitHub repo & verify + extract page contents
  for await (const repoURL of state.rawTrendingRepos) {
    const results = await verifyGitHubContent(
      {
        link: repoURL,
      },
      config,
    );

    if (
      results.relevantLinks &&
      results.relevantLinks.length > 0 &&
      results.pageContents &&
      results.pageContents.length > 0
    ) {
      verifiedRepoData.push({
        repoURL,
        pageContent: results.pageContents[0], // Take first page content, as there should only be one
      });
    }
  }

  return {
    githubTrendingData: verifiedRepoData,
  };
}
