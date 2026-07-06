import { END, START, StateGraph } from "@langchain/langgraph";
import { planner } from "../agents/planner";
import { verifier } from "../agents/verifier";
import { githubRetriever } from "../agents/githubRetriever";
import { pdfRetriever } from "../agents/pdfRetriever";
import { webRetriever } from "../agents/webRetriever";
import { ResearchState } from "./state";
import { analyzer } from "../agents/analyzer";

export const graph = new StateGraph(ResearchState)

  .addNode("planner", planner)

  .addNode("web", webRetriever)
  // .addNode("pdf", pdfRetriever)
  // .addNode("github", githubRetriever)

  .addNode("verify", verifier)

  .addNode("analyze", analyzer)

  .addEdge(START, "planner")

  .addEdge("planner", "web")
  // .addEdge("planner", "pdf")
  // .addEdge("planner", "github")

  .addEdge("web", "verify")
  // .addEdge("pdf", "verify")
  // .addEdge("github", "verify")

  .addEdge("verify", "analyze")

  .addEdge("analyze", END)

  .compile();
