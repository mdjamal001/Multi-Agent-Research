import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 200,
});

export async function splitDocuments(
  documents: Document[],
): Promise<Document[]> {
  return splitter.splitDocuments(documents);
}
