import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: apiKey && apiKey.trim().length > 0 ? apiKey : "dummy_key_placeholder",
  modelName: "gemini-embedding-001",
});
