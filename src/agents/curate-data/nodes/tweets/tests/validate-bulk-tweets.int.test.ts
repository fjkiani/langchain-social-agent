import fs from "fs";
import * as ls from "langsmith/jest";
import { validateBulkTweets } from "../../validate-bulk-tweets.js";
import { SimpleEvaluator } from "langsmith/jest";
import { formatInTimeZone } from "date-fns-tz";
import { TweetV2 } from "twitter-api-v2";

const tweetEvaluator: SimpleEvaluator = () => {
  return {
    key: "tweet_generation",
    score: 1,
  };
};

function loadTweets(): TweetV2[] {
  const tweets = JSON.parse(
    fs.readFileSync(
      // "src/agents/curate-data/nodes/tweets/tests/data/tweets.json",
      // "src/agents/curate-data/nodes/tweets/tests/data/tweets-2.json",
      "src/agents/curate-data/nodes/tweets/tests/data/tweets-3.json",
      "utf-8",
    ),
  );
  return tweets;
}

function saveRelevantTweets(tweets: TweetV2[]): void {
  try {
    const currentDateUTC = new Date().toISOString();
    const formattedPSTDate = formatInTimeZone(
      currentDateUTC,
      "America/Los_Angeles",
      "MM-dd-yyyy-HH-mm",
    );
    fs.writeFileSync(
      `src/agents/curate-data/nodes/tweets/tests/data/relevant-tweets/relevant-${formattedPSTDate}.json`,
      JSON.stringify(tweets),
    );
  } catch (e) {
    console.error("Failed to save relevant tweets:", e);
    console.log("Tweets:", tweets);
  }
}

const rawTweets = loadTweets();

ls.describe("SMA - Curate Data - Validate Bulk Tweets", () => {
  ls.test(
    "Can validate tweets",
    // You can pass an "iterations" parameter or other LS config here if desired
    {
      inputs: { rawTweets },
      expected: {},
    },
    async ({ inputs }) => {
      console.log("Starting test with", inputs.rawTweets.length, "tweets");
      const result = await validateBulkTweets(inputs as any);
      if (result.validatedTweets?.length === 0) {
        console.log("No tweets were found that are relevant to AI");
        return result;
      }

      saveRelevantTweets(result.validatedTweets || []);
      await ls.expect(result).evaluatedBy(tweetEvaluator).toBe(1);
      return result;
    },
  );
});
