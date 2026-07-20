import { Report } from "../../types/report";

export function renderContents(doc: PDFKit.PDFDocument, report: Report) {
  doc.font("Helvetica-Bold").fontSize(18).text("Contents");

  doc.moveDown();

  doc.font("Helvetica");

  report.sections.forEach((section, i) => {
    doc.text(`${i + 1}. ${section.title}`);
  });
}
