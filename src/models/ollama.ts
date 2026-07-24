import { ChatOllama } from "@langchain/ollama";

export const llm = new ChatOllama({
  model: "qwen3.5:4b",
  temperature: 0.1,
  think: false,
});
