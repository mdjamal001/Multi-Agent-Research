import "dotenv/config";
import { graph } from "./graph/graph";
import { writeFile } from "fs/promises";
import ReadAsync from "readline-sync";

async function main() {
  const blob = await graph.getGraph().drawMermaidPng();

  const buffer = Buffer.from(await blob.arrayBuffer());

  await writeFile("Agents-Graph.png", buffer);

  const query = `Analyze the AI hardware ecosystem.

Compare NVIDIA, AMD, Intel, Qualcomm, Broadcom and TSMC.

Include revenue growth, AI accelerator market share, manufacturing technologies, product families, strategic partnerships and future outlook.`;

  const result = await graph.invoke(
    {
      query,
    },
    {
      recursionLimit: 100,
    },
  );

  if (result.mode == "chat") {
    console.log("\nAgent: ", result.response);
  }
}

main();
