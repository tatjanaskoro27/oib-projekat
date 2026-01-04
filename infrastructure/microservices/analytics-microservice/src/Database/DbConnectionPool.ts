import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { FiskalniRacun } from "../Domain/models/FiskalniRacun";
import { FiskalnaStavka } from "../Domain/models/FiskalnaStavka";

dotenv.config();

export const Db = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },

  synchronize: true,
  logging: false,

  entities: [
    FiskalniRacun,
    FiskalnaStavka
  ],
});
