import { EXAMPLES } from "../generate-post/prompts/examples.js";

export function formatReportsForPrompt(reports: string[]): string {
  return reports
    .map((r, index) => `<report index="${index}">\n${r}\n</report>`)
    .join("\n");
}

export function formatBodyPostsForPrompt(posts: string[]): string {
  if (posts.length === 0) {
    return "You have not generated any body posts yet, only the introduction.";
  }
  const postsString = posts
    .map((p, index) => `<post index="${index}">\n${p}\n</post>`)
    .join("\n");
  return `Here are the body posts you have generated so far:
<body-posts>
${postsString}
</body-posts>`;
}

export function formatAllPostsForPrompt(posts: string[]): string {
  return posts
    .map((p, index) => `<post index="${index}">\n${p}\n</post>`)
    .join("\n");
}

export function formatTweetExamplesForPrompt(): string {
  return EXAMPLES.map(
    (ex, index) => `<example index="${index}">\n${ex}\n</example>`,
  ).join("\n");
}

export function parseTweetGeneration(tweet: string): string {
  const tweetMatch = tweet.match(/<tweet>([\s\S]*?)<\/tweet>/);
  if (!tweetMatch) {
    console.warn(
      "Could not parse tweet from generation:\nSTART OF TWEET\n\n",
      tweet,
      "\n\nEND OF TWEET",
    );
  }
  return tweetMatch?.[1] ? tweetMatch[1].trim() : tweet;
}
