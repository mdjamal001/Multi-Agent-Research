import { z } from "zod";
import { createAgent } from "langchain";

import { llm } from "../models/gemini";
import { plannerPrompt } from "../prompts/planner";
import { createRetrieveContextTool } from "../tools/retrieveContextTool";
import { ResearchState } from "../graph/state";

const schema = z.object({
  mode: z.enum(["chat", "research"]),
  response: z.string(),
  plan: z.array(z.string()),
});

export async function planner(state: typeof ResearchState.State) {
  console.log("Planning...");

  const collection = `research_${state.jobId}`;

  const retrieveContextTool = createRetrieveContextTool(collection);

  const plannerAgent = createAgent({
    model: llm,
    tools: [retrieveContextTool],
    systemPrompt: plannerPrompt,
  });

  const result = await plannerAgent.invoke({
    messages: [
      {
        role: "user",
        content: state.query,
      },
    ],
  });

  const finalMessage = result.messages.at(-1);

  if (!finalMessage) {
    throw new Error("Planner produced no response.");
  }

  const text =
    typeof finalMessage.content === "string"
      ? finalMessage.content
      : finalMessage.content.map((c) => ("text" in c ? c.text : "")).join("\n");

  const structured = await llm.withStructuredOutput(schema).invoke(text);

  console.log(`Done! Mode: ${structured.mode}\n`);

  return {
    mode: structured.mode,
    response: structured.response,
    plan: structured.plan,
  };
}
