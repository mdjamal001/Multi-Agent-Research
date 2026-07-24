import { SqlDatabase } from "@langchain/classic/sql_db";
import { datasource } from "./datasource";

let db: SqlDatabase | null = null;

export async function getDatabase(): Promise<SqlDatabase> {
  if (db) return db;

  if (!datasource.isInitialized) {
    await datasource.initialize();
  }

  db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });

  return db;
}
