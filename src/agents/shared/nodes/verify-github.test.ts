import { verifyGitHubContentIsRelevant } from "./verify-github.js";
import { createLLMAdapter, LLMResponse } from "../../../config/llm-adapter.js";
import { jest } from '@jest/globals';

// Define types for our mocks
type RelevancyResponse = LLMResponse<{ reasoning: string; relevant: boolean }>;
type MockedLLMAdapter = {
  withStructuredOutput: jest.Mock;
  withConfig: jest.Mock;
  invoke: jest.Mock<Promise<RelevancyResponse>>;
};

// Mock the LLM adapter
jest.mock("../../../config/llm-adapter.js", () => ({
  createLLMAdapter: jest.fn(() => ({
    withStructuredOutput: jest.fn().mockReturnThis(),
    withConfig: jest.fn().mockReturnThis(),
    invoke: jest.fn().mockResolvedValue({
      content: `{
        "reasoning": "This repository uses LangChain in its dependencies",
        "relevant": true
      }`,
      parsed: {
        reasoning: "This repository uses LangChain in its dependencies",
        relevant: true
      }
    } as RelevancyResponse)
  }))
}));

describe("verifyGitHubContentIsRelevant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should detect LangChain usage in dependencies", async () => {
    const mockDependencies = [{
      fileName: "requirements.txt",
      fileContents: "langchain==0.1.0\npython-dotenv"
    }];

    const result = await verifyGitHubContentIsRelevant({
      contents: "# My Project\nThis project uses LangChain for AI",
      fileType: "README",
      dependencyFiles: mockDependencies,
    });

    expect(result).toBe(true);
    
    // Verify the prompt includes dependency information
    const mockAdapter = (createLLMAdapter as jest.Mock)() as MockedLLMAdapter;
    const invokeCall = mockAdapter.invoke.mock.calls[0][0] as Array<{role: string; content: string}>;
    expect(invokeCall[0].content).toContain("requirements.txt");
    expect(invokeCall[0].content).toContain("langchain==0.1.0");
  });

  it("should handle repositories without LangChain usage", async () => {
    const mockAdapter = (createLLMAdapter as jest.Mock)() as MockedLLMAdapter;
    mockAdapter.invoke.mockResolvedValueOnce({
      content: `{
        "reasoning": "This repository does not use or implement LangChain",
        "relevant": false
      }`,
      parsed: {
        reasoning: "This repository does not use or implement LangChain",
        relevant: false
      }
    });

    const result = await verifyGitHubContentIsRelevant({
      contents: "# Other Project\nThis is an unrelated project",
      fileType: "README",
      dependencyFiles: undefined,
    });

    expect(result).toBe(false);
  });

  it("should handle malformed LLM responses", async () => {
    const mockAdapter = (createLLMAdapter as jest.Mock)() as MockedLLMAdapter;
    mockAdapter.invoke.mockResolvedValueOnce({
      content: "Invalid response",
      // No parsed data
    });

    const result = await verifyGitHubContentIsRelevant({
      contents: "test content",
      fileType: "README",
      dependencyFiles: undefined,
    });

    expect(result).toBe(false);
  });

  it("should properly format dependency information in prompt", async () => {
    const mockDependencies = [
      {
        fileName: "package.json",
        fileContents: '{"dependencies": {"langchain": "^0.1.0"}}'
      },
      {
        fileName: "requirements.txt",
        fileContents: "langchain==0.1.0"
      }
    ];

    await verifyGitHubContentIsRelevant({
      contents: "test content",
      fileType: "README",
      dependencyFiles: mockDependencies,
    });

    // Verify prompt formatting
    const mockAdapter = (createLLMAdapter as jest.Mock)() as MockedLLMAdapter;
    const invokeCall = mockAdapter.invoke.mock.calls[0][0] as Array<{role: string; content: string}>;
    const systemMessage = invokeCall[0].content;
    
    expect(systemMessage).toContain("```package.json");
    expect(systemMessage).toContain("```requirements.txt");
    expect(systemMessage).toContain("langchain");
  });
}); 