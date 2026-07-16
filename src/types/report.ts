import { SectionContent } from "./analysis";

export interface ReportSection {
  title: string;
  subtitle: string;

  content: SectionContent[];
}

export interface Report {
  title: string;

  executiveSummary: string;

  sections: ReportSection[];
}
