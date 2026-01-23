import express from "express";
import cors from "cors";
import "reflect-metadata";
import dotenv from "dotenv";
import { Repository } from "typeorm";

import { initialize_database } from "./Database/InitializeConnection";
import { Db } from "./Database/DbConnectionPool";

import { Perfume } from "./Domain/Entities/Perfume";
import { Sale } from "./Domain/Entities/Sale";

//import { ISalesService } from "./Domain/services/ISalesService";
import { SalesService } from "./Services/SalesService";
import { SalesController } from "./WebAPI/SalesController";

dotenv.config({ quiet: true });

const app = express();

// Read CORS settings from environment (isto kao šablon)
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

// DB init (kao šablon – u app.ts)
initialize_database();

// ORM repositories
const perfumeRepository = Db.getRepository(Perfume);
const saleRepository = Db.getRepository(Sale);

// Services
const salesService = new SalesService(perfumeRepository, saleRepository);

// Controller
const salesController = new SalesController(salesService);

// Register routes
app.use("/api/v1", salesController.getRouter());


// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));

export default app;
