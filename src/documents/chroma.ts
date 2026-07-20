import { ChromaClient, Collection } from "chromadb";

const client = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

const collections = new Map<string, Collection>();

export async function getCollection(
  collectionName: string,
): Promise<Collection> {
  if (collections.has(collectionName)) {
    return collections.get(collectionName)!;
  }

  let collection: Collection;

  try {
    collection = await client.getCollection({
      name: collectionName,
    });
  } catch {
    collection = await client.createCollection({
      name: collectionName,
    });
  }

  collections.set(collectionName, collection);

  return collection;
}

export async function deleteCollection(collectionName: string) {
  await client.deleteCollection({
    name: collectionName,
  });

  collections.delete(collectionName);
}
