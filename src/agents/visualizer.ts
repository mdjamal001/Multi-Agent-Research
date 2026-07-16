import { z } from "zod";

import { llm } from "../models/gemini";
import { ResearchState } from "../graph/state";
import { visualizerPrompt } from "../prompts/visualizer";
import { Visualization } from "../types/visualization";
import { renderCharts } from "../visualizations/renderCharts";

const schema = z.object({
  visualizations: z.array(
    z.object({
      section: z.string(),

      type: z.enum(["bar", "line", "pie", "table"]),

      title: z.string(),

      caption: z.string(),

      xAxis: z.string().optional(),

      yAxis: z.string().optional(),

      data: z.array(
        z.object({
          label: z.union([z.string(), z.number()]),
          value: z.union([z.string(), z.number()]),
        }),
      ),
    }),
  ),
});

const structuredLLM = llm.withStructuredOutput(schema);

export async function visualizer(state: typeof ResearchState.State) {
  console.log("Generating visualizations...");

  const context = state.analysis
    .map((analysis) =>
      analysis.sections
        .map((section) => {
          const content = section.content
            .map((block) => {
              if (block.type === "paragraph") {
                return block.paragraphs.join("\n\n");
              }
              if (block.type == "bullet")
                return `
${block.title}

${block.points.join("\n")}
`;
            })
            .join("\n\n");

          return `
========================================
Section: ${section.title}
========================================

Summary:
${section.summary}

Content:

${content}
`;
        })
        .join("\n\n"),
    )
    .join("\n\n");

  const result = await structuredLLM.invoke([
    {
      role: "system",
      content: visualizerPrompt,
    },
    {
      role: "user",
      content: `
Research Question:
${state.query}

The following is the final analyzed research.

${context}
`,
    },
  ]);

  const validSections = new Set(
    state.analysis.flatMap((analysis) =>
      analysis.sections.map((section) => section.title),
    ),
  );

  const visualizations: Visualization[] = result.visualizations
    .filter((v) => validSections.has(v.section))
    .map((v, index) => ({
      id: `${v.section
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${index + 1}`,

      section: v.section,

      type: v.type,

      title: v.title,

      caption: v.caption,

      xAxis: v.xAxis,

      yAxis: v.yAxis,

      data: v.data,
    }));

  await renderCharts(visualizations);

  console.log(
    `Generated ${visualizations.length} visualization(s).. Writing Report!\n`,
  );

  return {
    visualizations,
  };
}
