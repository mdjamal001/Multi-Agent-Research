import "dotenv/config";
import { graph } from "./graph/graph";
import { writeFile } from "fs/promises";
import ReadAsync from "readline-sync";

async function main() {
  const blob = await graph.getGraph().drawMermaidPng();

  const buffer = Buffer.from(await blob.arrayBuffer());

  await writeFile("Agents-Graph.png", buffer);

  const query = ReadAsync.question("Enter research query: ");
  console.log();

  const result = await graph.invoke({
    query,
  });

  if (result.mode == "chat") {
    console.log("\nAgent: ", result.response);
  }
}

main();
