export type SectionContent =
  | {
      type: "paragraph";
      paragraphs: string[];
    }
  | {
      type: "bullet";
      title: string;
      points: string[];
    };

export interface AnalysisSection {
  title: string;

  // 1-2 sentence overview of this section
  summary: string;

  content: SectionContent[];
}

export interface Analysis {
  sections: AnalysisSection[];
}
