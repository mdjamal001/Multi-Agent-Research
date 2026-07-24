export interface DatabaseConfig {
  type: "postgres" | "mysql";

  host: string;
  port: number;

  username: string;
  password: string;

  database: string;
}
