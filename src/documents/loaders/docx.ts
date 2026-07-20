import fs from "fs/promises";
import mammoth from "mammoth";
import { Document } from "@langchain/core/documents";

export async function loadDOCX(filePath: string): Promise<Document[]> {
  const buffer = await fs.readFile(filePath);

  const result = await mammoth.extractRawText({
    buffer,
  });

  return [
    new Document({
      pageContent: result.value,
      metadata: {
        source: filePath,
        type: "docx",
      },
    }),
  ];
}
