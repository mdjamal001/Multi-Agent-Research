import { llm } from "../models/gemini";
import { analyzerPrompt } from "../prompts/analyzer";
import { ResearchState } from "../graph/state";

export async function analyzer(state: typeof ResearchState.State) {
  console.log("Analyzing...");

  const context = state.verifiedDocuments
    .map((doc) => `Title: ${doc.title}\n${doc.content}`)
    .join("\n\n");

  const response = await llm.invoke([
    {
      role: "system",
      content: analyzerPrompt,
    },
    {
      role: "user",
      content: `
    Question:
    ${state.query}

    Documents:
    ${context}
    `,
    },
  ]);

  console.log("Done!\n");

  return {
    analysis: JSON.parse(response.text),
  };
}
