import { DatabaseConfig } from "./type";

export const config: DatabaseConfig = {
  type: process.env.DB_TYPE as DatabaseConfig["type"],
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
};

// database/config.ts

export function hasDatabaseConfig() {
  return !!(
    process.env.DB_HOST &&
    process.env.DB_PORT &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_NAME
  );
}
