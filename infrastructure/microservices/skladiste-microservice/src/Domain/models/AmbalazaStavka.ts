import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Ambalaza } from "./Ambalaza";

@Entity()
export class AmbalazaStavka {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 36 })
  perfumeId!: string; // UUID iz processing-a

  @Column({ length: 120 })
  naziv!: string;

  @ManyToOne(() => Ambalaza, (a) => a.stavke, { onDelete: "CASCADE" })
  ambalaza!: Ambalaza;
}
