import { jest } from "@jest/globals";
import { z } from "zod";
import { geminiPro } from "./llm.js";
import { createLLMAdapter } from "./llm-adapter.js";

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
  beforeEach(() => {
    jest.spyOn(geminiPro, "generateContent").mockImplementation(((
      params: GeminiParams,
    ) => {
      const text = params.contents[0].parts[0].text;
      if (text.includes("Invalid JSON:")) {
        return Promise.resolve({
          response: {
            text: () => "This is not JSON",
          },
        });
      } else if (text.includes("Non-schema:")) {
        return Promise.resolve({
          response: {
            text: () =>
              `{"someOtherField": "value", "notInResponse": "not_a_boolean"}`,
          },
        });
      }
      return Promise.resolve({
        response: {
          text: () => `{"reasoning": "test reasoning", "relevant": true}`,
        },
      });
    }) as typeof geminiPro.generateContent);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    ).rejects.toThrow(/Failed to validate response/);
  });

  it("should handle non-schema conforming JSON", async () => {
    const model = createLLMAdapter().withStructuredOutput(TEST_SCHEMA, {
      name: "schema-test",
    });

    await expect(
      model.invoke([
        {
          role: "user",
          content: "Non-schema: return unexpected fields",
        },
      ]),
    ).rejects.toThrow(/Failed to validate response/);
  });
});
