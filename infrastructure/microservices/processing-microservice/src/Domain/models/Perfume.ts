import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("perfumes")
export class Perfume {
  @PrimaryGeneratedColumn()
  id!: number;

  // naziv parfema (npr. "Lavanda Bliss")
  @Column({ type: "varchar", length: 120 })
  name!: string;

  // tip: "parfum" ili "cologne"
  @Column({ type: "varchar", length: 20 })
  type!: string;

  // neto ml u boci: 150 ili 250
  @Column({ type: "int" })
  netoMl!: number;

  // serijski broj: PP-2025-ID_PARFEMA
  @Column({ type: "varchar", length: 50, unique: true })
  serialNumber!: string;

  // plantId iz kojeg je napravljen parfem (po specifikaciji)
  @Column({ type: "int" })
  plantId!: number;

  // rok trajanja (ISO string ili DATE)
  @Column({ type: "datetime" })
  expiryDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
