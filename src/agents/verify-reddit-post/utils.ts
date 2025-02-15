import {
  SimpleRedditComment,
  SimpleRedditPostWithComments,
} from "../../clients/reddit/types.js";

export function formatComments(comments: SimpleRedditComment[]): string {
  return comments
    .map(
      (c) =>
        `${c.author}: ${c.body}${c.replies ? "\nReply:\n" + formatComments(c.replies) : ""}`,
    )
    .join("\n");
}

export function convertPostToString(
  redditPostWithComments: SimpleRedditPostWithComments,
): string {
  const mainPost = `${redditPostWithComments.post.title}
${redditPostWithComments.post.selftext}
${redditPostWithComments.post.url || ""}`;
  const comments = redditPostWithComments.comments
    ? formatComments(redditPostWithComments.comments)
    : "";
  return `${mainPost}${comments ? "\n\nComments:\n" + comments : ""}`;
}
