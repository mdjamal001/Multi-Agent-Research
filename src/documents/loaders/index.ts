import path from "path";

import { loadPDF } from "./pdf";
import { loadDOCX } from "./docx";
import { loadTXT } from "./txt";
import { loadMarkdown } from "./markdown";
import { loadPPTX } from "./pptx";

export async function loadDocument(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return loadPDF(filePath);

    case ".docx":
      return loadDOCX(filePath);

    case ".pptx":
      return loadPPTX(filePath);

    case ".txt":
      return loadTXT(filePath);

    case ".md":
      return loadMarkdown(filePath);

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
