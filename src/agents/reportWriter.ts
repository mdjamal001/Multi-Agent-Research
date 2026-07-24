import { llm } from "../models/gemini";
import { reportIntroPrompt } from "../prompts/reportIntro";
import { reportIntroSchema } from "../types/reportIntroSchema";
import { ResearchState } from "../graph/state";
import { Analysis, SectionContent } from "../types/analysis";
import { Report } from "../types/report";
import { generatePdf } from "../report_gen/generatePdf";
import { Visualization } from "../types/visualization";

const structuredLLM = llm.withStructuredOutput(reportIntroSchema);

export async function reportWriter(state: typeof ResearchState.State) {
  console.log("Writing...");
  console.log(state.analysis);

  const analyses = state.analysis
    .map(
      (analysis, i) => `
Iteration ${i + 1}

Sections:

${analysis.sections
  .map((section) => {
    const blocks = section.content
      .map((block) => {
        switch (block.type) {
          case "paragraph":
            return block.paragraphs.join("\n\n");

          case "bullet":
            return `
${block.title}

${block.points.join("\n")}
`;
        }
      })
      .join("\n\n");

    return `
${section.title}

${blocks}
`;
  })
  .join("\n")}
`,
    )
    .join("\n\n");

  const intro = await structuredLLM.invoke([
    {
      role: "system",
      content: reportIntroPrompt,
    },
    {
      role: "user",
      content: analyses,
    },
  ]);

  const report = buildReport(
    intro.title,
    intro.executiveSummary,
    intro.tableOfContents,
    state.analysis,
    state.visualizations,
  );

  try {
    await generatePdf(report, `./reports/${intro.fileName}.pdf`);
  } catch (e) {
    console.error(e);
  }

  console.log("Report Generated");

  return {
    report,
  };
}

function buildReport(
  title: string,
  summary: string,
  toc: {
    title: string;
    subtitle: string;
  }[],
  analyses: Analysis[],
  visualizations: Visualization[],
): Report {
  const merged = new Map<
    string,
    {
      content: SectionContent[];
    }
  >();

  for (const analysis of analyses) {
    for (const section of analysis.sections) {
      if (!merged.has(section.title)) {
        merged.set(section.title, {
          content: [],
        });
      }

      const current = merged.get(section.title)!;

      current.content.push(...section.content);
    }
  }

  return {
    title,

    executiveSummary: summary,

    sections: toc
      .map((item) => {
        const section = merged.get(item.title);

        if (!section) return null;

        return {
          title: item.title,

          subtitle: item.subtitle,

          content: section.content,

          visualizations: visualizations.filter(
            (visualization) => visualization.section === item.title,
          ),
        };
      })
      .filter(
        (section): section is NonNullable<typeof section> => section !== null,
      ),
  };
}
