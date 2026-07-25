import * as z from "zod";
import { tool } from "langchain";
import { SqlDatabase } from "@langchain/classic/sql_db";
import { ResearchEvidence } from "../types/document";
import { content } from "pdfkit/js/page";

export const executeSQLTool = tool(
  async ({ query }, runtime) => {
    const db = runtime.context.db as SqlDatabase | undefined;

    if (!db) {
      throw new Error("No SQL database is configured.");
    }

    console.log("Execute SQL tool called...");

    const result = await db.run(query);

    const evidence: ResearchEvidence = {
      id: crypto.randomUUID(),
      source: "database",
      title: "SQL Query Result",
      content: result,
      fetched: true,
      metadata: {
        query,
      },
    };
    // console.log("Type of SQL tool: " + typeof result);

    return [result, [evidence]];
  },
  {
    name: "execute_sql",
    description: `
Execute a read-only SQL query against the connected database.

Only use this tool when a database is available.
Never execute INSERT, UPDATE, DELETE, DROP, ALTER, CREATE or TRUNCATE.
`,
    schema: z.object({
      query: z.string(),
    }),
    responseFormat: "content_and_artifact",
  },
);
