import * as fs from "fs/promises";
import { describe, it, expect } from "@jest/globals";
import { TwitterClient } from "../client.js";
import { imageUrlToBuffer } from "../../../agents/utils.js";
import { TweetV2 } from "twitter-api-v2";
import { getThreadTweets } from "../utils.js";

const tweetId = "1864386797788385455";
// const tweetWithMediaId = "1846215982765035677";
const tweetWithMediaId = "1874884500062122296";

describe("Basic Twitter Auth", () => {
  const client = TwitterClient.fromBasicTwitterAuth();

  it("Can confirm the user is authed", async () => {
    const isAuthed = await client.testAuthentication();
    expect(isAuthed).toBe(true);
  });

  it("Can read a tweet from ID", async () => {
    const tweet = await client.getTweet(tweetId);
    expect(tweet).toBeDefined();
    console.log("Tweet\n");
    console.dir(tweet.data, { depth: null });
  });

  it("Can read a tweet from ID and get media", async () => {
    const tweet = await client.getTweet(tweetWithMediaId);
    console.dir(tweet, { depth: null });
    expect(tweet).toBeDefined();
    // Check the full length Tweet is returned
    expect(tweet.data.note_tweet?.text).toBeDefined();
    expect(tweet.data.note_tweet?.text?.length).toBeGreaterThan(280);
    // Check the media is returned
    expect(tweet.includes?.media?.[0]).toBeDefined();
    expect(tweet.includes?.media?.[0].url).toBeDefined();
    expect(tweet.includes?.media?.[0].type).toBe("photo");
    const mediaUrl = tweet.includes?.media?.[0].url || "";
    const mediaData = await imageUrlToBuffer(mediaUrl);
    expect(mediaData.buffer).toBeDefined();
    expect(mediaData.contentType).toBeDefined();
  });

  it("Can post a text only tweet", async () => {
    const result = await client.uploadTweet({
      text: "test 123 hello world!",
    });

    expect(result.errors).not.toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBeDefined();
    expect(result.data.text).toBe("test 123 hello world!");
  });

  it("Can post a text and media tweet", async () => {
    const imageBuffer = await fs.readFile("src/tests/data/langchain_logo.png");
    const tweetText = "test 123 hello world! (with image)";

    const result = await client.uploadTweet({
      text: tweetText,
      media: {
        media: imageBuffer,
        mimeType: "image/png",
      },
    });

    expect(result).toBeDefined();
  });

  it("Can fetch a thread using the original tweet", async () => {
    const baseThreadTweet: TweetV2 = {
      created_at: "2025-01-17T15:03:15.000Z",
      edit_history_tweet_ids: ["1880269659070689496"],
      text: "Lots of devs sharing how to code with AI and agents.\n\nUse cases range from basic code optimization to test-driven development. \n\nHere are a few interesting resources:\n\n(bookmark for later)",
      author_id: "3448284313",
      id: "1880269659070689496",
    };
    const thread = await client.getThreadFromId(baseThreadTweet);
    console.log("thread", thread?.length);
    console.dir(thread, { depth: null });
    expect(thread).toBeDefined();
    expect(thread?.length).toBe(9);
    const validatedThread = getThreadTweets(baseThreadTweet, thread);
    console.log("validatedThread", validatedThread?.length);
    console.dir(validatedThread, { depth: null });
    expect(validatedThread).toBeDefined();
    expect(validatedThread?.length).toBe(9);
  });

  it("Can search tweets", async () => {
    const query = `@LangChainAI -is:reply -is:retweet -is:quote has:links`;
    const langchainTweets = await client.searchTweets(query, {
      maxResults: 10, // Twitter API v2 limits to 60 req/15 min
    });
    expect(langchainTweets.data).toBeDefined();
    expect(langchainTweets.data.data).toBeDefined();
    expect(langchainTweets.data.data.length).toBe(10);
  });
});
