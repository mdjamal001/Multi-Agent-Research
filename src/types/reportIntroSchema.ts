import { z } from "zod";

export const reportIntroSchema = z.object({
  fileName: z.string(),
  title: z.string(),
  executiveSummary: z.string(),

  tableOfContents: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string(),
    }),
  ),
});
