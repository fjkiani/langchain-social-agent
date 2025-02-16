import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiPro = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  generationConfig: {
    temperature: 0,
  }
});

export const geminiProVision = genAI.getGenerativeModel({ 
  model: "gemini-pro-vision",
  generationConfig: {
    temperature: 0,
  }
}); 