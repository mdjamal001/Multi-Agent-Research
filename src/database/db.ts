import { SqlDatabase } from "@langchain/classic/sql_db";
import { DataSource } from "typeorm";
import { datasource as defaultDatasource } from "./datasource";
import { hasDatabaseConfig } from "./config";
import { DbCustomConfig } from "../graph/state";

const activeDatabases = new Map<string, SqlDatabase>();

export async function getDatabase(customConfig?: DbCustomConfig): Promise<SqlDatabase | null> {
  const hasCustomUrl = !!(customConfig?.url && customConfig.url.trim().length > 0);
  const hasCustomFields = !!(customConfig?.host && customConfig.username && customConfig.database);

  if (!hasCustomUrl && !hasCustomFields) {
    if (!hasDatabaseConfig()) {
      return null;
    }

    try {
      if (!defaultDatasource.isInitialized) {
        await defaultDatasource.initialize();
      }
      return await SqlDatabase.fromDataSourceParams({
        appDataSource: defaultDatasource,
      });
    } catch (err: any) {
      console.warn(`[Database] Default SQL DB connection failed (${err?.message || err}). Proceeding without default SQL DB.`);
      return null;
    }
  }

  const cacheKey = hasCustomUrl
    ? customConfig!.url!.trim()
    : `${customConfig!.host}:${customConfig!.port || 5432}:${customConfig!.database}`;

  if (activeDatabases.has(cacheKey)) {
    return activeDatabases.get(cacheKey)!;
  }

  try {
    let ds: DataSource;

    if (hasCustomUrl) {
      const url = customConfig!.url!.trim();
      const needsSsl = customConfig?.ssl || url.includes("sslmode=require") || url.includes("supabase") || url.includes("neon.tech") || url.includes("rds.amazonaws.com");

      ds = new DataSource({
        type: "postgres",
        url,
        ssl: needsSsl ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: false,
      });
    } else {
      const needsSsl = customConfig?.ssl ?? false;
      ds = new DataSource({
        type: "postgres",
        host: customConfig!.host,
        port: Number(customConfig!.port) || 5432,
        username: customConfig!.username,
        password: customConfig!.password,
        database: customConfig!.database,
        ssl: needsSsl ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: false,
      });
    }

    await ds.initialize();

    const sqlDb = await SqlDatabase.fromDataSourceParams({
      appDataSource: ds,
    });

    console.log(`[Database] Successfully connected to custom ${hasCustomUrl ? "Cloud" : "Local/Remote"} SQL database.`);
    activeDatabases.set(cacheKey, sqlDb);
    return sqlDb;
  } catch (err: any) {
    console.warn(`[Database] Failed to connect to custom SQL DB (${err?.message || err}). Proceeding without SQL DB.`);
    return null;
  }
}
