import "dotenv/config";
import { graph } from "./graph/graph";
import { writeFile } from "fs/promises";

async function main() {
  const blob = await graph.getGraph().drawMermaidPng();

  const buffer = Buffer.from(await blob.arrayBuffer());

  await writeFile("Agents-Graph.png", buffer);

  const result = await graph.invoke({
    query:
      "Research latest news about the war between iran and israel starting from july 1st, 2026. Include dates as well of the events",
  });

  console.dir(result.analysis, {
    depth: null,
  });
}

main();
