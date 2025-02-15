import fs from "fs";
import * as ls from "langsmith/jest";
import { SimpleEvaluator } from "langsmith/jest";
import { TweetV2 } from "twitter-api-v2";
import { groupTweetsByContent } from "../group-tweets-by-content.js";
import { TweetsGroupedByContent } from "../../../types.js";
import { formatInTimeZone } from "date-fns-tz";

const tweetEvaluator: SimpleEvaluator = () => {
  return {
    key: "tweet_generation",
    score: 1,
  };
};

function loadTweets(): TweetV2[] {
  const tweets = JSON.parse(
    fs.readFileSync(
      // "src/agents/curate-data/nodes/tweets/tests/data/relevant-tweets/relevant-01-17-2025-12-10.json",
      // "src/agents/curate-data/nodes/tweets/tests/data/relevant-tweets/relevant-01-19-2025-12-59.json",
      "src/agents/curate-data/nodes/tweets/tests/data/relevant-tweets/relevant-01-20-2025-11-28.json",
      "utf-8",
    ),
  );
  return tweets;
}

async function saveTweets(tweets: TweetsGroupedByContent[]) {
  const currentDateUTC = new Date().toISOString();
  const formattedPSTDate = formatInTimeZone(
    currentDateUTC,
    "America/Los_Angeles",
    "MM-dd-yyyy-HH-mm",
  );
  await fs.promises.writeFile(
    `src/agents/curate-data/nodes/tweets/tests/data/grouped-by-llms/${formattedPSTDate}.json`,
    JSON.stringify(tweets),
  );
}

const validatedTweets = loadTweets();

ls.describe("SMA - Curate Data - Group By Content", () => {
  ls.test(
    "Can group tweets",
    {
      inputs: { validatedTweets },
      expected: {},
    },
    async ({ inputs }) => {
      console.log(
        "Starting test with",
        inputs.validatedTweets.length,
        "tweets",
      );

      const result = await groupTweetsByContent(inputs as any);

      if (!result.tweetsGroupedByContent?.length) {
        console.log("No tweets were found that are relevant to AI");
        return result;
      }

      await saveTweets(result.tweetsGroupedByContent || []);

      await ls.expect(result).evaluatedBy(tweetEvaluator).toBe(1);
      return result;
    },
  );
});
