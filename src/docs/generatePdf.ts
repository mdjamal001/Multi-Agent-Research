import PDFDocument from "pdfkit";
import fs from "node:fs";
import { Report } from "../types/report";

export async function generatePdf(report: Report, outputPath: string) {
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // ---------- Cover Page ----------
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

  // Start the actual report
  doc.addPage();

  // Summary
  doc.fontSize(18).text("Executive Summary");
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica").text(report.executiveSummary);
  doc.moveDown();
  doc.addPage();

  //Render Contents table
  doc.fontSize(18).font("Helvetica-Bold").text("Contents");
  doc.moveDown();
  report.sections.forEach((section, index) => {
    doc.text(`${index + 1}. ${section.title}`);
  });

  //Render Sections
  report.sections.forEach((section) => {
    doc.addPage();
    doc.fontSize(20).font("Helvetica-Bold").text(section.title);
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor("gray").text(section.subtitle);
    doc.moveDown();
    doc.fillColor("black");
    section.points.forEach((point) => {
      doc.fontSize(12).text(`• ${point}`, {
        indent: 20,
      });
      doc.moveDown(0.2);
    });
  });

  doc.end();

  return new Promise<void>((resolve) => {
    stream.on("finish", resolve);
  });
}
