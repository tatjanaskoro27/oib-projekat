// src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Db } from './Database/DbConnectionPool';
import { SalesController } from "./WebAPI/SalesController";


// Prvo učitaj environment varijable
dotenv.config();


const app = express();
const port = process.env.PORT || 3002;

// CORS - samo gateway može pristupiti
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: process.env.CORS_METHODS?.split(",").map(m => m.trim()),
  credentials: true
}));


app.use(express.json());

const salesController = new SalesController();
app.use("/api/sales", salesController.router);


// Health check endpoint (bez zaštite)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'sales-microservice',
        port: port,
        database: Db.isInitialized ? 'connected' : 'disconnected', // ← PROMIJENJENO
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});


export default app;