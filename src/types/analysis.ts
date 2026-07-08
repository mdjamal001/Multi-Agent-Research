export interface AnalysisSection {
  title: string;
  points: string[];
}

export interface Analysis {
  summary: string;
  sections: AnalysisSection[];
}
