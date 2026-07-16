import { z } from "zod";
import { llm } from "../models/gemini";
import { analyzerPrompt } from "../prompts/analyzer";
import { ResearchState } from "../graph/state";
import { Analysis } from "../types/analysis";

const contentSchema = z.object({
  type: z.enum(["paragraph", "bullet"]),
  title: z.string(),
  paragraphs: z.array(z.string()).optional(),
  points: z.array(z.string()).optional(),
});

const schema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      content: z.array(contentSchema),
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

  const rawAnalysis = await structuredLLM.invoke([
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
- Assume previous iterations have already been analyzed.
- Extract only the new information introduced by these documents.
- Do not restate facts unless the new documents provide additional evidence, corrections, or deeper insights.

Documents:
${context}
`,
    },
  ]);

  // Normalize Gemini output into the strict internal Analysis type
  const analysis: Analysis = {
    sections: rawAnalysis.sections.map((section) => ({
      title: section.title,
      summary: section.summary,
      content: section.content.map((block) => {
        if (block.type === "paragraph") {
          return {
            type: "paragraph" as const,
            paragraphs: block.paragraphs ?? [],
          };
        }

        return {
          type: "bullet" as const,
          title: block.title ?? "",
          points: block.points ?? [],
        };
      }),
    })),
  };

  console.log(`Done! Extracted ${analysis.sections.length} sections\n`);

  return {
    analysis: [analysis],
  };
}
