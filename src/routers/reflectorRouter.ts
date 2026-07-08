import { ResearchState } from "../graph/state";

export function reflectorRouter(state: typeof ResearchState.State) {
  if (state.iteration >= 6) {
    return "reportWriter";
  }

  const searched = new Set(state.searchHistory.map((h) => h.query));

  const hasNewQueries = state.reflection.followUpQueries.some(
    (query) => !searched.has(query),
  );

  if (state.reflection.needsMoreResearch && hasNewQueries) {
    console.log("More retrieval...\n");
    return "retriever";
  }

  console.log("Enough content! Writing...\n");
  return "reportWriter";
}

// Checks if reflection agent returns any new queries that were not already searched for before.
// If found new queries, go back to retriever otherwise report
