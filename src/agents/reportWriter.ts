import { llm } from "../models/gemini";
import { reportIntroPrompt } from "../prompts/reportIntro";
import { reportIntroSchema } from "../types/reportIntroSchema";
import { ResearchState } from "../graph/state";
import { Analysis } from "../types/analysis";
import { Report } from "../types/report";
import { generatePdf } from "../docs/generatePdf";

const structuredLLM = llm.withStructuredOutput(reportIntroSchema);

export async function reportWriter(state: typeof ResearchState.State) {
  console.log("Writing...");

  const analyses = state.analysis
    .map(
      (analysis, i) => `
Iteration ${i + 1}

Summary:
${analysis.summary}

Sections:

${analysis.sections
  .map(
    (section) => `
${section.title}

${section.points.join("\n")}
`,
  )
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
  );

  try {
    await generatePdf(report, `./reports/${intro.fileName}.pdf`);
  } catch (e) {
    console.error("Error: ", e);
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
): Report {
  const merged = new Map<string, Set<string>>();

  for (const analysis of analyses) {
    for (const section of analysis.sections) {
      if (!merged.has(section.title)) {
        merged.set(section.title, new Set());
      }

      section.points.forEach((point) => {
        merged.get(section.title)!.add(point);
      });
    }
  }

  return {
    title,

    executiveSummary: summary,

    sections: toc
      .map((item) => ({
        title: item.title,
        subtitle: item.subtitle,
        points: [...(merged.get(item.title) ?? [])],
      }))
      .filter((section) => section.points.length > 0),
  };
}
