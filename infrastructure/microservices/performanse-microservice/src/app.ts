import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { PerformanseController } from "./WebAPI/controllers/PerformanceController";

const app = express();

/**
 * Middlewares
 */
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/**
 * Health check
 */
app.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    service: "performanse-microservice",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Routes
 */
const performanseController = new PerformanseController();
app.use("/api/v1/performanse", performanseController.getRouter());

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  return res.status(404).json({ error: "Ruta ne postoji." });
});

/**
 * Global error handler
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Global error:", err);
  return res.status(500).json({
    error: "Interna greška na serveru.",
    details: err?.message ?? null,
  });
});

export default app;
