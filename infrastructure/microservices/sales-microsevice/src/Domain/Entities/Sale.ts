// src/Domain/Entities/Sale.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sales')
export class Sale {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column('simple-json')
    items!: Array<{ perfumeId: string; quantity: number; price: number }>;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount!: number;

    @CreateDateColumn()
    saleDate!: Date;

    @Column({ default: 'pending' })
    status!: string;
}