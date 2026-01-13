// src/Database/DbConnectionPool.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Perfume } from "../Domain/Entities/Perfume";
import { Sale } from "../Domain/Entities/Sale";

dotenv.config();

export const Db = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_DATABASE || "sales_db",
  synchronize: true, // automatsko kreiranje tabela u bazi
  logging: true, // debug sql gresaka - ostavi true za development
  entities: [Perfume, Sale], // ← OVDJE PROMIJENI!
  migrations: [],
  subscribers: [],
  extra: {
    connectionLimit: 10
  }
});