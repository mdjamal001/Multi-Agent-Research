import { embeddings } from "../documents/embeddings";
import { getCollection } from "../documents/chroma";
import { ResearchEvidence } from "../types/document";
import { randomUUID } from "crypto";

export async function retrieveDocContext(
  query: string,
  collectionName: string,
  limit = 5,
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

  return docs.map((content, index): ResearchEvidence => {
    const metadata = metadatas[index] ?? {};

    return {
      id: randomUUID(),
      source: "document",
      title:
        typeof metadata.source === "string"
          ? metadata.source
          : "Uploaded Document",
      content: content ?? "",
      fullContent: content ?? "",
      score:
        typeof distances[index] === "number" ? 1 - distances[index] : undefined,
      fetched: true,
      metadata,
    };
  });
}
