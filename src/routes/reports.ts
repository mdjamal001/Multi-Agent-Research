import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";

export const reportsRouter = Router();

// GET /reports/:jobId - Download or stream generated PDF report
reportsRouter.get("/:jobId", (req: Request, res: Response) => {
  const { jobId } = req.params;
  const reportsDir = path.resolve("./reports");

  // Clean jobId param to prevent path traversal
  const safeJobId = path.basename(jobId).replace(/\.pdf$/, "");
  const targetPdfPath = path.join(reportsDir, `${safeJobId}.pdf`);

  if (fs.existsSync(targetPdfPath)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Research_Report_${safeJobId}.pdf"`);
    return res.sendFile(targetPdfPath);
  }

  // Fallback: check if any pdf file in ./reports exists matching safeJobId
  try {
    const files = fs.readdirSync(reportsDir);
    const matchingFile = files.find((file) => file.includes(safeJobId) && file.endsWith(".pdf"));
    if (matchingFile) {
      const fullPath = path.join(reportsDir, matchingFile);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${matchingFile}"`);
      return res.sendFile(fullPath);
    }
  } catch {}

  return res.status(404).json({ error: "PDF report not found for this job ID." });
});
