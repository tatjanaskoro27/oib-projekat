// src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Db } from './Database/DbConnectionPool';
import { initialize_database } from './Database/InitializeConnection';
import { Perfume } from './Domain/Entities/Perfume';
import { Sale } from './Domain/Entities/Sale';

// Prvo učitaj environment varijable
dotenv.config();

// Inicijalizacija baze
initialize_database();

const app = express();
const port = process.env.PORT || 3002;

// CORS - samo gateway može pristupiti
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:8080',
    credentials: true
}));

app.use(express.json());

// Middleware: provjera API key-a (samo za sales rute)
const salesMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    
    // Health check je javan
    if (req.path === '/health') {
        return next();
    }
    
    // Provjeri API key
    if (apiKey !== process.env.GATEWAY_API_KEY) {
        return res.status(403).json({ 
            error: 'Forbidden: Only gateway service can access sales endpoints',
            hint: 'Send x-api-key header with: ' + process.env.GATEWAY_API_KEY
        });
    }
    
    next();
};

// Primijeni middleware na sve sales rute
app.use('/api/sales', salesMiddleware);

// RUTE SA BAZOM PODATAKA

// GET /api/sales/perfumes - dohvati sve parfeme
app.get('/api/sales/perfumes', async (req, res) => {
    try {
        const perfumeRepository = Db.getRepository(Perfume); // ← PROMIJENJENO
        const perfumes = await perfumeRepository.find();
        res.json(perfumes);
    } catch (error) {
        console.error('Error fetching perfumes:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/sales/purchase - napravi kupovinu
app.post('/api/sales/purchase', async (req, res) => {
    try {
        const { userId, items } = req.body;
        
        if (!userId || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Missing userId or items array' });
        }
        
        const saleRepository = Db.getRepository(Sale); // ← PROMIJENJENO
        const sale = new Sale();
        sale.userId = userId;
        sale.items = items;
        
        // Izračunaj ukupnu cijenu
        sale.totalAmount = items.reduce((sum: number, item: any) => {
            return sum + (item.price || 0) * (item.quantity || 1);
        }, 0);
        
        sale.status = 'completed';
        
        const savedSale = await saleRepository.save(sale);
        res.status(201).json({
            message: 'Purchase successful',
            sale: savedSale
        });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ error: 'Failed to process sale' });
    }
});

// POST /api/sales/seed - dodaj test podatke (samo za development!)
app.post('/api/sales/seed', salesMiddleware, async (req, res) => {
    try {
        const perfumeRepository = Db.getRepository(Perfume); // ← PROMIJENJENO
        
        // Provjeri da li već postoje podaci
        const existing = await perfumeRepository.count();
        if (existing > 0) {
            return res.json({ message: 'Data already exists' });
        }
        
        const perfumes = [
            { 
                name: 'Chanel No 5', 
                description: 'Classic floral perfume', 
                price: 120.00, 
                stock: 10 
            },
            { 
                name: 'Dior Sauvage', 
                description: 'Fresh woody scent', 
                price: 95.50, 
                stock: 15 
            },
            { 
                name: 'Gucci Bloom', 
                description: 'Floral bouquet', 
                price: 105.00, 
                stock: 8 
            },
        ];
        
        for (const perfumeData of perfumes) {
            const perfume = new Perfume();
            Object.assign(perfume, perfumeData);
            await perfumeRepository.save(perfume);
        }
        
        res.json({ message: 'Test data seeded successfully' });
    } catch (error) {
        console.error('Error seeding data:', error);
        res.status(500).json({ error: 'Failed to seed data' });
    }
});

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