import { jest } from "@jest/globals";
import type { LLMResponse } from "../../../config/llm-adapter.js";

type RelevancyResponse = LLMResponse<{ reasoning: string; relevant: boolean }>;
type MockedLLMAdapter = {
  withStructuredOutput: jest.Mock;
  withConfig: jest.Mock;
  invoke: jest.Mock;
};

const defaultResponse: RelevancyResponse = {
  content: `{
        "reasoning": "This video demonstrates LangChain usage",
        "relevant": true
      }`,
  parsed: {
    reasoning: "This video demonstrates LangChain usage",
    relevant: true,
  },
};

const mockState: { adapter: MockedLLMAdapter | null } = { adapter: null };

function createMockAdapter(
  response:
    | RelevancyResponse
    | Omit<RelevancyResponse, "parsed"> = defaultResponse,
): MockedLLMAdapter {
  const adapter: MockedLLMAdapter = {
    withStructuredOutput: jest.fn(),
    withConfig: jest.fn(),
    invoke: jest.fn(async () => response),
  };
  adapter.withStructuredOutput.mockImplementation(() => adapter);
  adapter.withConfig.mockImplementation(() => adapter);
  mockState.adapter = adapter;
  return adapter;
}

await jest.unstable_mockModule("../../../config/llm-adapter.js", () => ({
  createLLMAdapter: jest.fn(() => createMockAdapter()),
}));

const { verifyYouTubeContentIsRelevant } = await import("./verify-youtube.js");
const { createLLMAdapter } = await import("../../../config/llm-adapter.js");

describe("verifyYouTubeContentIsRelevant", () => {
  beforeEach(() => {
    mockState.adapter = null;
    (createLLMAdapter as jest.Mock).mockImplementation(() =>
      createMockAdapter(),
    );
  });

  it("should handle parsed response correctly", async () => {
    const result = await verifyYouTubeContentIsRelevant(
      "Test video about LangChain",
    );

    expect(result).toBe(true);

    expect(mockState.adapter!.invoke).toHaveBeenCalledWith([
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
    (createLLMAdapter as jest.Mock).mockImplementation(() =>
      createMockAdapter({
        content: "test response",
        parsed: {
          reasoning: "not relevant",
          relevant: false,
        },
      }),
    );

    const result = await verifyYouTubeContentIsRelevant(
      "Unrelated video content",
    );

    expect(result).toBe(false);
  });

  it("should handle missing parsed data safely", async () => {
    (createLLMAdapter as jest.Mock).mockImplementation(() =>
      createMockAdapter({
        content: "test response",
      }),
    );

    const result = await verifyYouTubeContentIsRelevant("Test content");

    expect(result).toBe(false);
  });
});
