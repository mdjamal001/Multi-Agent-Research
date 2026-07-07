import { END, START, StateGraph } from "@langchain/langgraph";
import { planner } from "../agents/planner";
import { ResearchState } from "./state";
import { analyzer } from "../agents/analyzer";
import { retriever } from "../agents/retriever";
import { reflection } from "../agents/reflection";
import { reportWriter } from "../agents/reportWriter";
import { shouldContinue } from "../utils/shouldContinue";

export const graph = new StateGraph(ResearchState)

  .addNode("planner", planner)
  .addNode("retriever", retriever)
  .addNode("analyze", analyzer)
  .addNode("reflector", reflection)
  .addNode("reportWriter", reportWriter)

  .addEdge(START, "planner")
  .addEdge("planner", "retriever")
  .addEdge("retriever", "analyze")

  .addEdge("analyze", "reflector")

  .addConditionalEdges("reflector", shouldContinue, {
    retriever: "retriever",
    reportWriter: "reportWriter",
  })

  .addEdge("reportWriter", END)

  .compile();
