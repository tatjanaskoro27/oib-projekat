import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { PlantStatus } from "../enums/PlantStatus";

@Entity("plants")
export class Plant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120 })
  name!: string; // opšti naziv

  @Column({ type: "varchar", length: 160 })
  latinName!: string;

  @Column({ type: "varchar", length: 120 })
  originCountry!: string;

  @Column("decimal", { precision: 4, scale: 2, default: 0 })
  oilStrength!: number;

  @Column({ type: "enum", enum: PlantStatus, default: PlantStatus.PLANTED })
  status!: PlantStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
