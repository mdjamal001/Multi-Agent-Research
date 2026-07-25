import { embeddings } from "../documents/embeddings";
import { getCollection } from "../documents/chroma";
import { ResearchEvidence } from "../types/document";
import { randomUUID } from "crypto";
import { stringSimilarity } from "string-similarity-js";

export async function retrieveDocContext(
  query: string,
  collectionName: string,
  limit = 3,
): Promise<ResearchEvidence[]> {
  const collection = await getCollection(collectionName);

  const queryEmbedding = await embeddings.embedQuery(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: limit,
  });

  const docs = results.documents?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];
  const distances = results.distances?.[0] ?? [];

  const unique: {
    content: string;
    metadata: any;
    distance?: number;
  }[] = [];

  for (let i = 0; i < docs.length; i++) {
    const content = docs[i] ?? "";

    const duplicate = unique.some(
      (doc) => stringSimilarity(content, doc.content) > 0.95,
    );

    if (!duplicate) {
      unique.push({
        content,
        metadata: metadatas[i] ?? {},
        distance: distances[i] ?? undefined,
      });
    }
  }

  return unique.map(
    ({ content, metadata, distance }): ResearchEvidence => ({
      id: randomUUID(),
      source: "document",
      title:
        typeof metadata.source === "string"
          ? metadata.source
          : "Uploaded Document",
      content,
      score: typeof distance === "number" ? 1 - distance : undefined,
      fetched: true,
      metadata,
    }),
  );
}
