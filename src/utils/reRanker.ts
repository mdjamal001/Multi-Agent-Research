import { ResearchDocument } from "../types/document";

export function rerank(docs: ResearchDocument[]): ResearchDocument[] {
  return [...docs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
