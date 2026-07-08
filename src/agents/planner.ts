import { llm } from "../models/gemini";
import { plannerPrompt } from "../prompts/planner";
import { ResearchState } from "../graph/state";

export async function planner(state: typeof ResearchState.State) {
  console.log("Planning...");

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

  console.log("Done!\n");

  return {
    plan,
  };
}
