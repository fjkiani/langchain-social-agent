import "dotenv/config";
import { createLLMAdapter } from "../src/config/llm-adapter.js";
import { 
  RELEVANCY_SCHEMA, 
  VERIFY_COMPANY_RELEVANT_CONTENT_PROMPT,
  verifyGeneralContentIsRelevant 
} from "../src/agents/shared/nodes/verify-general.js";

// Add a check for API key
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY environment variable is not set");
}

const TEST_PROMPT = `You are an AI assistant. Given a number, determine if it's greater than 10.
You must respond in valid JSON format with:
{
  "reasoning": "your explanation here",
  "relevant": true or false
}`;

async function testVerification() {
  // Test content that should be relevant
  const relevantContent = `LangChain announces new LangGraph feature for building AI agents.
    The new feature allows developers to create sophisticated AI agents using LangChain's
    powerful orchestration capabilities. This integration demonstrates LangChain's commitment
    to advancing the field of AI development.`;
  
  // Test content that should not be relevant
  const irrelevantContent = `10 best recipes for chocolate chip cookies.
    Learn how to make the perfect chocolate chip cookies with these tried and tested recipes.
    Includes tips for chewy, crispy, and cake-like variations.`;

  try {
    const model = createLLMAdapter()  // Will use Gemini by default
      .withStructuredOutput(RELEVANCY_SCHEMA, {
        name: "relevancy",
      });

    // Test relevant content
    console.log("\nTesting relevant content:");
    const relevantResult = await model.invoke([
      {
        role: "system",
        content: VERIFY_COMPANY_RELEVANT_CONTENT_PROMPT,
      },
      {
        role: "user",
        content: relevantContent,
      },
    ]);
    console.log("Result:", relevantResult);

    // Test irrelevant content
    console.log("\nTesting irrelevant content:");
    const irrelevantResult = await model.invoke([
      {
        role: "system",
        content: VERIFY_COMPANY_RELEVANT_CONTENT_PROMPT,
      },
      {
        role: "user",
        content: irrelevantContent,
      },
    ]);
    console.log("Result:", irrelevantResult);

  } catch (error) {
    console.error("Error:", error);
  }
}

testVerification().catch(console.error); 