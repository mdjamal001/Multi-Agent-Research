import { SectionContent } from "./analysis";
import { Visualization } from "./visualization";

export interface ReportSection {
  title: string;

  subtitle: string;

  content: SectionContent[];

  visualizations: Visualization[];
}

export interface Report {
  title: string;

  executiveSummary: string;

  sections: ReportSection[];
}
