import { verifyGitHubContentIsRelevant } from "./verify-github.js";

describe("GitHub Content Verification Integration", () => {
  it("should correctly identify LangChain usage", async () => {
    const result = await verifyGitHubContentIsRelevant({
      contents: `# LangChain Project
This project demonstrates the use of LangChain for building AI applications.

## Features
- Uses LangChain for chat
- Implements LangChain agents
- Built with TypeScript
      `,
      fileType: "README",
      dependencyFiles: [{
        fileName: "package.json",
        fileContents: '{"dependencies": {"langchain": "^0.1.0"}}'
      }],
    });

    expect(result).toBe(true);
  }, 30000);

  // Add test to verify Gemini's reasoning
  it("should provide detailed reasoning for relevance", async () => {
    console.log("Testing Gemini's reasoning capabilities...");
    const result = await verifyGitHubContentIsRelevant({
      contents: `# AI Project
A project that might use LangChain.

## Dependencies
Check package.json for details.
      `,
      fileType: "README",
      dependencyFiles: [{
        fileName: "package.json",
        fileContents: '{"dependencies": {"@langchain/core": "^0.1.0"}}'
      }],
    });

    // Log the response to see Gemini's reasoning
    console.log("Gemini's evaluation:", result);
  }, 30000);

  it("should reject unrelated content", async () => {
    const result = await verifyGitHubContentIsRelevant({
      contents: `# Express Project
A simple web application using Express.js
      `,
      fileType: "README",
      dependencyFiles: [{
        fileName: "package.json",
        fileContents: '{"dependencies": {"express": "^4.17.1"}}'
      }],
    });

    expect(result).toBe(false);
  }, 30000);
}); 