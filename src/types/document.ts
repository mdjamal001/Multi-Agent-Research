export type EvidenceSource = "web" | "document" | "database" | "github";

export interface ResearchEvidence {
  id: string;

  source: EvidenceSource;

  title: string;

  content: string;

  fullContent?: string;

  score?: number;

  fetched: boolean;

  metadata?: Record<string, any>;
}
