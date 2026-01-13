// src/Database/data-source.ts
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Perfume } from '../Domain/Entities/Perfume';
import { Sale } from '../Domain/Entities/Sale';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'sales_db',
    synchronize: true,  // TRUE SAMO ZA DEVELOPMENT!
    logging: true,
    entities: [Perfume, Sale],
    migrations: [],
    subscribers: [],
    extra: {
        connectionLimit: 10
    }
});