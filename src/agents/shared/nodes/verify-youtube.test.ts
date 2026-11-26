import { jest } from "@jest/globals";
import { verifyYouTubeContentIsRelevant } from "./verify-youtube.js";
import { geminiPro } from "../../../config/llm.js";

interface GeminiParams {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

describe("verifyYouTubeContentIsRelevant", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let generateContentSpy: jest.SpiedFunction<any>;

  beforeEach(() => {
    generateContentSpy = jest
      .spyOn(geminiPro, "generateContent")
      .mockImplementation((params: unknown) => {
        const text = (params as GeminiParams).contents[0].parts[0].text;
        if (text.includes("Unrelated")) {
          return Promise.resolve({
            response: {
              text: () => `{"reasoning":"not relevant","relevant":false}`,
            },
          }) as ReturnType<typeof geminiPro.generateContent>;
        }
        return Promise.resolve({
          response: {
            text: () =>
              `{"reasoning":"This video demonstrates LangChain usage","relevant":true}`,
          },
        }) as ReturnType<typeof geminiPro.generateContent>;
      });
  });

  afterEach(() => {
    generateContentSpy.mockRestore();
  });

  it("should handle parsed response correctly", async () => {
    const result = await verifyYouTubeContentIsRelevant(
      "Test video about LangChain",
    );

    expect(result).toBe(true);

    const callArg = generateContentSpy.mock.calls[0][0] as GeminiParams;
    const promptText = callArg.contents[0].parts[0].text;
    expect(promptText).toContain("marketing employee");
    expect(promptText).toContain("Test video about LangChain");
  });

  it("should handle falsy response", async () => {
    const result = await verifyYouTubeContentIsRelevant(
      "Unrelated video content",
    );

    expect(result).toBe(false);
  });

  it("should handle missing parsed data safely", async () => {
    generateContentSpy.mockImplementationOnce(
      () =>
        Promise.resolve({
          response: {
            text: () => "test response",
          },
        }) as ReturnType<typeof geminiPro.generateContent>,
    );

    await expect(
      verifyYouTubeContentIsRelevant("Test content"),
    ).rejects.toThrow();
  });
});
