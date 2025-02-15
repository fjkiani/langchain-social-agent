import * as fs from "fs/promises";
import { describe, it, expect } from "@jest/globals";
import Arcade from "@arcadeai/arcadejs";
import { TwitterClient } from "../client.js";
import { extractMimeTypeFromBase64 } from "../../../agents/utils.js";

const tweetId = "1864386797788385455";
const userId = "braceasproul@gmail.com";
const username = "bracesproul";

describe.skip("Arcade", () => {
  describe.skip("Can use Arcade to call the Twitter API", () => {
    const arcade = new Arcade({
      apiKey: process.env.ARCADE_API_KEY,
    });

    it("Can load tweets by a user ID", async () => {
      const result = await arcade.tools.execute({
        tool_name: "X.SearchRecentTweetsByUsername",
        input: {
          username,
          max_results: 1,
        },
        user_id: userId,
      });

      console.log("Result\n");
      console.dir(result, { depth: null });
      expect(result).toBeDefined();
    });

    it("Can load a single tweet by ID", async () => {
      const result = await arcade.tools.execute({
        tool_name: "X.LookupTweetById",
        input: { tweet_id: tweetId },
        user_id: userId,
      });

      console.log("Result\n");
      console.dir(result, { depth: null });
      expect(result).toBeDefined();
    });
  });

  describe.skip("Can use the Twitter Client with Arcade", () => {
    const twitterTokens = {
      twitterToken: process.env.TWITTER_USER_TOKEN || "",
      twitterTokenSecret: process.env.TWITTER_USER_TOKEN_SECRET || "",
    };

    it("Can upload a tweet", async () => {
      const client = await TwitterClient.fromArcade(userId, twitterTokens);
      const tweetText = "test 123 hello world!";
      const result = await client.uploadTweet({
        text: tweetText,
      });

      expect(result.errors).not.toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.text).toBe(tweetText);
    });

    it("Can upload media", async () => {
      const client = await TwitterClient.fromArcade(userId, twitterTokens);
      const imageBuffer = await fs.readFile(
        "src/tests/data/langchain_logo.png",
      );

      const result = await client.uploadMedia(imageBuffer, "image/png");
      console.log("Media ID", result);
      expect(result).toBeDefined();
    });

    it("Can upload a tweet with media", async () => {
      const client = await TwitterClient.fromArcade(userId, twitterTokens);
      const imageBuffer = await fs.readFile(
        "src/tests/data/langchain_logo.png",
      );
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

    it("Can upload this image", async () => {
      const client = await TwitterClient.fromArcade(userId, twitterTokens);
      const imageBuffer = await fs.readFile(
        "src/tests/data/langchain_logo_2.png",
      );
      const imageBase64 = imageBuffer.toString("base64");

      const imageMimeType = extractMimeTypeFromBase64(imageBase64);
      if (!imageMimeType) {
        throw new Error("Could not determine image mime type");
      }
      const result = await client.uploadMedia(imageBuffer, imageMimeType);
      console.log("result", result);
    });

    it("Can upload image from URL", async () => {
      const client = await TwitterClient.fromArcade(userId, twitterTokens);
      const imageUrl =
        "https://miro.medium.com/v2/resize:fit:1200/1*-PlFCd_VBcALKReO3ZaOEg.png";

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "image/jpeg";
      console.log("contentType", contentType);
      const result = await client.uploadMedia(imageBuffer, contentType);
      console.log("result", result);
    });
  });
});
