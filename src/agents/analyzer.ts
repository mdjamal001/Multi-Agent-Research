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
  console.log("\nAnalyzing...");

  const context = state.newEvidence
    .map((doc) => {
      const source = doc.source.charAt(0).toUpperCase() + doc.source.slice(1);

      const url = doc.metadata?.url ?? doc.metadata?.source ?? "N/A";

      return `
Source: ${source}

Title: ${doc.title}

Reference: ${url}

Content:
${doc.fullContent ?? doc.content}
`;
    })
    .join("\n\n----------------------------------------\n\n");

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

You are analyzing ONLY the evidence retrieved during the CURRENT research iteration.

Previous iterations have already been analyzed.

Your task is to:

- Extract only NEW information.
- Avoid repeating previous findings.
- Combine information from multiple sources when appropriate.
- Mention disagreements or corroborating evidence if multiple sources discuss the same topic.

Evidence:
${context}
`,
    },
  ]);

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
          title: block.title,
          points: block.points ?? [],
        };
      }),
    })),
  };

  console.log(`Done! Extracted ${analysis.sections.length} sections\n`);

  return {
    analysis: [...state.analysis, analysis],
  };
}
