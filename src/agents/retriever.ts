import { createAgent } from "langchain";
import { ToolMessage } from "@langchain/core/messages";
import { StructuredToolInterface } from "@langchain/core/tools";

import { ResearchState } from "../graph/state";
import { llm } from "../models/ollama";
import { retrieverPrompt } from "../prompts/retriever";

import { searchWebTool } from "../tools/webSearch";
import { createRetrieveContextTool } from "../tools/retrieveContextTool";
// import { createDatabaseTool } from "../tools/databaseTool";

import { deduplicate } from "../utils/deDuplicate";
import { rerank } from "../utils/reRanker";

import { SearchHistory } from "../types/searchHistory";
import { ResearchEvidence } from "../types/document";
import { executeSQLTool } from "../database/tools";
import { getDatabase } from "../database/db";
import { config, hasDatabaseConfig } from "../database/config";

async function retrieverAgent(state: typeof ResearchState.State) {
  const tools: StructuredToolInterface[] = [searchWebTool];

  if (state.jobId) {
    tools.push(createRetrieveContextTool(`research_${state.jobId}`));
  }

  const context: Record<string, unknown> = {};

  // Register SQL tool only if database config is present
  if (hasDatabaseConfig()) {
    tools.push(executeSQLTool);
    context.db = await getDatabase();
  }

  const agent = createAgent({
    model: llm,
    tools,
    systemPrompt: retrieverPrompt,
  });

  return agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            query: state.query,
            databaseMetaData: hasDatabaseConfig() ? config : null,
            databaseSchema: state.databaseSchema,
            tasks: state.reflection?.followUpQueries?.length
              ? state.reflection.followUpQueries.join("\n")
              : state.plan.join("\n"),
            previousSearches: state.searchHistory,
          }),
        },
      ],
    },
    {
      context,
    },
  );
}
export async function retriever(state: typeof ResearchState.State) {
  console.log("Retrieving...");

  const candidateQueries = state.reflection?.followUpQueries?.length
    ? state.reflection.followUpQueries
    : state.plan;

  const searched = new Set(state.searchHistory.map((h) => h.query));

  const tasks = candidateQueries.filter((q) => !searched.has(q));

  if (!tasks.length) {
    return {
      iteration: state.iteration + 1,
    };
  }

  const result = await retrieverAgent(state);
  console.log("\n Retreiver raw result 🦴🦴🦴🦴🦴🦴🦴🦴");
  console.dir(result, { depth: "infinite" });

  const evidence: ResearchEvidence[] = [];

  for (const message of result.messages) {
    if (message.getType() !== "tool") continue;

    const toolMessage = message as ToolMessage;

    const artifact = (toolMessage as any).artifact;

    if (Array.isArray(artifact)) {
      evidence.push(...artifact);
    }
  }

  console.log("\n Retreiver cooked result 🍗🍗🍗🍗🍗🍗🍗🍗🍗");
  console.dir(evidence, { depth: "infinite" });

  console.log(`Retrieved ${evidence.length} documents!`);

  const rankedEvidence = rerank(deduplicate(evidence));

  // console.log("\n Retreiver deep cooked result 🍗🍗🍗🍗🍗🍗🍗🍗🍗");
  // console.dir(rankedEvidence, { depth: "infinite" });

  const history: SearchHistory[] = tasks.map((query) => ({
    query,
    source: "agent",
    timestamp: new Date().toISOString(),
  }));

  return {
    evidence: rankedEvidence,

    newEvidence: rankedEvidence,

    searchHistory: [...state.searchHistory, ...history],

    iteration: state.iteration + 1,
  };
}
