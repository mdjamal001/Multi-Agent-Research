import * as z from "zod";
import { tool } from "langchain";
import { SqlDatabase } from "@langchain/classic/sql_db";

export const executeSQLTool = tool(
  async ({ query }, runtime) => {
    const db = runtime.context.db as SqlDatabase | undefined;

    if (!db) {
      throw new Error("No SQL database is configured.");
    }

    const res = await db.run(query);

    return res;
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
  },
);
