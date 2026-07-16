import { researchMetaData } from "../config/researchMeta";
import { ResearchState } from "../graph/state";

export function reflectorRouter(state: typeof ResearchState.State) {
  if (
    state.iteration >= researchMetaData.MAX_ITERATIONS ||
    state.reflection.completeness > researchMetaData.COMPLETENESS ||
    !state.reflection.needsMoreResearch
  ) {
    console.log("Enough content! Writing...\n");
    return "reportWriter";
  }

  const searched = new Set(state.searchHistory.map((h) => h.query));

  const hasNewQueries = state.reflection.followUpQueries.some(
    (query) => !searched.has(query),
  );

  if (hasNewQueries) {
    console.log("More retrieval...\n");
    return "retriever";
  }

  console.log("Enough content! Writing...\n");
  return "reportWriter";
}
