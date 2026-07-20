export interface ResearchDocument {
  source: "web" | "github" | "document";
  title: string;
  url?: string;
  content: string;
  fullContent?: string;
  score?: number;
  fetched: boolean;
}
