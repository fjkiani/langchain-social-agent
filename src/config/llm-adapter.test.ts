import { jest } from '@jest/globals';
import { z } from "zod";
import { createLLMAdapter } from "./llm-adapter.js";

// Add interface for Gemini params
interface GeminiParams {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

// --- Added mock for geminiPro ---
jest.mock("./llm.js", () => ({
  geminiPro: {
    generateContent: jest.fn((params: GeminiParams) => {
      const text = params.contents[0].parts[0].text;
      if (text.includes("Invalid JSON:")) {
        // Return a response that does not contain any JSON
        return Promise.resolve({
          response: {
            text: () => "This is not JSON"
          }
        });
      } else if (text.includes("Non-schema:")) {
        // Return a valid JSON that does not conform to the expected schema
        return Promise.resolve({
          response: {
            text: () =>
              `{"someOtherField": "value", "notInResponse": "not_a_boolean"}`
          }
        });
      }
      // Otherwise, return a valid response.
      return Promise.resolve({
        response: {
          text: () =>
            `{"reasoning": "test reasoning", "relevant": true}`
        }
      });
    })
  }
}));
// --- end of geminiPro mock ---

const TEST_SCHEMA = z.object({
  reasoning: z.string(),
  relevant: z.boolean(),
});

describe("LLM Adapter", () => {
  it("should handle structured output correctly", async () => {
    const model = createLLMAdapter()
      .withStructuredOutput(TEST_SCHEMA, {
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
    const model = createLLMAdapter()
      .withStructuredOutput(TEST_SCHEMA, {
        name: "error-test",
      });

    // Use a prompt that includes "Invalid JSON:" to trigger that branch
    await expect(
      model.invoke([
        {
          role: "user",
          content: "Invalid JSON: Just say hello",
        },
      ])
    ).rejects.toThrow();
  });

  it("should handle non-schema-conforming response", async () => {
    const differentSchema = z.object({
      someOtherField: z.string(),
      notInResponse: z.boolean(),
    });

    const model = createLLMAdapter()
      .withStructuredOutput(differentSchema, {
        name: "error-test",
      });

    // Use a prompt that includes "Non-schema:" to trigger the non-conforming branch
    await expect(
      model.invoke([
        {
          role: "user",
          content: "Non-schema: Just say hello",
        },
      ])
    ).rejects.toThrow();
  });
}); 