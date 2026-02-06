import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Skladiste } from "./Skladiste";
import { StatusAmbalaze } from "../enums/StatusAmbalaze";

@Entity()
export class Ambalaza {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  naziv!: string;

  @Column({ length: 120 })
  adresaPosiljaoca!: string;

  // parfemi i količine kao JSON string:
  // npr: [{"name":"Chanel No 5","quantity":5},{"name":"Dior Sauvage","quantity":3}]
  @Column({ type: "text" })
  perfumesJson!: string;

  @Column({ type: "enum", enum: StatusAmbalaze, default: StatusAmbalaze.SPAKOVANA })
  status!: StatusAmbalaze;

  @ManyToOne(() => Skladiste, (s) => s.ambalaze, { nullable: true })
  skladiste!: Skladiste | null;
}
