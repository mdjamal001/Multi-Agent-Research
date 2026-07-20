import { Document } from "@langchain/core/documents";
import PptxParser from "node-pptx-parser";

export async function loadPPTX(filePath: string): Promise<Document[]> {
  const parser = new PptxParser(filePath);

  const slides = await parser.extractText();

  const text = slides
    .map((slide, index) => `Slide ${index + 1}\n${slide.text.join("\n")}`)
    .join("\n\n");

  return [
    new Document({
      pageContent: text,
      metadata: {
        source: filePath,
        type: "pptx",
        slides: slides.length,
      },
    }),
  ];
}
