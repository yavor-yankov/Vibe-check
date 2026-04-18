import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey"
    );
  }
  return new GoogleGenerativeAI(key);
}

// gemini-2.5-flash has the best quality/speed tradeoff on the free tier.
// Override via GEMINI_MODEL env var if you hit quota issues (e.g. use
// gemini-2.5-flash-lite or gemini-flash-latest).
export const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
