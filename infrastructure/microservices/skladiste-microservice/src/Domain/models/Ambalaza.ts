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

  // najbrže rešenje: parfemi kao JSON string (npr. "[1,2,3]")
  @Column({ type: "text" })
  perfumeIdsJson!: string;

  @Column({ type: "enum", enum: StatusAmbalaze, default: StatusAmbalaze.SPAKOVANA })
  status!: StatusAmbalaze;

  @ManyToOne(() => Skladiste, (s) => s.ambalaze, { nullable: true })
  skladiste!: Skladiste | null;
}
