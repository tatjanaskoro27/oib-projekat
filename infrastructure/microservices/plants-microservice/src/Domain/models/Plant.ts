import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("plants")
export class Plant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  species!: string | null;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column("int", { default: 0 })
  stock!: number;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  imageUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
