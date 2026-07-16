import { Report } from "../../types/report";

export function renderSummary(doc: PDFKit.PDFDocument, report: Report) {
  doc.font("Helvetica-Bold").fontSize(18).text("Executive Summary");

  doc.moveDown(0.5);

  doc.font("Helvetica").fontSize(12).text(report.executiveSummary);

  doc.moveDown();
}
