import { Report } from "../../types/report";
import { SectionContent } from "../../types/analysis";
import { Visualization } from "../../types/visualization";

const TABLE_WIDTH = 450;
const LABEL_WIDTH = TABLE_WIDTH * 0.55;
const VALUE_WIDTH = TABLE_WIDTH * 0.45;

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

  let y = doc.y;

  // Header
  doc.font("Helvetica-Bold").fontSize(11);

  doc.rect(startX, y, LABEL_WIDTH, 25).stroke();
  doc.rect(startX + LABEL_WIDTH, y, VALUE_WIDTH, 25).stroke();

  doc.text(visualization.xAxis ?? "Label", startX + 5, y + 7, {
    width: LABEL_WIDTH - 10,
  });

  doc.text(visualization.yAxis ?? "Value", startX + LABEL_WIDTH + 5, y + 7, {
    width: VALUE_WIDTH - 10,
  });

  y += 25;

  doc.font("Helvetica").fontSize(11);

  for (const row of visualization.data) {
    const label = String(row.label);
    const value = String(row.value);

    const labelHeight = doc.heightOfString(label, {
      width: LABEL_WIDTH - 10,
    });

    const valueHeight = doc.heightOfString(value, {
      width: VALUE_WIDTH - 10,
    });

    const rowHeight = Math.max(labelHeight, valueHeight) + 10;

    doc.rect(startX, y, LABEL_WIDTH, rowHeight).stroke();
    doc.rect(startX + LABEL_WIDTH, y, VALUE_WIDTH, rowHeight).stroke();

    const labelY = y + (rowHeight - labelHeight) / 2;
    const valueY = y + (rowHeight - valueHeight) / 2;

    doc.text(label, startX + 5, labelY, {
      width: LABEL_WIDTH - 10,
    });

    doc.text(value, startX + LABEL_WIDTH + 5, valueY, {
      width: VALUE_WIDTH - 10,
    });

    y += rowHeight;
  }

  // Reset PDF cursor
  doc.x = doc.page.margins.left;
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
    bodyHeight = 25;

    for (const row of visualization.data) {
      const labelHeight = doc.heightOfString(String(row.label), {
        width: LABEL_WIDTH - 10,
      });

      const valueHeight = doc.heightOfString(String(row.value), {
        width: VALUE_WIDTH - 10,
      });

      bodyHeight += Math.max(labelHeight, valueHeight) + 10;
    }
  }

  const requiredHeight = titleHeight + bodyHeight + captionHeight + 30;

  const availableHeight = doc.page.height - doc.page.margins.bottom - doc.y;

  return availableHeight >= requiredHeight;
}
