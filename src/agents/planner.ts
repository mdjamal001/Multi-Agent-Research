import { llm } from "../models/gemini";
import { plannerPrompt } from "../prompts/planner";
import { ResearchState } from "../graph/state";

export async function planner(state: typeof ResearchState.State) {
  const response = await llm.invoke([
    {
      role: "system",
      content: plannerPrompt,
    },
    {
      role: "user",
      content: state.query,
    },
  ]);

  const plan = response.text
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return {
    plan,
  };
}
