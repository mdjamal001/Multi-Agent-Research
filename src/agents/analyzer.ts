import { z } from "zod";
import { llm } from "../models/gemini";
import { analyzerPrompt } from "../prompts/analyzer";
import { ResearchState } from "../graph/state";

const schema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      paragraphs: z.array(z.string()),
      points_title: z.string(),
      points: z.array(z.string()),
    }),
  ),
});

const structuredLLM = llm.withStructuredOutput(schema);

export async function analyzer(state: typeof ResearchState.State) {
  console.log("Analyzing...");

  const context = state.newDocuments
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

- You are analyzing only the documents retrieved during the current research iteration.
- Assume that previous iterations have already been analyzed.
- Extract only the new information introduced by these documents.
- Do not restate facts unless the new documents provide additional evidence, corrections, or deeper insights.

Documents:
${context}
`,
    },
  ]);

  console.log(`Done! Extracted ${analysis.sections.length} outcomes\n`);

  return {
    analysis: [analysis],
  };
}
