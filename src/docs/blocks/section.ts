import { Report } from "../../types/report";
import { SectionContent } from "../../types/analysis";
import { Visualization } from "../../types/visualization";

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

  if (section.visualizations.length) {
    doc.moveDown();
  }

  section.visualizations.forEach((visualization) => {
    renderVisualization(doc, visualization);

    doc.moveDown(1.5);
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

function renderVisualization(
  doc: PDFKit.PDFDocument,
  visualization: Visualization,
) {
  if (!enoughHeight(doc, visualization)) {
    doc.addPage();
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("black")
    .text(visualization.title, {
      align: "center",
    });

  doc.moveDown(0.5);

  if (visualization.type === "table") {
    renderTable(doc, visualization);
  } else if (visualization.imagePath) {
    doc.image(visualization.imagePath, {
      fit: [450, 260],
      align: "center",
      valign: "center",
    });

    doc.moveDown();
  }

  doc
    .font("Helvetica-Oblique")
    .fontSize(10)
    .fillColor("gray")
    .text(visualization.caption, {
      align: "center",
    });

  doc.moveDown();
}

function renderTable(doc: PDFKit.PDFDocument, visualization: Visualization) {
  const startX = doc.page.margins.left;

  const tableWidth = 450;
  const labelWidth = tableWidth * 0.55;
  const valueWidth = tableWidth * 0.45;

  let y = doc.y;

  // Header
  doc.font("Helvetica-Bold").fontSize(11);

  doc.rect(startX, y, labelWidth, 25).stroke();
  doc.rect(startX + labelWidth, y, valueWidth, 25).stroke();

  doc.text(visualization.xAxis ?? "Label", startX + 5, y + 7, {
    width: labelWidth - 10,
  });

  doc.text(visualization.yAxis ?? "Value", startX + labelWidth + 5, y + 7, {
    width: valueWidth - 10,
  });

  y += 25;

  doc.font("Helvetica");

  for (const row of visualization.data) {
    doc.rect(startX, y, labelWidth, 22).stroke();
    doc.rect(startX + labelWidth, y, valueWidth, 22).stroke();

    doc.text(String(row.label), startX + 5, y + 5, {
      width: labelWidth - 10,
    });

    doc.text(String(row.value), startX + labelWidth + 5, y + 5, {
      width: valueWidth - 10,
    });

    y += 22;
  }

  doc.y = y;
}

function enoughHeight(doc: PDFKit.PDFDocument, visualization: Visualization) {
  const captionHeight = doc.heightOfString(visualization.caption, {
    width: 450,
    align: "center",
  });

  const titleHeight = doc.heightOfString(visualization.title, {
    width: 450,
    align: "center",
  });

  let bodyHeight = 260;

  if (visualization.type === "table") {
    bodyHeight = 25 + visualization.data.length * 10;
  }

  const requiredHeight = titleHeight + bodyHeight + captionHeight + 30;

  const availableHeight = doc.page.height - doc.page.margins.bottom - doc.y;

  return availableHeight >= requiredHeight;
}
