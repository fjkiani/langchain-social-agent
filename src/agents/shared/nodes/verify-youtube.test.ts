import { jest } from '@jest/globals';
import { verifyYouTubeContentIsRelevant } from "./verify-youtube.js";
import { createLLMAdapter, LLMResponse } from "../../../config/llm-adapter.js";

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
        "reasoning": "This video demonstrates LangChain usage",
        "relevant": true
      }`,
      parsed: {
        reasoning: "This video demonstrates LangChain usage",
        relevant: true
      }
    } as RelevancyResponse)
  } satisfies MockedLLMAdapter))
}));

describe("verifyYouTubeContentIsRelevant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle parsed response correctly", async () => {
    const result = await verifyYouTubeContentIsRelevant(
      "Test video about LangChain"
    );

    expect(result).toBe(true);

    const mockAdapter = (createLLMAdapter as jest.Mock)() as MockedLLMAdapter;
    expect(mockAdapter.invoke).toHaveBeenCalledWith([
      {
        role: "system",
        content: expect.stringContaining("marketing employee"),
      },
      {
        role: "user",
        content: "Test video about LangChain",
      },
    ]);
  });

  it("should handle falsy response", async () => {
    const mockAdapter = (createLLMAdapter as jest.Mock)() as MockedLLMAdapter;
    mockAdapter.invoke.mockResolvedValueOnce({
      content: "test response",
      parsed: {
        reasoning: "not relevant",
        relevant: false
      }
    });

    const result = await verifyYouTubeContentIsRelevant(
      "Unrelated video content"
    );

    expect(result).toBe(false);
  });

  it("should handle missing parsed data safely", async () => {
    // Override mock to simulate missing parsed data
    const mockAdapter = (createLLMAdapter as jest.Mock)();
    mockAdapter.invoke.mockResolvedValueOnce({
      content: "test response",
      // No parsed data
    });

    const result = await verifyYouTubeContentIsRelevant(
      "Test content"
    );

    expect(result).toBe(false); // Should default to false
  });
}); 