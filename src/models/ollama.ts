import { ChatOllama } from "@langchain/ollama";

const baseUrl =
  process.env.OLLAMA_BASE_URL ||
  (process.env.DB_HOST === "host.docker.internal" || process.env.NODE_ENV === "production"
    ? "http://host.docker.internal:11434"
    : "http://127.0.0.1:11434");

export const llm = new ChatOllama({
  baseUrl,
  model: process.env.OLLAMA_MODEL || "qwen3.5:4b",
  temperature: 0.1,
  think: false,
});
