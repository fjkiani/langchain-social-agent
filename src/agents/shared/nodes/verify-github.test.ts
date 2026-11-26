import { jest } from "@jest/globals";
import { verifyGitHubContentIsRelevant } from "./verify-github.js";
import { geminiPro } from "../../../config/llm.js";

interface GeminiParams {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

describe("verifyGitHubContentIsRelevant", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let generateContentSpy: jest.SpiedFunction<any>;

  beforeEach(() => {
    generateContentSpy = jest
      .spyOn(geminiPro, "generateContent")
      .mockImplementation((params: unknown) => {
        const text = (params as GeminiParams).contents[0].parts[0].text;
        if (text.includes("Other Project") || text.includes("Unrelated")) {
          return Promise.resolve({
            response: {
              text: () =>
                `{"reasoning":"This repository does not use or implement LangChain","relevant":false}`,
            },
          }) as ReturnType<typeof geminiPro.generateContent>;
        }
        if (text.includes("Invalid") || text === "Invalid response") {
          return Promise.resolve({
            response: {
              text: () => "Invalid response",
            },
          }) as ReturnType<typeof geminiPro.generateContent>;
        }
        return Promise.resolve({
          response: {
            text: () =>
              `{"reasoning":"This repository uses LangChain in its dependencies","relevant":true}`,
          },
        }) as ReturnType<typeof geminiPro.generateContent>;
      });
  });

  afterEach(() => {
    generateContentSpy.mockRestore();
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

    const callArg = generateContentSpy.mock.calls[0][0] as GeminiParams;
    const promptText = callArg.contents[0].parts[0].text;
    expect(promptText).toContain("requirements.txt");
    expect(promptText).toContain("langchain==0.1.0");
  });

  it("should handle repositories without LangChain usage", async () => {
    const result = await verifyGitHubContentIsRelevant({
      contents: "# Other Project\nThis is an unrelated project",
      fileType: "README",
      dependencyFiles: undefined,
    });

    expect(result).toBe(false);
  });

  it("should handle malformed LLM responses", async () => {
    generateContentSpy.mockImplementationOnce(
      () =>
        Promise.resolve({
          response: {
            text: () => "Invalid response",
          },
        }) as ReturnType<typeof geminiPro.generateContent>,
    );

    await expect(
      verifyGitHubContentIsRelevant({
        contents: "# Test Project",
        fileType: "README",
        dependencyFiles: undefined,
      }),
    ).rejects.toThrow();
  });
});
