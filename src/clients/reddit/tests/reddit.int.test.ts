import { test, expect } from "@jest/globals";
import { RedditClient } from "../client.js";

test("Reddit client can fetch posts from subreddit", async () => {
  const subredditName = "LocalLLaMA";

  const client = await RedditClient.fromUserless();
  const posts = await client.getTopPosts(subredditName, { limit: 10 });
  console.log("Posts:\n");
  console.dir(posts.map(client.simplifyPost), { depth: null });
  expect(posts.length).toBe(10);
});

test("Reddit client can fetch comments from post", async () => {
  const subredditName = "LocalLLaMA";
  const client = await RedditClient.fromUserless();
  const posts = await client.getTopPosts(subredditName, { limit: 1 });

  const postId = posts[0].id;
  const comments = await client.getPostComments(postId);
  console.log("Comments:\n");
  console.dir(comments.map(client.simplifyComment), { depth: null });
  expect(comments.length).toBeGreaterThan(0);
});

test("Reddit client can fetch post by URL", async () => {
  const client = await RedditClient.fromUserless();
  const url =
    "https://www.reddit.com/r/LocalLLaMA/comments/1i31ji5/what_is_elevenlabs_doing_how_is_it_so_good/";
  const post = await client.getPostByURL(url);
  console.log("Post:\n");
  console.dir(post, { depth: null });
  expect(post).toBeDefined();
});

test("Can get posts and comments from URL", async () => {
  const client = await RedditClient.fromUserless();
  const url =
    "https://www.reddit.com/r/LocalLLaMA/comments/1i31ji5/what_is_elevenlabs_doing_how_is_it_so_good/";
  const post = await client.getPostByURL(url);
  expect(post).toBeDefined();
  const comments = await client.getPostComments(post.id);
  expect(comments.length).toBeGreaterThan(0);
});

test("Can get posts and comments from URL, then simplify", async () => {
  const client = await RedditClient.fromUserless();
  const url =
    "https://www.reddit.com/r/LocalLLaMA/comments/1i31ji5/what_is_elevenlabs_doing_how_is_it_so_good/";
  const post = await client.getPostByURL(url);
  expect(post).toBeDefined();
  const comments = await client.getPostComments(post.id);
  expect(comments.length).toBeGreaterThan(0);

  const simplePost = client.simplifyPost(post);
  const simpleComments = comments.map(client.simplifyComment);

  expect(simplePost).toBeDefined();
  expect(simpleComments.length).toBe(comments.length);
});
