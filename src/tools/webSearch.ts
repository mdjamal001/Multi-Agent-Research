import { TavilySearch } from "@langchain/tavily";
import { tool } from "langchain";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { ResearchEvidence } from "../types/document";

const webSearch = new TavilySearch({
  maxResults: 3,
});

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

export async function searchWeb(query: string): Promise<ResearchEvidence[]> {
  const result = await webSearch.invoke({
    query,
    searchDepth: "advanced",
  });

  return result.results.map(
    (res: TavilyResult): ResearchEvidence => ({
      id: randomUUID(),
      source: "web",
      title: res.title,
      content: res.content,
      fullContent: res.content,
      score: res.score,
      fetched: true,
      metadata: {
        url: res.url,
      },
    }),
  );
}

export const searchWebTool = tool(
  async ({ query }) => {
    console.log("Web Search Tool called...");

    const docs = await searchWeb(query);

    console.log(`Retrieved ${docs.length} web results`);

    // Agent only needs readable context
    const serialized = docs
      .map((doc) => doc.title + "\n" + doc.content)
      .join("\n\n");
    return [serialized, docs];
  },
  {
    name: "web_search",
    description: `
Search the web for current or general information.

Use this tool whenever:
- external knowledge is required
- current information is needed
- comparisons with industry practices are needed
- technical concepts require external references
`,
    schema: z.object({
      query: z.string(),
    }),
    responseFormat: "content_and_artifact",
  },
);
