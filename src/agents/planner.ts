import { z } from "zod";
import { llm } from "../models/gemini";
import { plannerPrompt } from "../prompts/planner";
import { ResearchState } from "../graph/state";

const schema = z.object({
  mode: z.enum(["chat", "research"]),
  response: z.string(),
  plan: z.array(z.string()),
});

const structuredLLM = llm.withStructuredOutput(schema);

export async function planner(state: typeof ResearchState.State) {
  console.log("Planning...");

  const result = await structuredLLM.invoke([
    {
      role: "system",
      content: plannerPrompt,
    },
    {
      role: "user",
      content: state.query,
    },
  ]);

  console.log(`Done! Mode: ${result.mode}\n`);

  return {
    mode: result.mode,
    response: result.response,
    plan: result.plan,
  };
}
