import express from "express";
import cors from "cors";
import "reflect-metadata";
import dotenv from "dotenv";

import { Db } from "./Database/DbConnectionPool";
import { Repository } from "typeorm";

import { PlantsService } from "./Services/PlantsService";
import { PlantsController } from "./WebApi/controllers/PlantsController";

import { initialize_database } from "./Database/InitializeConnection";
import { Plant } from "./Domain/models/Plant";

dotenv.config({ override: true });

const app = express();

const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods = process.env.CORS_METHODS?.split(",").map((m: string) =>
  m.trim()
) ?? ["GET", "POST", "PUT", "DELETE"];

app.use(cors({ origin: corsOrigin, methods: corsMethods }));
app.use(express.json());

initialize_database();

const plantRepo: Repository<Plant> = Db.getRepository(Plant);

const plantsService = new PlantsService(plantRepo);
const plantsController = new PlantsController(plantsService);

app.use("/api/v1", plantsController.getRouter());

export default app;
