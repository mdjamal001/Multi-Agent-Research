import { ResearchState } from "../graph/state";
import { searchWeb } from "../sources/web";
import { ResearchDocument } from "../types/document";
import { SearchHistory } from "../types/searchHistory";
import { deduplicate } from "../utils/deDuplicate";
import { rerank } from "../utils/reRanker";

export async function retriever(state: typeof ResearchState.State) {
  console.log("Searching...");

  const candidateQueries = state.reflection?.followUpQueries?.length
    ? state.reflection.followUpQueries
    : state.plan;

  const searched = new Set(state.searchHistory.map((entry) => entry.query));

  const tasks = candidateQueries.filter((query) => !searched.has(query));

  // Nothing new to search
  if (tasks.length === 0) {
    return {
      iteration: state.iteration + 1,
    };
  }

  const responses = await Promise.all(tasks.map((task) => searchWeb(task)));

  let documents: ResearchDocument[] = responses.flat();

  documents = deduplicate(documents);
  documents = rerank(documents);

  const history: SearchHistory[] = tasks.map((query) => ({
    query,
    source: "web",
    timestamp: new Date().toISOString(),
  }));

  console.log(`Done! Retrieved ${tasks.length} results`);

  return {
    documents: documents.slice(0, 10),
    searchHistory: history,
    iteration: state.iteration + 1,
  };
}
