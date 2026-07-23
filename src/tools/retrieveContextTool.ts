import { tool } from "langchain";
import { z } from "zod";

import { retrieveDocContext } from "../retriever/retrieveDocContext";

export function createRetrieveContextTool(collectionName: string) {
  return tool(
    async ({ query }) => {
      console.log("Context Retrieval Tool called...");

      const docs = await retrieveDocContext(query, collectionName);

      console.log("Context retrieved:", docs.length);

      const serialized = docs
        .map((doc) => doc.title + "\n" + doc.content)
        .join("\n\n");

      return [serialized, docs];
    },

    {
      name: "retrieve_context",
      description: `
Retrieve relevant information from uploaded documents.

Use this tool whenever:
- the user refers to uploaded files
- the user says "this document", "this report", "this project"
- you need document context before creating a research plan
`,
      schema: z.object({
        query: z.string(),
      }),
      responseFormat: "content_and_artifact",
    },
  );
}
