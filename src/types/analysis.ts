export interface AnalysisSection {
  title: string;
  paragraphs: string[];
  points_title: string;
  points: string[];
}

export interface Analysis {
  sections: AnalysisSection[];
}
