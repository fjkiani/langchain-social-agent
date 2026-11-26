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
        "reasoning": "This repository uses LangChain in its dependencies",
        "relevant": true
      }`,
  parsed: {
    reasoning: "This repository uses LangChain in its dependencies",
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

const { verifyGitHubContentIsRelevant } = await import("./verify-github.js");
const { createLLMAdapter } = await import("../../../config/llm-adapter.js");

describe("verifyGitHubContentIsRelevant", () => {
  beforeEach(() => {
    mockState.adapter = null;
    (createLLMAdapter as jest.Mock).mockImplementation(() =>
      createMockAdapter(),
    );
  });

  it("should detect LangChain usage in dependencies", async () => {
    const mockDependencies = [
      {
        fileName: "requirements.txt",
        fileContents: "langchain==0.1.0\npython-dotenv",
      },
    ];

    const result = await verifyGitHubContentIsRelevant({
      contents: "# My Project\nThis project uses LangChain for AI",
      fileType: "README",
      dependencyFiles: mockDependencies,
    });

    expect(result).toBe(true);

    const invokeCall = mockState.adapter!.invoke.mock.calls[0][0] as Array<{
      role: string;
      content: string;
    }>;
    expect(invokeCall[0].content).toContain("requirements.txt");
    expect(invokeCall[0].content).toContain("langchain==0.1.0");
  });

  it("should handle repositories without LangChain usage", async () => {
    (createLLMAdapter as jest.Mock).mockImplementation(() =>
      createMockAdapter({
        content: `{
        "reasoning": "This repository does not use or implement LangChain",
        "relevant": false
      }`,
        parsed: {
          reasoning: "This repository does not use or implement LangChain",
          relevant: false,
        },
      }),
    );

    const result = await verifyGitHubContentIsRelevant({
      contents: "# Other Project\nThis is an unrelated project",
      fileType: "README",
      dependencyFiles: undefined,
    });

    expect(result).toBe(false);
  });

  it("should handle malformed LLM responses", async () => {
    (createLLMAdapter as jest.Mock).mockImplementation(() =>
      createMockAdapter({
        content: "Invalid response",
      }),
    );

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
        fileContents: '{"dependencies": {"langchain": "^0.1.0"}}',
      },
      {
        fileName: "requirements.txt",
        fileContents: "langchain==0.1.0",
      },
    ];

    await verifyGitHubContentIsRelevant({
      contents: "test content",
      fileType: "README",
      dependencyFiles: mockDependencies,
    });

    const invokeCall = mockState.adapter!.invoke.mock.calls[0][0] as Array<{
      role: string;
      content: string;
    }>;
    const systemMessage = invokeCall[0].content;

    expect(systemMessage).toContain("```package.json");
    expect(systemMessage).toContain("```requirements.txt");
    expect(systemMessage).toContain("langchain");
  });
});
