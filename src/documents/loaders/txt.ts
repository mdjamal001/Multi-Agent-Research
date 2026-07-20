import fs from "fs/promises";
import { Document } from "@langchain/core/documents";

export async function loadTXT(filePath: string): Promise<Document[]> {
  const text = await fs.readFile(filePath, "utf8");

  return [
    new Document({
      pageContent: text,
      metadata: {
        source: filePath,
        type: "txt",
      },
    }),
  ];
}
