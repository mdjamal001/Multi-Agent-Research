import { END, START, StateGraph } from "@langchain/langgraph";
import { planner } from "../agents/planner";
import { ResearchState } from "./state";
import { analyzer } from "../agents/analyzer";
import { retriever } from "../agents/retriever";
import { reflection } from "../agents/reflection";
import { reportWriter } from "../agents/reportWriter";
import { reflectorRouter } from "../routers/reflectorRouter";
import { plannerRouter } from "../routers/plannerRouter";

export const graph = new StateGraph(ResearchState)

  .addNode("planner", planner)
  .addNode("retriever", retriever)
  .addNode("analyze", analyzer)
  .addNode("reflector", reflection)
  .addNode("reportWriter", reportWriter)

  .addEdge(START, "planner")
  .addConditionalEdges("planner", plannerRouter, {
    retriever: "retriever",
    [END]: END,
  })
  .addEdge("retriever", "analyze")

  .addEdge("analyze", "reflector")

  .addConditionalEdges("reflector", reflectorRouter, {
    retriever: "retriever",
    reportWriter: "reportWriter",
  })

  .addEdge("reportWriter", END)

  .compile();
