import "dotenv/config";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";

import { graph } from "./graph/graph";
import { ingestDocument } from "./documents/ingest";
import { deleteCollection } from "./documents/chroma";
import { getUploadedFiles } from "./utils/getUploadedFiles";

async function main() {
  const blob = await graph.getGraph().drawMermaidPng();

  const buffer = Buffer.from(await blob.arrayBuffer());

  await writeFile("Agents-Graph.png", buffer);

  // -------------------------
  // Create Research Job
  // -------------------------

  const jobId = randomUUID();

  const collection = `research_${jobId}`;

  // -------------------------
  // Documents to Index
  // -------------------------
  const uploadedFiles = await getUploadedFiles("./uploads");

  for (const file of uploadedFiles) {
    await ingestDocument(file, collection);
  }

  // -------------------------
  // Query
  // -------------------------

  const query =
    "Analyze the project report and compare in depth the methodologies and trends in the existing similar platforms";

  const result = await graph.invoke(
    {
      query,
      jobId,
    },
    {
      recursionLimit: 100,
    },
  );

  if (result.mode === "chat") {
    console.log("\nAgent:", result.response);
  }

  // Cleanup temporary collection
  await deleteCollection(collection);
}

main();
