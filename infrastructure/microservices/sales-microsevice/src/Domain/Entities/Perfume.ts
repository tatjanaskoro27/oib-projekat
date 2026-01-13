// src/Domain/Entities/Perfume.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('perfumes')
export class Perfume {
    @PrimaryGeneratedColumn('uuid')
    id!: string;  // Dodaj ! ako daje grešku

    @Column()
    name!: string;

    @Column('text')
    description!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;

    @Column()
    stock!: number;

    @Column({ default: true })
    available!: boolean;
}