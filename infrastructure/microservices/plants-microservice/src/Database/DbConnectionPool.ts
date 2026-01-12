import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Plant } from "../Domain/models/Plant";

dotenv.config({ override: true });

const sslEnabled = (process.env.DB_SSL ?? "false").toLowerCase() === "true";

export const Db = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  synchronize: true,
  logging: false,
  entities: [Plant],
});
