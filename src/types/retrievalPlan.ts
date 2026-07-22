export type RetrievalSource = "web" | "document" | "database" | "github";

export interface RetrievalPlan {
  /**
   * Search queries the retriever should execute.
   */
  searches: string[];

  /**
   * Knowledge sources selected by the agent.
   */
  sources: RetrievalSource[];

  /**
   * Why these sources were chosen.
   */
  reasoning: string;
}
