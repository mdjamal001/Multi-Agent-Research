export interface ReportSection {
  title: string;
  subtitle: string;
  paragraphs: string[];
  points_title: string;
  points: string[];
}

export interface Report {
  title: string;
  executiveSummary: string;
  sections: ReportSection[];
}
