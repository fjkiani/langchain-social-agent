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

export const geminiPro = new Proxy({} as GenerativeModel, {
  get(_target, prop, receiver) {
    if (!_geminiPro) {
      _geminiPro = getClient().getGenerativeModel({
        model: "gemini-pro",
        generationConfig: { temperature: 0 },
      });
    }
    const value = Reflect.get(_geminiPro as object, prop, receiver);
    return typeof value === "function" ? value.bind(_geminiPro) : value;
  },
});

export const geminiProVision = new Proxy({} as GenerativeModel, {
  get(_target, prop, receiver) {
    if (!_geminiProVision) {
      _geminiProVision = getClient().getGenerativeModel({
        model: "gemini-pro-vision",
        generationConfig: { temperature: 0 },
      });
    }
    const value = Reflect.get(_geminiProVision as object, prop, receiver);
    return typeof value === "function" ? value.bind(_geminiProVision) : value;
  },
});
