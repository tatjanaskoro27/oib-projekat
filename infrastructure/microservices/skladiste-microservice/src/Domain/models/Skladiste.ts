import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Ambalaza } from "./Ambalaza";

@Entity()
export class Skladiste {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  naziv!: string;

  @Column({ length: 120 })
  lokacija!: string;

  @Column()
  maksimalanBrojAmbalaza!: number;

  @OneToMany(() => Ambalaza, (a) => a.skladiste)
  ambalaze!: Ambalaza[];
}
