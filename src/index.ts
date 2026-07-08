import "dotenv/config";
import { graph } from "./graph/graph";
import { writeFile } from "fs/promises";

async function main() {
  const blob = await graph.getGraph().drawMermaidPng();

  const buffer = Buffer.from(await blob.arrayBuffer());

  await writeFile("Agents-Graph.png", buffer);

  const result = await graph.invoke({
    query: "Research everything about 2026 FIFA World Cup 2026",
  });
}

main();
