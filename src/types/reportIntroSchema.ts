import { z } from "zod";

export const reportIntroSchema = z.object({
  executiveSummary: z.string(),

  tableOfContents: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string(),
    }),
  ),
});
