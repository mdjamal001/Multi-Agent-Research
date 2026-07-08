import { END } from "@langchain/langgraph";
import { ResearchState } from "../graph/state";

export function plannerRouter(state: typeof ResearchState.State) {
  return state.mode === "research" ? "retriever" : END;
}
