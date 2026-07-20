import path from "path";
import { randomUUID } from "crypto";

import { loadDocument } from "./loaders";
import { splitDocuments } from "./splitter";
import { generateFileHash } from "./hash";
import { embeddings } from "./embeddings";
import { getCollection } from "./chroma";

export async function ingestDocument(filePath: string, collectionName: string) {
  // Generate file hash
  const fileHash = await generateFileHash(filePath);

  // Get collection
  const collection = await getCollection(collectionName);

  // Check if already indexed
  const existing = await collection.get({
    where: {
      fileHash,
    },
  });

  if (existing.ids.length > 0) {
    console.log(`${path.basename(filePath)} already indexed.`);
    return;
  }

  // Load
  const docs = await loadDocument(filePath);

  // Split
  const chunks = await splitDocuments(docs);

  // Embed
  const vectors = await embeddings.embedDocuments(
    chunks.map((doc) => doc.pageContent),
  );

  // Store
  await collection.add({
    ids: chunks.map(() => randomUUID()),
    documents: chunks.map((d) => d.pageContent),
    embeddings: vectors,
    metadatas: chunks.map((doc, index) => ({
      ...sanitizeMetadata(doc.metadata),
      chunk: index,
      fileHash,
    })),
  });

  console.log(`${path.basename(filePath)} indexed (${chunks.length} chunks)`);
}

function sanitizeMetadata(metadata: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return [key, value];
      }

      if (
        Array.isArray(value) &&
        value.every(
          (v) =>
            typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean",
        )
      ) {
        return [key, value];
      }

      // Convert nested objects to JSON strings
      return [key, JSON.stringify(value)];
    }),
  );
}
