import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Skladiste } from "./Skladiste";
import { StatusAmbalaze } from "../enums/StatusAmbalaze";
import { AmbalazaStavka } from "./AmbalazaStavka";

@Entity()
export class Ambalaza {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  naziv!: string;

  @Column({ length: 120 })
  adresaPosiljaoca!: string;

  @Column({ type: "enum", enum: StatusAmbalaze })
  status!: StatusAmbalaze;

  @ManyToOne(() => Skladiste, (s) => s.ambalaze, { nullable: true })
  skladiste!: Skladiste | null;

  @OneToMany(() => AmbalazaStavka, (s) => s.ambalaza, { cascade: true })
  stavke!: AmbalazaStavka[];
}
