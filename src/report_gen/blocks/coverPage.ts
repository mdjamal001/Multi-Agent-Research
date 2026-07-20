import PDFDocument from "pdfkit";
import { Report } from "../../types/report";

export function renderCoverPage(doc: PDFKit.PDFDocument, report: Report) {
  doc.font("Helvetica-Bold");
  doc.fontSize(28);

  const pageHeight = doc.page.height;

  const titleHeight = doc.heightOfString(report.title, {
    width: doc.page.width - 100,
    align: "center",
  });

  const y = (pageHeight - titleHeight) / 2;

  doc.text(report.title, 50, y, {
    align: "center",
  });
}
