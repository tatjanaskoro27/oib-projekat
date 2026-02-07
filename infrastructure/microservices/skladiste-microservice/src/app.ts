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
import { AmbalazaStavka } from "./Domain/models/AmbalazaStavka";
import { SkladisteController } from "./WebAPI/controllers/SkladisteController";

dotenv.config({ quiet: true });

const app = express();

// Read CORS settings from environment (isto kao processing/production)
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods =
  process.env.CORS_METHODS?.split(",").map((m) => m.trim()) ?? ["GET", "POST", "PATCH", "PUT", "DELETE"];

app.use(
  cors({
    origin: corsOrigin,
    methods: corsMethods,
  })
);

app.use(express.json());

// inicijalizacija baze (kao šablon)
initialize_database();

// ORM repositories
const skladisteRepo: Repository<Skladiste> = Db.getRepository(Skladiste);
const ambalazaRepo: Repository<Ambalaza> = Db.getRepository(Ambalaza);
const stavkaRepo: Repository<AmbalazaStavka> = Db.getRepository(AmbalazaStavka);

// strategije
const strategijaDistributivnogCentra: IStrategijaSkladista = new StrategijaDistributivnogCentra();
const strategijaMagacinskogCentra: IStrategijaSkladista = new StrategijaMagacinskogCentra();

// servisi
const servis: IServisSkladista = new ServisSkladista(
  skladisteRepo,
  ambalazaRepo,
  stavkaRepo,
  strategijaDistributivnogCentra,
  strategijaMagacinskogCentra
);

// kontroler
const controller = new SkladisteController(servis);

// rute
app.get("/health", (_req, res) => res.json({ status: "SKLADISTE UP" }));
app.use("/api/v1", controller.getRouter());

export default app;
