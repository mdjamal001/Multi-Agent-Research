import fs from "fs/promises";
import matter from "gray-matter";
import { Document } from "@langchain/core/documents";

export async function loadMarkdown(filePath: string): Promise<Document[]> {
  const file = await fs.readFile(filePath, "utf8");

  const { content, data } = matter(file);

  return [
    new Document({
      pageContent: content,
      metadata: {
        source: filePath,
        type: "markdown",
        frontmatter: data,
      },
    }),
  ];
}
