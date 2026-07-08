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

  if (tasks.length === 0) {
    return {
      iteration: state.iteration + 1,
    };
  }

  const responses = await Promise.all(tasks.map((task) => searchWeb(task)));

  let newDocuments: ResearchDocument[] = responses.flat();

  newDocuments = deduplicate(newDocuments);
  newDocuments = rerank(newDocuments);

  const history: SearchHistory[] = tasks.map((query) => ({
    query,
    source: "web",
    timestamp: new Date().toISOString(),
  }));

  console.log(`Done! Retrieved ${newDocuments.length} documents\n`);

  return {
    documents: newDocuments,
    newDocuments,
    searchHistory: history,
    iteration: state.iteration + 1,
  };
}
