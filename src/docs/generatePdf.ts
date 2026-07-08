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
  doc.font("Helvetica");
  report.sections.forEach((section, index) => {
    doc.text(`${index + 1}. ${section.title}`);
  });

  // Render Sections
  report.sections.forEach((section) => {
    doc.addPage();

    // Section Title
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("black")
      .text(section.title);

    doc.moveDown(0.3);

    // Subtitle
    doc
      .font("Helvetica-Oblique")
      .fontSize(13)
      .fillColor("gray")
      .text(section.subtitle);

    doc.moveDown();

    // Paragraphs
    doc.font("Helvetica").fontSize(12).fillColor("black");

    section.paragraphs.forEach((paragraph) => {
      doc.text(paragraph, {
        align: "justify",
        lineGap: 3,
      });

      doc.moveDown();
    });

    // Bullet heading
    if (section.points.length > 0) {
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("black")
        .text(section.points_title);

      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(12);

      section.points.forEach((point) => {
        doc.list([point], {
          bulletRadius: 2,
          textIndent: 15,
        });

        doc.moveDown(0.3);
      });
    }
  });

  doc.end();

  return new Promise<void>((resolve) => {
    stream.on("finish", resolve);
  });
}
