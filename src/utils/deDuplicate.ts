import { ResearchDocument } from "../types/document";

export function deduplicate(docs: ResearchDocument[]): ResearchDocument[] {
  const seen = new Set<string>();

  return docs.filter((doc) => {
    if (seen.has(doc.url!)) return false;

    seen.add(doc.url!);
    return true;
  });
}
