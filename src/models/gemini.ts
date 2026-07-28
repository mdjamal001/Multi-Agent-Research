import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
export const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  apiKey: apiKey && apiKey.trim().length > 0 ? apiKey : "dummy_key_placeholder",
  temperature: 0.1,
});
