import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from "typeorm";

@Entity("fiskalni_racuni")
export class FiskalniRacun {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  ukupanIznos!: number;

  @CreateDateColumn()
  datum!: Date;
}
