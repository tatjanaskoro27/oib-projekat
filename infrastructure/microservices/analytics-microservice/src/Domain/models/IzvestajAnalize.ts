import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "izvestaji_analize" })
export class IzvestajAnalize {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "naziv_izvestaja", type: "varchar", length: 120 })
  nazivIzvestaja!: string;

  @Column({ name: "kriterijum", type: "varchar", length: 30, nullable: true })
  kriterijum?: string;

  @Column({ name: "od", type: "datetime", nullable: true })
  od?: Date;

  @Column({ name: "do", type: "datetime", nullable: true })
  do?: Date;

  @Column({ name: "rezultati_json", type: "longtext" })
  rezultatiJson!: string;

  @Column({ name: "zakljucak", type: "text", nullable: true })
  zakljucak?: string;

  @CreateDateColumn({ name: "datum_kreiranja", type: "datetime" })
  datumKreiranja!: Date;
}
