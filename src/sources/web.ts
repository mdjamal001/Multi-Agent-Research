import { webSearch } from "../tools/webSearch";
import { ResearchDocument } from "../types/document";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

export async function searchWeb(query: string): Promise<ResearchDocument[]> {
  const result = await webSearch.invoke({
    query,
    searchDepth: "advanced",
  });

  return result.results.map(
    (res: TavilyResult): ResearchDocument => ({
      source: "web",
      title: res.title,
      url: res.url,
      content: res.content,
      score: res.score,
      fetched: false,
    }),
  );
}
