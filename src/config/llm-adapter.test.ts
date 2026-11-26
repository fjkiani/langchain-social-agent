import { jest } from "@jest/globals";
import { z } from "zod";
import { createLLMAdapter } from "./llm-adapter.js";
import { geminiPro } from "./llm.js";

// Add interface for Gemini params
interface GeminiParams {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

const TEST_SCHEMA = z.object({
  reasoning: z.string(),
  relevant: z.boolean(),
});

describe("LLM Adapter", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let generateContentSpy: jest.SpiedFunction<any>;

  beforeEach(() => {
    generateContentSpy = jest
      .spyOn(geminiPro, "generateContent")
      .mockImplementation((params: unknown) => {
        const text = (params as GeminiParams).contents[0].parts[0].text;
        if (text.includes("Invalid JSON:")) {
          return Promise.resolve({
            response: {
              text: () => "This is not JSON",
            },
          }) as ReturnType<typeof geminiPro.generateContent>;
        }
        if (text.includes("Non-schema:")) {
          return Promise.resolve({
            response: {
              text: () =>
                `{"someOtherField": "value", "notInResponse": "not_a_boolean"}`,
            },
          }) as ReturnType<typeof geminiPro.generateContent>;
        }
        return Promise.resolve({
          response: {
            text: () => `{"reasoning": "test reasoning", "relevant": true}`,
          },
        }) as ReturnType<typeof geminiPro.generateContent>;
      });
  });

  afterEach(() => {
    generateContentSpy.mockRestore();
  });

  it("should handle structured output correctly", async () => {
    const model = createLLMAdapter().withStructuredOutput(TEST_SCHEMA, {
      name: "test",
    });

    const result = await model.invoke([
      {
        role: "user",
        content: "Is 15 greater than 10?",
      },
    ]);

    expect(result.parsed).toBeDefined();
    expect(typeof result.parsed?.reasoning).toBe("string");
    expect(typeof result.parsed?.relevant).toBe("boolean");
    expect(result.parsed?.relevant).toBe(true);
  });

  it("should handle invalid JSON response", async () => {
    const model = createLLMAdapter().withStructuredOutput(TEST_SCHEMA, {
      name: "error-test",
    });

    await expect(
      model.invoke([
        {
          role: "user",
          content: "Invalid JSON: Just say hello",
        },
      ]),
    ).rejects.toThrow();
  });

  it("should handle non-schema-conforming response", async () => {
    const differentSchema = z.object({
      someOtherField: z.string(),
      notInResponse: z.boolean(),
    });

    const model = createLLMAdapter().withStructuredOutput(differentSchema, {
      name: "error-test",
    });

    await expect(
      model.invoke([
        {
          role: "user",
          content: "Non-schema: Just say hello",
        },
      ]),
    ).rejects.toThrow();
  });
});
