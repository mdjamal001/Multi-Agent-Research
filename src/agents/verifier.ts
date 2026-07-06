import { ResearchState } from "../graph/state";

export async function verifier(state: typeof ResearchState.State) {
  console.log("Verifying...");

  const seen = new Set<string>();

  const verified = state.documents.filter((doc) => {
    if (doc.score && doc.score < 0.5) return false;

    if (seen.has(doc.url ?? doc.content)) return false;

    seen.add(doc.url ?? doc.content);

    return true;
  });

  console.log("Done!\n");

  return {
    verifiedDocuments: verified,
  };
}
