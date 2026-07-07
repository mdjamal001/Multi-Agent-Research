import { z } from "zod";
import { llm } from "../models/gemini";
import { analyzerPrompt } from "../prompts/analyzer";
import { ResearchState } from "../graph/state";

const schema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  limitations: z.array(z.string()),
});

const structuredLLM = llm.withStructuredOutput(schema);

export async function analyzer(state: typeof ResearchState.State) {
  console.log("Analyzing...");

  const context = state.documents
    .map(
      (doc) => `
Title: ${doc.title}

URL: ${doc.url}

Content:
${doc.fullContent ?? doc.content}
`,
    )
    .join("\n\n");

  const analysis = await structuredLLM.invoke([
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
    analysis,
  };
}
