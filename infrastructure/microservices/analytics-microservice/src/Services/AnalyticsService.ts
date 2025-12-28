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
 //  mesečna prodaja za zadatu godinu
  async mesecnaProdajaZaGodinu(
    godina: number
  ): Promise<{ mesec: number; ukupno: number }[]> {
    const rows = await this.fiskalniRacunRepository
      .createQueryBuilder("racun")
      .select("MONTH(racun.datum)", "mesec")
      .addSelect("SUM(racun.ukupanIznos)", "ukupno")
      .where("YEAR(racun.datum) = :godina", { godina })
      .groupBy("MONTH(racun.datum)")
      .orderBy("MONTH(racun.datum)", "ASC")
      .getRawMany();

    return rows.map((row: any) => ({
      mesec: Number(row.mesec),
      ukupno: Number(row.ukupno),
    }));
  }
}
