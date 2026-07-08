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

Sections:

${analysis.sections
  .map(
    (section) => `
${section.title}

${section.paragraphs.join("\n\n")}

${section.points_title}
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
  const merged = new Map<
    string,
    {
      paragraphs: Set<string>;
      pointsTitle: string;
      points: Set<string>;
    }
  >();

  for (const analysis of analyses) {
    for (const section of analysis.sections) {
      if (!merged.has(section.title)) {
        merged.set(section.title, {
          paragraphs: new Set(),
          pointsTitle: section.points_title,
          points: new Set(),
        });
      }

      const current = merged.get(section.title)!;

      section.paragraphs.forEach((paragraph) =>
        current.paragraphs.add(paragraph),
      );

      if (!current.pointsTitle && section.points_title) {
        current.pointsTitle = section.points_title;
      }

      section.points.forEach((point) => current.points.add(point));
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

          paragraphs: [...section.paragraphs],

          points_title: section.pointsTitle,

          points: [...section.points],
        };
      })
      .filter(
        (section): section is NonNullable<typeof section> => section !== null,
      ),
  };
}
