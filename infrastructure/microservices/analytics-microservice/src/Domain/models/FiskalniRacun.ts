import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from "typeorm";

import { TipProdaje, NacinPlacanja } from "../enums/ProdajaEnums";

@Entity("fiskalni_racuni")
export class FiskalniRacun {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  ukupanIznos!: number;

  @CreateDateColumn()
  datum!: Date;

  // tip prodaje
  @Column({
    type: "enum",
    enum: TipProdaje,
    default: TipProdaje.MALOPRODAJA,
  })
  tipProdaje!: TipProdaje;

  // način plaćanja
  @Column({
    type: "enum",
    enum: NacinPlacanja,
    default: NacinPlacanja.GOTOVINA,
  })
  nacinPlacanja!: NacinPlacanja;
}
