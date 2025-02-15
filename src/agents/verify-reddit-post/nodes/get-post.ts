import { RedditClient } from "../../../clients/reddit/client.js";
import { VerifyRedditGraphState } from "../types.js";

export async function getPost(
  state: VerifyRedditGraphState,
): Promise<Partial<VerifyRedditGraphState>> {
  if (state.redditPost) {
    // Post already exists, don't do anything
    return {};
  }

  const client = await RedditClient.fromUserless();
  const redditPost = await client.getSimplePostAndComments(
    state.postID || state.link || "",
  );

  return {
    redditPost,
  };
}
