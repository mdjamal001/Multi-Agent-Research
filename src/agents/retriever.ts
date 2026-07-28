import { createAgent } from "langchain";
import { ToolMessage } from "@langchain/core/messages";
import { StructuredToolInterface } from "@langchain/core/tools";

import { ResearchState } from "../graph/state";
import { llm as ollamaLLM } from "../models/ollama";
import { llm as geminiLLM } from "../models/gemini";
import { llm as groqLLM } from "../models/groq";
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

  // Register SQL tool if database config or custom DB is provided and connected
  const db = await getDatabase(state.dbConfig);
  if (db) {
    tools.push(executeSQLTool);
    context.db = db;
  }

  // Model Selection for Retriever (Defaults to Groq llama-3.1-8b-instant)
  let selectedModel: any = groqLLM;
  if (process.env.USE_OLLAMA === "true") {
    selectedModel = ollamaLLM;
  } else if (process.env.USE_GEMINI_FOR_RETRIEVER === "true") {
    selectedModel = geminiLLM;
  }

  const agent = createAgent({
    model: selectedModel,
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
            previousSearches: state.searchHistory.map((h) => h.query),
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
  // console.log("\n Retreiver raw result 🦴🦴🦴🦴🦴🦴🦴🦴");
  // console.dir(result, { depth: "infinite" });

  const evidence: ResearchEvidence[] = [];

  for (const message of result.messages) {
    if (message.getType() !== "tool") continue;

    const toolMessage = message as ToolMessage;

    const artifact = (toolMessage as any).artifact;

    if (Array.isArray(artifact)) {
      evidence.push(...artifact);
    }
  }

  // console.log("\n Retreiver cooked result 🍗🍗🍗🍗🍗🍗🍗🍗🍗");
  // console.dir(evidence, { depth: "infinite" });

  // console.log(`Retrieved ${evidence.length} documents!`);

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
