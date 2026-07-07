export interface ResearchDocument {
  source: "web" | "github" | "pdf";
  title: string;
  url?: string;
  content: string;
  fullContent?: string;
  score?: number;
  fetched: boolean;
}
