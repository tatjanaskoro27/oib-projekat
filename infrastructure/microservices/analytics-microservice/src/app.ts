import express from "express";
import cors from "cors";
import "reflect-metadata";
import dotenv from "dotenv";
import { initialize_database } from "./Database/InitializeConnection";
//import { AnalyticsController } from "./controllers/AnalyticsController";
import { AnalyticsController } from "./WebAPI/controllers/AnalyticsController";

dotenv.config({ quiet: true });

const app = express();

// CORS konfiguracija iz .env
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods = process.env.CORS_METHODS?.split(",").map(m => m.trim()) ?? ["GET"];

app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
}));

app.use(express.json());

// inicijalizacija baze
initialize_database();

// kontroler
const analyticsController = new AnalyticsController();

// registrujemo rute
app.use("/api/v1/analytics", analyticsController.getRouter());

// export da index.ts ili server.ts može da ga pokrene
export default app;
