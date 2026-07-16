import { Report } from "../../types/report";
import { SectionContent } from "../../types/analysis";

export function renderSection(
  doc: PDFKit.PDFDocument,
  section: Report["sections"][number],
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("black")
    .text(section.title);

  doc.moveDown(0.3);

  doc
    .font("Helvetica-Oblique")
    .fontSize(13)
    .fillColor("gray")
    .text(section.subtitle);

  doc.moveDown();

  section.content.forEach((block) => {
    renderContentBlock(doc, block);

    doc.moveDown();
  });
}

function renderContentBlock(doc: PDFKit.PDFDocument, block: SectionContent) {
  switch (block.type) {
    case "paragraph":
      renderParagraphBlock(doc, block);
      break;

    case "bullet":
      renderBulletBlock(doc, block);
      break;
  }
}

function renderParagraphBlock(
  doc: PDFKit.PDFDocument,
  block: Extract<SectionContent, { type: "paragraph" }>,
) {
  doc.font("Helvetica").fontSize(12).fillColor("black");

  block.paragraphs.forEach((paragraph) => {
    doc.text(paragraph, {
      align: "justify",
      lineGap: 3,
    });

    doc.moveDown();
  });
}

function renderBulletBlock(
  doc: PDFKit.PDFDocument,
  block: Extract<SectionContent, { type: "bullet" }>,
) {
  if (block.points.length === 0) return;

  doc.font("Helvetica-Bold").fontSize(14).fillColor("black").text(block.title);

  doc.moveDown(0.5);

  doc.font("Helvetica").fontSize(12);

  block.points.forEach((point) => {
    doc.list([point], {
      bulletRadius: 2,
      textIndent: 15,
    });

    doc.moveDown(0.3);
  });
}
