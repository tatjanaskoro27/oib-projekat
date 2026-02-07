import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Pomocna tabela da ispostujemo pravilo iz specifikacije:
 * jedan parfem moze biti u iskljucivo jednoj ambalazi.
 *
 * Ne diramo postojece kolone na Perfume entitetu (samo dodajemo novu tabelu).
 */
@Entity("packed_perfumes")
export class PackedPerfume {
  @PrimaryGeneratedColumn()
  id!: number;

  /** ID parfema iz processing baze */
  @Index({ unique: true })
  @Column({ type: "int" })
  perfumeId!: number;

  /** Referenca/naziv ambalaze (npr. "AMB-1700000000") */
  @Column({ type: "varchar", length: 120 })
  packageRef!: string;

  @CreateDateColumn()
  packedAt!: Date;
}
