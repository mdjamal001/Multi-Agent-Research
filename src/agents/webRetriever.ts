import { webSearch } from "../tools/webSearch";
import { ResearchState } from "../graph/state";
import { ResearchDocument } from "../types/document";

export async function webRetriever(state: typeof ResearchState.State) {
  const documents: ResearchDocument[] = [];

  for (const task of state.plan) {
    console.log("Searching Web...");

    const result = await webSearch.invoke({
      query: task,
      searchDepth: "advanced",
    });

    type TavilyResult = {
      title: string;
      url: string;
      content: string;
      score: number;
    };

    documents.push(
      ...result.results.map(
        (res: TavilyResult): ResearchDocument => ({
          source: "web",
          title: res.title,
          url: res.url,
          content: res.content,
          score: res.score,
        }),
      ),
    );

    console.log("Done!\n");

    return {
      documents,
    };
  }
}
