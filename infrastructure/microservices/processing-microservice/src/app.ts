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

dotenv.config({ quiet: true });

const app = express();

// Read CORS settings from environment
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods = process.env.CORS_METHODS?.split(",").map(m => m.trim()) ?? ["GET", "POST", "PATCH", "PUT", "DELETE"];

// Protected microservice from unauthorized access
app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
}));

app.use(express.json());

initialize_database();

// ORM Repositories
const perfumeRepository: Repository<Perfume> = Db.getRepository(Perfume);

// Services
const processingService: IProcessingService = new ProcessingService(perfumeRepository);
const logerService: ILogerService = new LogerService();

// WebAPI routes
const processingController = new ProcessingController(processingService, logerService);

// Registering routes
app.use('/api/v1', processingController.getRouter());

// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));


export default app;
