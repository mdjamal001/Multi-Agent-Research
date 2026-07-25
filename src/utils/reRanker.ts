import { ResearchEvidence } from "../types/document";

export function rerank(docs: ResearchEvidence[]): ResearchEvidence[] {
  return [...docs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
