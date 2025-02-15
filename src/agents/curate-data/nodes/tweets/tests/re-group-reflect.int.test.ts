import * as ls from "langsmith/jest";
import fs from "fs";
import { TweetsGroupedByContent } from "../../../types.js";
import { formatInTimeZone } from "date-fns-tz";
import { reflectOnTweetGroups } from "../reflect-tweet-groups.js";
import { reGroupTweets } from "../re-group-tweets.js";

const tweetEvaluator: ls.SimpleEvaluator = () => {
  return {
    key: "tweet_generation",
    score: 1,
  };
};

function loadTweets(): TweetsGroupedByContent[] {
  const tweets = JSON.parse(
    fs.readFileSync(
      // "src/agents/curate-data/nodes/tweets/tests/data/grouped-by-llms/01-19-2025-13-36.json",
      // "src/agents/curate-data/nodes/tweets/tests/data/grouped-by-llms/01-19-2025-13-46.json",
      "src/agents/curate-data/nodes/tweets/tests/data/grouped-by-llms/01-20-2025-13-00.json",
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
    `src/agents/curate-data/nodes/tweets/tests/data/grouped-by-llms/re-grouped/${formattedPSTDate}.json`,
    JSON.stringify(tweets),
  );
}

const tweetsGroupedByContent = loadTweets();

ls.describe("SMA - Curate Data - Reflect and Re-group", () => {
  ls.test(
    "Can reflect and re-group tweets",
    {
      inputs: { tweetsGroupedByContent },
      expected: {},
    },
    async ({ inputs }) => {
      console.log(
        "Starting test with",
        inputs.tweetsGroupedByContent.length,
        "tweet groups",
      );

      const reflectionResult = await reflectOnTweetGroups(inputs as any);

      if (!reflectionResult.similarGroupIndices?.length) {
        console.log("No groups found needing reflection");
        return reflectionResult;
      }
      console.log(
        "reflectionResult.similarGroupIndices\n------------\n",
        reflectionResult.similarGroupIndices,
        "\n------------\n",
      );

      const reGroupResult = await reGroupTweets({
        tweetsGroupedByContent: inputs.tweetsGroupedByContent,
        similarGroupIndices: reflectionResult.similarGroupIndices,
      } as any);

      console.log("reGroupResult\n------------\n");
      console.dir(reGroupResult, { depth: null });
      console.log("\n------------\n");

      await saveTweets(reGroupResult.tweetsGroupedByContent || []);

      await ls.expect(reGroupResult).evaluatedBy(tweetEvaluator).toBe(1);
      return reGroupResult;
    },
  );
});
