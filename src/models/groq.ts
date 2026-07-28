import { ChatGroq } from "@langchain/groq";

const apiKey = process.env.GROQ_API_KEY;

export const llm = new ChatGroq({
  apiKey: apiKey && apiKey.trim().length > 0 ? apiKey : "dummy_groq_key_placeholder",
  model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  temperature: 0.1,
});
