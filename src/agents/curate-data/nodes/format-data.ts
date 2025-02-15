import { CurateDataState } from "../state.js";

export async function formatData(
  state: CurateDataState,
): Promise<Partial<CurateDataState>> {
  return {
    curatedData: {
      tweetsGroupedByContent: state.tweetsGroupedByContent,
      redditPosts: state.redditPosts,
      generalContents: state.pageContents?.map((pc, idx) => ({
        pageContent: pc,
        relevantLinks: (state.relevantLinks?.[idx] || []) as string[],
      })),
      githubTrendingData: state.githubTrendingData,
    },
  };
}
