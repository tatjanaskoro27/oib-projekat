import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from "typeorm";

@Entity({ name: "izvestaj_performanse" })
export class IzvestajPerformanse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nazivIzvestaja!: string;

  @Column()
  algoritam!: string;

  @Column("longtext")
  rezultatiJson!: string;

  @Column("text")
  zakljucak!: string;

  @CreateDateColumn()
  datumKreiranja!: Date;
}
