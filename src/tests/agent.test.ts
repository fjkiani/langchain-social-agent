import * as fs from "fs/promises";
import { describe, it, expect, jest } from "@jest/globals";
import {
  extractMimeTypeFromBase64,
  extractTweetId,
  extractUrls,
  extractUrlsFromSlackText,
} from "../agents/utils.js";
import { timezoneToUtc } from "../utils/date.js";

describe("extractUrlsFromSlackText", () => {
  it("Can extract URL from Slack-style message text", () => {
    const singleUrlText = `<https://github.com/karimulla0908/capstone_repo|https://github.com/karimulla0908/capstone_repo>`;
    const urls = extractUrlsFromSlackText(singleUrlText);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://github.com/karimulla0908/capstone_repo");
  });

  it("Can extract multiple URLs from Slack-style message text", () => {
    const multipleUrlsText = `<https://github.com/karimulla0908/capstone_repo|https://github.com/karimulla0908/capstone_repo> And another one is <this youtube video|https://www.youtube.com/watch?v=OyDfr0xIhss>`;
    const urls = extractUrlsFromSlackText(multipleUrlsText);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe("https://github.com/karimulla0908/capstone_repo");
    expect(urls[1]).toBe("https://www.youtube.com/watch?v=OyDfr0xIhss");
  });

  it("Can extract URLs when they do not have a label", () => {
    const urlWithoutLabelText = `<https://github.com/ReddyNitheeesh/AI-Lc-Lg-examples/blob/main/code_assistant_lg.py>`;
    const urls = extractUrlsFromSlackText(urlWithoutLabelText);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe(
      "https://github.com/ReddyNitheeesh/AI-Lc-Lg-examples/blob/main/code_assistant_lg.py",
    );
  });
});

describe("extractTweetId", () => {
  it("Can extract tweet IDs", () => {
    const id = "1422656689476354560";
    const tweetUrl = `https://twitter.com/elonmusk/status/${id}`;
    const tweetId = extractTweetId(tweetUrl);
    expect(tweetId).toBe(id);
  });

  it("Can extract tweet IDs when URL has query params", () => {
    const id = "1422656689476354560";
    const tweetUrl = `https://twitter.com/elonmusk/status/${id}?param=1`;
    const tweetId = extractTweetId(tweetUrl);
    expect(tweetId).toBe(id);
  });

  it("Can extract tweet IDs when URL has extra path fields", () => {
    const id = "1422656689476354560";
    const tweetUrl = `https://twitter.com/elonmusk/status/${id}/extra/path`;
    const tweetId = extractTweetId(tweetUrl);
    expect(tweetId).toBe(id);
  });
});

describe("extractUrls", () => {
  it("can extract a single URL from a string", () => {
    const stringWithUrl = "This is a string with a URL: https://example.com";
    const urls = extractUrls(stringWithUrl);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://example.com");
  });

  it("can extract multiple URLs from a string", () => {
    const multiLineMultiUrl = `This is a string with multiple URLs:
  2. But: too much competition, keeps prices down! https://t.co/GI4uWOGPO5
finally, we have a URL on the link below https xyz
https://example.com`;
    const urls = extractUrls(multiLineMultiUrl);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe("https://t.co/GI4uWOGPO5");
    expect(urls[1]).toBe("https://example.com");
  });

  it("Can extract URLs from a complex multi line string", () => {
    const complexString = `🤖AI-Driven Research Assistant\n\nThis is an advanced AI-powered research assistant system that utilizes multiple specialized agents to assist in tasks such as data analysis, visualization, and report generation\n\nhttps://t.co/s5ChhuMOtK https://t.co/5H2VRjd9hN`;
    const urls = extractUrls(complexString);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe("https://t.co/s5ChhuMOtK");
    expect(urls[1]).toBe("https://t.co/5H2VRjd9hN");
  });
});

describe("timezoneToUtc", () => {
  // Mock the current time to ensure consistent test results
  const MOCK_NOW = new Date("2024-12-13T16:26:57-08:00");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should correctly parse PST time", () => {
    const result = timezoneToUtc("12/13/2024 02:30 PM PST");
    expect(result?.toISOString()).toBe("2024-12-13T22:30:00.000Z");
  });

  it("should correctly parse EST time", () => {
    const result = timezoneToUtc("12/13/2024 02:30 PM EST");
    expect(result?.toISOString()).toBe("2024-12-13T19:30:00.000Z");
  });

  it("should handle invalid date strings", () => {
    const result = timezoneToUtc("invalid date PST");
    expect(result).toBeUndefined();
  });

  it("should handle missing timezone", () => {
    const result = timezoneToUtc("12/13/2024 02:30 PM");
    expect(result).toBeUndefined();
  });

  it("should handle different times of day correctly", () => {
    // Test midnight PST (8am UTC)
    const midnightResult = timezoneToUtc("12/13/2024 12:00 AM PST");
    expect(midnightResult?.toISOString()).toBe("2024-12-13T08:00:00.000Z");

    // Test noon PST (8pm UTC)
    const noonResult = timezoneToUtc("12/13/2024 12:00 PM PST");
    expect(noonResult?.toISOString()).toBe("2024-12-13T20:00:00.000Z");
  });
});

describe("extract mime types", () => {
  it("Can extract mime types from base64 images", async () => {
    const base64Image = await fs.readFile(
      "src/tests/data/langchain_logo.png",
      "base64",
    );
    const mimeType = extractMimeTypeFromBase64(base64Image);
    expect(mimeType).toBe("image/png");
  });
});
