import { z } from "zod";
import { createAgent } from "langchain";

import { llm } from "../models/gemini";
import { plannerPrompt } from "../prompts/planner";
import { createRetrieveContextTool } from "../tools/retrieveContextTool";
import { ResearchState } from "../graph/state";
import { hasDatabaseConfig } from "../database/config";
import { executeSQLTool } from "../database/tools";
import { getDatabase } from "../database/db";

const schema = z.object({
  mode: z.enum(["chat", "research"]),
  plan: z.array(z.string()),
  databaseSchema: z.string().optional(),
});

export async function planner(state: typeof ResearchState.State) {
  console.log("Planning...");

  const collection = `research_${state.jobId}`;

  const retrieveContextTool = createRetrieveContextTool(collection);

  const tools = [];
  const context: Record<string, unknown> = {};

  tools.push(retrieveContextTool);
  const db = await getDatabase(state.dbConfig);
  if (db) {
    tools.push(executeSQLTool);
    context.db = db;
  }

  const plannerAgent = createAgent({
    model: llm,
    tools,
    systemPrompt: plannerPrompt,
  });

  const result = await plannerAgent.invoke(
    {
      messages: [
        {
          role: "user",
          content: state.query,
        },
      ],
    },
    { context },
  );

  const finalMessage = result.messages.at(-1);

  if (!finalMessage) {
    throw new Error("Planner produced no response.");
  }

  const text = Array.isArray(finalMessage.content)
    ? finalMessage.content
        .map((c) => {
          if (typeof c === "string") {
            return c;
          }

          if ("text" in c && typeof c.text === "string") {
            return c.text;
          }

          return "";
        })
        .join("\n")
    : typeof finalMessage.content === "string"
      ? finalMessage.content
      : "";

  const structured = await llm.withStructuredOutput(schema).invoke(text);

  console.log(`Done! Mode: ${structured.mode}\n`);

  return {
    mode: structured.mode,
    plan: structured.plan,
    databaseSchema: structured.databaseSchema,
  };
}
