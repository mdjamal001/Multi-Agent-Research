export interface SearchHistory {
  query: string;
  timestamp: string;
  source: "web" | "github" | "pdf";
}
