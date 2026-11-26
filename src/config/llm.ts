import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let _genAI: GoogleGenerativeAI | null = null;
let _geminiPro: GenerativeModel | null = null;
let _geminiProVision: GenerativeModel | null = null;

function getClient(): GoogleGenerativeAI {
  if (_genAI) return _genAI;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }
  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

function getGeminiPro(): GenerativeModel {
  if (!_geminiPro) {
    _geminiPro = getClient().getGenerativeModel({
      model: "gemini-pro",
      generationConfig: { temperature: 0 },
    });
  }
  return _geminiPro;
}

function getGeminiProVision(): GenerativeModel {
  if (!_geminiProVision) {
    _geminiProVision = getClient().getGenerativeModel({
      model: "gemini-pro-vision",
      generationConfig: { temperature: 0 },
    });
  }
  return _geminiProVision;
}

/**
 * Lazy Gemini handles. Tests can replace `generateContent` on these objects
 * via `jest.mock("./llm.js")` without requiring GOOGLE_API_KEY at import time.
 */
export const geminiPro = {
  generateContent: (...args: Parameters<GenerativeModel["generateContent"]>) =>
    getGeminiPro().generateContent(...args),
} as Pick<GenerativeModel, "generateContent">;

export const geminiProVision = {
  generateContent: (...args: Parameters<GenerativeModel["generateContent"]>) =>
    getGeminiProVision().generateContent(...args),
} as Pick<GenerativeModel, "generateContent">;
