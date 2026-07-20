import PDFDocument from "pdfkit";
import fs from "node:fs";

import { Report } from "../types/report";
import { SectionContent } from "../types/analysis";
import { renderCoverPage } from "./blocks/coverPage";
import { renderSummary } from "./blocks/summary";
import { renderContents } from "./blocks/contents";
import { renderSection } from "./blocks/section";

export async function generatePdf(report: Report, outputPath: string) {
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  renderCoverPage(doc, report);

  doc.addPage();

  renderSummary(doc, report);

  doc.addPage();

  renderContents(doc, report);

  report.sections.forEach((section) => {
    doc.addPage();

    renderSection(doc, section);
  });

  doc.end();

  return new Promise<void>((resolve) => {
    stream.on("finish", resolve);
  });
}
