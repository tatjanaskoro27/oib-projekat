import express from 'express';
import cors from 'cors';
import "reflect-metadata";
import { initialize_database } from './Database/InitializeConnection';
import dotenv from 'dotenv';
import { Repository } from 'typeorm';
import { Db } from './Database/DbConnectionPool';
import { ILogerService } from './Domain/services/ILogerService';
import { LogerService } from './Services/LogerService';
import { Plant } from './Domain/models/Plant';
import { IProductionService } from './Domain/services/IProductionService';
import { ProductionService } from './Services/ProductionService';
import { PlantsController } from './WebAPI/controllers/PlantsController';

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
const plantRepository: Repository<Plant> = Db.getRepository(Plant);

// Services
const productionService: IProductionService = new ProductionService(plantRepository);
const logerService: ILogerService = new LogerService();

// WebAPI routes
const plantsController = new PlantsController(productionService, logerService);

// Registering routes
app.use('/api/v1', plantsController.getRouter());

export default app;
