import { embeddings } from "../documents/embeddings";
import { getCollection } from "../documents/chroma";
import { ResearchDocument } from "../types/document";

export async function retrieveDocContext(
  query: string,
  collectionName: string,
  limit = 5,
): Promise<ResearchDocument[]> {
  const collection = await getCollection(collectionName);

  const queryEmbedding = await embeddings.embedQuery(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: limit,
  });

  const docs = results.documents?.[0] ?? [];
  const metadata = results.metadatas?.[0] ?? [];

  return docs.map((content, index) => {
    const sourceValue = metadata[index]?.source;
    const title =
      typeof sourceValue === "string" ? sourceValue : "Uploaded Document";
    const url = typeof sourceValue === "string" ? sourceValue : undefined;
    const normalizedContent = content ?? "";

    return {
      source: "document",
      title,
      url,
      content: normalizedContent,
      fullContent: normalizedContent,
      fetched: true,
    };
  });
}
