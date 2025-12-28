import { Repository } from "typeorm";
import { FiskalniRacun } from "../Domain/models/FiskalniRacun";
export class AnalyticsService {

  private fiskalniRacunRepository: Repository<FiskalniRacun>;

  constructor(fiskalniRacunRepository: Repository<FiskalniRacun>) {
    this.fiskalniRacunRepository = fiskalniRacunRepository;
  }

  //  pregled fiskalnih računa
  async pregledFiskalnihRacuna(): Promise<FiskalniRacun[]> {
    return await this.fiskalniRacunRepository.find();
  }

  //  ukupna prodaja
  async ukupnaProdaja(): Promise<number> {
    const result = await this.fiskalniRacunRepository
      .createQueryBuilder("racun")
      .select("SUM(racun.ukupanIznos)", "ukupno")
      .getRawOne();

    return Number(result.ukupno) || 0;
  }
}
