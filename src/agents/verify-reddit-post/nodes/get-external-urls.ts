import { extractUrls, getUrlType } from "../../utils.js";
import { VerifyRedditGraphState } from "../types.js";

export async function getExternalUrls(
  state: VerifyRedditGraphState,
): Promise<Partial<VerifyRedditGraphState>> {
  if (!state.redditPost) {
    throw new Error("No reddit post found");
  }
  const urls = extractUrls(state.redditPost.post.selftext);
  const filteredUrls = urls.filter((url) => getUrlType(url) !== "reddit");

  const postUrl = state.redditPost.post.url;
  if (
    postUrl &&
    getUrlType(postUrl) !== "reddit" &&
    !filteredUrls.includes(postUrl)
  ) {
    filteredUrls.push(postUrl);
  }

  return {
    externalURLs: filteredUrls,
  };
}
