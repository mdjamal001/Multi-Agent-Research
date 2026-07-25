import { ResearchEvidence } from "../types/document";
import { stringSimilarity } from "string-similarity-js";

const SIMILARITY_THRESHOLD = 0.9;

export function deduplicate(docs: ResearchEvidence[]): ResearchEvidence[] {
  const unique: ResearchEvidence[] = [];

  for (const doc of docs) {
    const isDuplicate = unique.some((existing) => {
      const titleSimilarity = stringSimilarity(
        existing.title.toLowerCase(),
        doc.title.toLowerCase(),
      );

      const contentSimilarity = stringSimilarity(
        existing.content.slice(0, 500).toLowerCase(),
        doc.content.slice(0, 500).toLowerCase(),
      );

      return (
        titleSimilarity >= SIMILARITY_THRESHOLD &&
        contentSimilarity >= SIMILARITY_THRESHOLD
      );
    });

    if (!isDuplicate) {
      unique.push(doc);
    }
  }

  return unique;
}
