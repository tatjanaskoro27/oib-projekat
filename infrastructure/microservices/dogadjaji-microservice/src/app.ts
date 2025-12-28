import express from "express";
import cors from "cors";
import "reflect-metadata";
import dotenv from "dotenv";
import { Repository } from "typeorm";

import { initialize_database } from "./Database/InitializeConnection";
import { Db } from "./Database/DbConnectionPool";

import { Dogadjaj } from "./Domain/models/Dogadjaj";

import { DogadjajiService } from "./Services/DogadjajService";
import { DogadjajiController } from "./WebAPI/controllers/DogadjajiController";

dotenv.config({ quiet: true });

const app = express();

// CORS
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods =
  process.env.CORS_METHODS?.split(",").map(m => m.trim()) ?? [
    "GET",
    "POST",
    "PUT",
    "DELETE",
  ];

app.use(
  cors({
    origin: corsOrigin,
    methods: corsMethods,
  })
);

app.use(express.json());

// Init DB (TypeORM)
initialize_database();

// ORM repository
const dogadjajRepository: Repository<Dogadjaj> = Db.getRepository(Dogadjaj);

// Service + Controller
const dogadjajiService = new DogadjajiService(dogadjajRepository);
const dogadjajiController = new DogadjajiController(dogadjajiService);

// Routes
app.use("/api/v1", dogadjajiController.getRouter());

export default app;
