import fs from "fs";
import pdf from "pdf-parse";
import { Document } from "langchain";
import path from "path";

export async function loadPDF(filePath: string): Promise<Document[]> {
  const absolutePath = path.resolve(filePath);

  const buffer = fs.readFileSync(absolutePath);

  const parsedPdf = await pdf(buffer);

  const document = new Document({
    pageContent: parsedPdf.text,
    metadata: {
      source: filePath,
      pages: parsedPdf.numpages,
      info: JSON.stringify(parsedPdf.info),
    },
  });

  return [document];
}
