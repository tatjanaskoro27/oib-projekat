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

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 20 })
  type!: string;

  @Column({ type: "int" })
  netoMl!: number;

  @Column({ type: "varchar", length: 50, unique: true })
  serialNumber!: string;

  @Column({ type: "int" })
  plantId!: number;

  @Column({ type: "datetime" })
  expiryDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
