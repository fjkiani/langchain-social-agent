import "dotenv/config";
import * as ls from "langsmith/jest";
import { type SimpleEvaluator } from "langsmith/jest";
import { getTweetContent } from "../get-tweet-content.js";

const checkCorrectTweetContents: SimpleEvaluator = ({ expected, actual }) => {
  const { tweetContent, tweetContentUrls, imageOptions } = actual as {
    tweetContent: string;
    tweetContentUrls: string[];
    imageOptions: string[];
  };

  const lengthDifference = Math.abs(
    tweetContent.length - expected.tweetContent.length,
  );
  if (lengthDifference > 10) {
    console.log("tweet content length differs by more than 10 characters");
    console.log("tweet content length:\n", tweetContent.length);
    console.log("\n\n---\n\n");
    console.log(
      "expected tweet content length:\n",
      expected.tweetContent.length,
    );
    console.log("difference:\n", lengthDifference);
    return {
      key: "tweet_content",
      score: 0,
    };
  }

  if (
    tweetContentUrls.every((url) => !expected.tweetContentUrls.includes(url))
  ) {
    console.log(
      "tweet content urls does NOT match expected tweet content urls",
    );
    console.log("tweet content urls:\n", tweetContentUrls);
    console.log("\n\n---\n\n");
    console.log("expected tweet content urls:\n", expected.tweetContentUrls);
    return {
      key: "tweet_content",
      score: 0,
    };
  }

  if (imageOptions.every((url) => !expected.imageOptions.includes(url))) {
    console.log("image options does NOT match expected image options");
    console.log("image options:\n", imageOptions);
    console.log("\n\n---\n\n");
    console.log("expected image options:\n", expected.imageOptions);
    return {
      key: "tweet_content",
      score: 0,
    };
  }

  return {
    key: "tweet_content",
    score: 1,
  };
};

const TEST_EACH_INPUTS_OUTPUTS = [
  {
    inputs: {
      link: "https://x.com/EdenEmarco177/status/1874884500062122296",
    },
    expected: {
      tweetContent: `Just casually sipping coffee with 4 Gen AI legends solving multi-agent systems 🤖☕️
    
@assaf_elovic Head of AI @mondaydotcom creator of GPT Researcher🔎 
https://t.co/vEhroGRmWa
@ulidabess @ataiiam co founders of @CopilotKit 🪁
@NirDiamantAI founder of DiamantAI and creator of 
https://t.co/cKNjHuTG9V
and 
https://t.co/D8wpEN4LJa

Still pinching myself - did this actually happen? 🤖

Shoutout to the @LangChainAI 🦜🔗Ecosystem for bringing us together`,
      imageOptions: ["https://pbs.twimg.com/media/GgTtE-oXoAAxe3n.jpg"],
      tweetContentUrls: [
        "https://github.com/NirDiamant/RAG_Techniques",
        "https://github.com/NirDiamant/GenAI_Agents",
        "https://github.com/assafelovic/gpt-researcher",
      ],
    },
  },
];

ls.describe("SMA - Verify Tweet - Get Tweet Content", () => {
  ls.test.each(TEST_EACH_INPUTS_OUTPUTS)(
    "Should get the full content, urls and attachments",
    async ({ inputs }) => {
      // Import and run your app, or some part of it here
      const result = await getTweetContent(inputs as any);
      const evalResult = ls
        .expect(result)
        .evaluatedBy(checkCorrectTweetContents);
      await evalResult.toBe(1);
      return result;
    },
  );
});
