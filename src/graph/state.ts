import { Annotation } from "@langchain/langgraph";
import { ResearchDocument } from "../types/document";

export const ResearchState = Annotation.Root({
  query: Annotation<string>(),
  plan: Annotation<string[]>(),
  documents: Annotation<ResearchDocument[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  verifiedDocuments: Annotation<ResearchDocument[]>(),
  analysis: Annotation<{
    summary: string;
    keyFindings: string[];
    limitations: string[];
  }>(),
  report: Annotation<string>(),
});
