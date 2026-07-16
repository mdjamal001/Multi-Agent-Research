import { z } from "zod";
import { llm } from "../models/gemini";
import { reflectionPrompt } from "../prompts/reflection";
import { ResearchState } from "../graph/state";
import { researchMetaData } from "../config/researchMeta";

const schema = z.object({
  completeness: z.number().min(0).max(100),
  missingAreas: z.array(z.string()),
  needsMoreResearch: z.boolean(),
  followUpQueries: z.array(z.string()),
});

const structuredLLM = llm.withStructuredOutput(schema);

export async function reflection(state: typeof ResearchState.State) {
  console.log("Reflecting...");

  const searchedQueries = state.searchHistory
    .map((entry) => `- ${entry.query}`)
    .join("\n");

  const analysisSummary = state.analysis
    .map(
      (analysis, i) => `
Iteration ${i + 1}

${analysis.sections
  .map(
    (section) => `
${section.title}
${section.summary}
`,
  )
  .join("\n")}
`,
    )
    .join("\n");

  const result = await structuredLLM.invoke([
    {
      role: "system",
      content: reflectionPrompt,
    },
    {
      role: "user",
      content: `
User Query:
${state.query}

Original Research Plan:
${state.plan.join("\n")}

Current Iteration:
${state.iteration}

Maximum Iterations:
${researchMetaData.MAX_ITERATIONS}

Already Searched:
${searchedQueries}

Current Coverage:
${analysisSummary}
`,
    },
  ]);

  console.log(`Done! Completeness: ${result.completeness}%\n`);

  return {
    reflection: result,
  };
}
