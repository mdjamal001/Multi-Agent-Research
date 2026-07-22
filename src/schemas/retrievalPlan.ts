import { z } from "zod";

export const retrievalPlanSchema = z.object({
  searches: z.array(z.string()).min(1).describe("Search queries to execute."),

  sources: z
    .array(z.enum(["web", "document", "database", "github"]))
    .min(1)
    .describe("Knowledge sources required."),

  reasoning: z.string().describe("Why these sources were selected."),
});

export type RetrievalPlan = z.infer<typeof retrievalPlanSchema>;
