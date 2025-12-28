import express from "express";
import cors from "cors";
import "reflect-metadata";
import dotenv from "dotenv";
import { initialize_database } from "./Database/InitializeConnection";
import { AnalyticsController } from "./WebAPI/controllers/AnalyticsController";

dotenv.config({ quiet: true });

const app = express();


const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods = process.env.CORS_METHODS?.split(",").map(m => m.trim()) ?? ["GET"];

app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
}));

app.use(express.json());

initialize_database();

const analyticsController = new AnalyticsController();


app.use("/api/v1/analytics", analyticsController.getRouter());

export default app;
