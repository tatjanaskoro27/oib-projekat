import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type TipDogadjaja = "INFO" | "WARNING" | "ERROR";

@Entity("dogadjaji")
export class Dogadjaj {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: ["INFO", "WARNING", "ERROR"] })
  tip!: TipDogadjaja;

  @Column({ type: "datetime" })
  datumVreme!: Date;

  @Column({ type: "text" })
  opis!: string;
}
