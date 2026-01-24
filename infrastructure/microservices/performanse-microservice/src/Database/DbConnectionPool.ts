import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { IzvestajPerformanse } from "../Domain/models/IzvestajPerformanse";

dotenv.config();

console.log("[DB]", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  name: process.env.DB_NAME,
});


export const Db = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Ako vam ne treba SSL lokalno, možeš ovo skroz da izbrišeš.
  // Ako MySQL traži SSL, ostavi ovako.
  ssl: { rejectUnauthorized: false },

  synchronize: true,
  logging: false,

  entities: [IzvestajPerformanse],
});

