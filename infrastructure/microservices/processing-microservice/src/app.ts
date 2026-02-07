import express from 'express';
import cors from 'cors';
import "reflect-metadata";
import { initialize_database } from './Database/InitializeConnection';
import dotenv from 'dotenv';
import { Repository } from 'typeorm';
import { Db } from './Database/DbConnectionPool';
import { ILogerService } from './Domain/services/ILogerService';
import { LogerService } from './Services/LogerService';
import { Perfume } from './Domain/models/Perfume';
import { IProcessingService } from './Domain/services/IProcessingService';
import { ProcessingService } from './Services/ProcessingService';
import { ProcessingController } from './WebAPI/controllers/ProcessingController';
import { IPackingService } from "./Domain/services/IPackingService";
import { PackingService } from "./Services/PackingService";
import { PackingController } from "./WebAPI/controllers/PackingController";
import { PackedPerfume } from "./Domain/models/PackedPerfume";

dotenv.config({ quiet: true });

const app = express();

// Read CORS settings from environment
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods =
  process.env.CORS_METHODS?.split(",").map((m) => m.trim()) ??
  ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"];

// ✅ dodajemo: dozvoli i front (5173) čak i ako .env ima 4000
const allowedOrigins = new Set<string>([
  corsOrigin,
  "http://localhost:5173",
]);
// Protected microservice from unauthorized access
app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
}));

app.use(express.json());

initialize_database();

// ORM Repositories
const perfumeRepository: Repository<Perfume> = Db.getRepository(Perfume);
const packedPerfumeRepository = Db.getRepository(PackedPerfume);
// Services
const processingService: IProcessingService = new ProcessingService(perfumeRepository);
const logerService: ILogerService = new LogerService();
const packingService: IPackingService = new PackingService(
  perfumeRepository,
  packedPerfumeRepository,
  processingService
);
// WebAPI routes
const processingController = new ProcessingController(processingService, logerService);
const packingController = new PackingController(packingService, logerService);
// Registering routes
app.use('/api/v1', processingController.getRouter());
app.use('/api/v1', packingController.getRouter());
// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));


export default app;
