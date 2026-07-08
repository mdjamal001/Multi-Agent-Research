import { z } from "zod";
import { llm } from "../models/gemini";
import { reflectionPrompt } from "../prompts/reflection";
import { ResearchState } from "../graph/state";

const schema = z.object({
  needsMoreResearch: z.boolean(),
  followUpQueries: z.array(z.string()),
});

const structuredLLM = llm.withStructuredOutput(schema);

export async function reflection(state: typeof ResearchState.State) {
  console.log("Reflecting...");

  const documents = state.documents
    .map(
      (doc) => `
Title: ${doc.title}

URL: ${doc.url}

Content:
${doc.content}
`,
    )
    .join("\n-----------------\n");

  const searchedQueries = state.searchHistory
    .map((entry) => `- ${entry.query} (${entry.source})`)
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

Already Searched:
${searchedQueries}

Current Analysis:
${JSON.stringify(state.analysis, null, 2)}

Retrieved Documents:
${documents}
`,
    },
  ]);

  console.log("Done!\n");

  return {
    reflection: result,
  };
}
