import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "reflect-metadata";
import { Repository } from "typeorm";

import { initialize_database } from "./Database/InitializeConnection";
import { Db } from "./Database/DbConnectionPool";

import { Skladiste } from "./Domain/models/Skladiste";
import { Ambalaza } from "./Domain/models/Ambalaza";


import { IServisSkladista } from "./Domain/services/IServisSkladista";
import { ServisSkladista } from "./Services/ServisSkladista";

import { IStrategijaSkladista } from "./Domain/services/IStrategijaSkladista";
import { StrategijaDistributivnogCentra } from "./Services/StrategijaDistributivnogCentra";
import { StrategijaMagacinskogCentra } from "./Services/StrategijaMagacinskogCentra";

import { SkladisteController } from "./WebAPI/controllers/SkladisteController";

dotenv.config({ quiet: true });

const app = express();
app.use(cors());
app.use(express.json());

// inicijalizacija baze
initialize_database();

// ORM repositories
const skladisteRepo: Repository<Skladiste> = Db.getRepository(Skladiste);
const ambalazaRepo: Repository<Ambalaza> = Db.getRepository(Ambalaza);

// strategije
const strategijaDistributivnogCentra: IStrategijaSkladista = new StrategijaDistributivnogCentra();
const strategijaMagacinskogCentra: IStrategijaSkladista = new StrategijaMagacinskogCentra();

// servisi
const servisSkladista: IServisSkladista = new ServisSkladista(
  skladisteRepo,
  ambalazaRepo,
  strategijaDistributivnogCentra,
  strategijaMagacinskogCentra
);

// kontroler
const controller = new SkladisteController(servisSkladista);

// rute
app.get("/health", (_, res) => res.json({ status: "SKLADISTE UP" }));
app.use("/api/v1", controller.getRouter());

export default app;
