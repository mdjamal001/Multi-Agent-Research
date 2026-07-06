export interface ResearchDocument {
  source: "web" | "pdf" | "github" | "local";

  title: string;

  url?: string;

  content: string;

  score?: number;
}
