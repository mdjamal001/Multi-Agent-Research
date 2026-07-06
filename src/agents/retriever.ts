import { ResearchState } from "../graph/state";

export async function retriever(state: typeof ResearchState.State) {
  console.log("Retrieving for:", state.plan);

  // Fake retrieval for now
  const documents = state.plan.map((task) => `Information about: ${task}`);

  return {
    documents,
  };
}
