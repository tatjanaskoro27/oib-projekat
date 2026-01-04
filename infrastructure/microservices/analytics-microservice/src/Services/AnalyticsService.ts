import { Repository } from "typeorm";
import { FiskalniRacun } from "../Domain/models/FiskalniRacun";
import { FiskalnaStavka } from "../Domain/models/FiskalnaStavka";
import { KreirajRacunDto } from "../Domain/DTOs/KreirajRacunDto";

export class AnalyticsService {
  private fiskalniRacunRepository: Repository<FiskalniRacun>;
  private fiskalnaStavkaRepository: Repository<FiskalnaStavka>;

  constructor(
    fiskalniRacunRepository: Repository<FiskalniRacun>,
    fiskalnaStavkaRepository: Repository<FiskalnaStavka>
  ) {
    this.fiskalniRacunRepository = fiskalniRacunRepository;
    this.fiskalnaStavkaRepository = fiskalnaStavkaRepository;
  }

  // pregled fiskalnih računa
  async pregledFiskalnihRacuna(): Promise<FiskalniRacun[]> {
    return await this.fiskalniRacunRepository.find();
  }

  // ukupna prodaja
  async ukupnaProdaja(): Promise<number> {
    const result = await this.fiskalniRacunRepository
      .createQueryBuilder("racun")
      .select("SUM(racun.ukupanIznos)", "ukupno")
      .getRawOne();

    return Number(result?.ukupno) || 0;
  }

  // mesečna prodaja za zadatu godinu
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

  //  kreiranje računa + stavki (za POST /racuni)
  async kreirajFiskalniRacun(
    dto: KreirajRacunDto
  ): Promise<{ racunId: number; ukupanIznos: number }> {
    if (!dto?.stavke?.length) {
      throw new Error("Stavke su obavezne.");
    }

    for (const s of dto.stavke) {
      if (!s.parfemNaziv || s.parfemNaziv.trim().length < 2) {
        throw new Error("Neispravan naziv parfema.");
      }
      if (!Number.isInteger(s.kolicina) || s.kolicina <= 0) {
        throw new Error("Količina mora biti pozitivan ceo broj.");
      }
      if (Number(s.cenaPoKomadu) < 0) {
        throw new Error("Cena ne može biti negativna.");
      }
    }

    const ukupanIznos = dto.stavke.reduce(
      (sum, s) => sum + Number(s.cenaPoKomadu) * s.kolicina,
      0
    );

    // Transakcija: ili upiše i racun i stavke ili ništa
    return await this.fiskalniRacunRepository.manager.transaction(async (trx) => {
      const racunRepo = trx.getRepository(FiskalniRacun);
      const stavkaRepo = trx.getRepository(FiskalnaStavka);

 const insertResult = await racunRepo.insert({
  ukupanIznos,
  ...(dto.datum ? { datum: new Date(dto.datum) } : {}),
});

const racunId = insertResult.identifiers[0].id as number;


if (!racunId) {
  throw new Error("Nije moguće dobiti ID novog računa.");
}



      const stavke = dto.stavke.map((s) =>
        stavkaRepo.create({
          racunId: racunId,
          parfemNaziv: s.parfemNaziv.trim(),
          kolicina: s.kolicina,
          cenaPoKomadu: Number(s.cenaPoKomadu),
        })
      );

      await stavkaRepo.save(stavke);

      return { racunId:racunId, ukupanIznos };
    });
  }
}
