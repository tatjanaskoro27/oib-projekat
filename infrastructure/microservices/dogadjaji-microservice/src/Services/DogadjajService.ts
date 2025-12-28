import { Repository } from "typeorm";
import { Dogadjaj, TipDogadjaja } from "../Domain/models/Dogadjaj";

export class DogadjajiService {
  constructor(private repo: Repository<Dogadjaj>) {}

  async create(tip: TipDogadjaja, opis: string): Promise<Dogadjaj> {
    if (!opis || opis.trim().length === 0) {
      throw new Error("Opis ne sme biti prazan");
    }

    const dogadjaj = this.repo.create({
      tip,
      opis,
      datumVreme: new Date(),
    });

    return await this.repo.save(dogadjaj);
  }

  async update(id: number, tip: TipDogadjaja, opis: string): Promise<Dogadjaj> {
    const dogadjaj = await this.repo.findOneBy({ id });
    if (!dogadjaj) throw new Error("Dogadjaj ne postoji");

    if (!opis || opis.trim().length === 0) {
      throw new Error("Opis ne sme biti prazan");
    }

    dogadjaj.tip = tip;
    dogadjaj.opis = opis;

    return await this.repo.save(dogadjaj);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new Error("Dogadjaj ne postoji");
  }

  async getAll(): Promise<Dogadjaj[]> {
    return await this.repo.find({ order: { datumVreme: "DESC" } });
  }

  async getByTip(tip: TipDogadjaja): Promise<Dogadjaj[]> {
    return await this.repo.find({ where: { tip }, order: { datumVreme: "DESC" } });
  }
}
