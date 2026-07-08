export interface ReportSection {
  title: string;
  subtitle: string;
  points: string[];
}

export interface Report {
  title: string;
  executiveSummary: string;
  sections: ReportSection[];
}
