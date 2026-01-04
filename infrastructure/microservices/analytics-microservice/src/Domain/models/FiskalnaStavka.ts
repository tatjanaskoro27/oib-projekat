import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("fiskalne_stavke")
export class FiskalnaStavka {

  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  racunId!: number; // FK ka FiskalniRacun.id

  @Column({ length: 100 })
  parfemNaziv!: string;

  @Column("int")
  kolicina!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  cenaPoKomadu!: number;
}
