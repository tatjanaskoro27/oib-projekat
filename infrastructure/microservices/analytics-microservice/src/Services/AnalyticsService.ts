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

  // kreiranje računa + stavki (POST /racuni)
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

    return await this.fiskalniRacunRepository.manager.transaction(async (trx) => {
      const racunRepo = trx.getRepository(FiskalniRacun);
      const stavkaRepo = trx.getRepository(FiskalnaStavka);

     const insertResult = await racunRepo.insert({
  ukupanIznos,
  ...(dto.datum ? { datum: new Date(dto.datum) } : {}),
  ...(dto.tipProdaje ? { tipProdaje: dto.tipProdaje } : {}),
  ...(dto.nacinPlacanja ? { nacinPlacanja: dto.nacinPlacanja } : {}),
});


      const racunId = insertResult.identifiers[0]?.id as number;
      if (!racunId) {
        throw new Error("Nije moguće dobiti ID novog računa.");
      }

      const stavke = dto.stavke.map((s) =>
        stavkaRepo.create({
          racunId,
          parfemNaziv: s.parfemNaziv.trim(),
          kolicina: s.kolicina,
          cenaPoKomadu: Number(s.cenaPoKomadu),
        })
      );

      await stavkaRepo.save(stavke);

      return { racunId, ukupanIznos };
    });
  }

  // ===============================
  // NOVO – TOP 10 ANALIZE
  // ===============================

  // TOP 10 najprodavanijih parfema (po količini)
  async top10NajprodavanijihParfema(): Promise<
    { parfemNaziv: string; kolicina: number }[]
  > {
    const rows = await this.fiskalnaStavkaRepository
      .createQueryBuilder("s")
      .select("s.parfemNaziv", "parfemNaziv")
      .addSelect("SUM(s.kolicina)", "kolicina")
      .groupBy("s.parfemNaziv")
      .orderBy("SUM(s.kolicina)", "DESC")
      .limit(10)
      .getRawMany();

    return rows.map((r: any) => ({
      parfemNaziv: r.parfemNaziv,
      kolicina: Number(r.kolicina),
    }));
  }

  // TOP 10 parfema po prihodu
  async prihodTop10Parfema(): Promise<{ parfemNaziv: string; prihod: number }[]> {
    const rows = await this.fiskalnaStavkaRepository
      .createQueryBuilder("s")
      .select("s.parfemNaziv", "parfemNaziv")
      .addSelect("SUM(s.kolicina * s.cenaPoKomadu)", "prihod")
      .groupBy("s.parfemNaziv")
      .orderBy("SUM(s.kolicina * s.cenaPoKomadu)", "DESC")
      .limit(10)
      .getRawMany();

    return rows.map((r: any) => ({
      parfemNaziv: r.parfemNaziv,
      prihod: Number(r.prihod),
    }));
  }

  // NEDELJNA PRODAJA (po opsegu datuma)
  async nedeljnaProdaja(start: string, end: string): Promise<{
    start: string;
    end: string;
    ukupno: number;
  }> {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error("Neispravan datum. Koristi format YYYY-MM-DD.");
    }

    // end uključujemo do kraja dana: 23:59:59.999
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      throw new Error("Start datum ne može biti posle end datuma.");
    }

    const result = await this.fiskalniRacunRepository
      .createQueryBuilder("racun")
      .select("SUM(racun.ukupanIznos)", "ukupno")
      .where("racun.datum >= :start AND racun.datum <= :end", {
        start: startDate,
        end: endDate,
      })
      .getRawOne();

    return {
      start,
      end,
      ukupno: Number(result?.ukupno) || 0,
    };
  }

  // GODIŠNJA PRODAJA
  async godisnjaProdaja(godina: number): Promise<{
    godina: number;
    ukupno: number;
  }> {
    if (!Number.isInteger(godina) || godina < 2000) {
      throw new Error("Neispravna godina.");
    }

    const result = await this.fiskalniRacunRepository
      .createQueryBuilder("racun")
      .select("SUM(racun.ukupanIznos)", "ukupno")
      .where("YEAR(racun.datum) = :godina", { godina })
      .getRawOne();

    return {
      godina,
      ukupno: Number(result?.ukupno) || 0,
    };
  }

  // TREND PRODAJE (po danima u opsegu)
  async trendProdaje(start: string, end: string): Promise<
    { datum: string; ukupno: number }[]
  > {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error("Neispravan datum. Koristi format YYYY-MM-DD.");
    }

    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      throw new Error("Start datum ne može biti posle end datuma.");
    }

    const rows = await this.fiskalniRacunRepository
      .createQueryBuilder("racun")
      .select("DATE(racun.datum)", "datum")
      .addSelect("SUM(racun.ukupanIznos)", "ukupno")
      .where("racun.datum >= :start AND racun.datum <= :end", {
        start: startDate,
        end: endDate,
      })
      .groupBy("DATE(racun.datum)")
      .orderBy("DATE(racun.datum)", "ASC")
      .getRawMany();

    return rows.map((r: any) => ({
      datum: new Date(r.datum).toISOString().slice(0, 10), // YYYY-MM-DD
      ukupno: Number(r.ukupno) || 0,
    }));
  }

  // ===============================
  // NOVO – PRODATO KOMADA (količina)
  // ===============================

  // ukupno prodatih komada (sve stavke)
  async ukupnoProdatihKomada(): Promise<number> {
    const result = await this.fiskalnaStavkaRepository
      .createQueryBuilder("s")
      .select("SUM(s.kolicina)", "ukupno")
      .getRawOne();

    return Number(result?.ukupno) || 0;
  }

  // prodatih komada u opsegu (nedeljno/period)
  async prodatihKomadaUPeriodu(start: string, end: string): Promise<{
    start: string;
    end: string;
    ukupnoKomada: number;
  }> {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error("Neispravan datum. Koristi format YYYY-MM-DD.");
    }

    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      throw new Error("Start datum ne može biti posle end datuma.");
    }

    const result = await this.fiskalnaStavkaRepository
      .createQueryBuilder("s")
      .innerJoin(FiskalniRacun, "r", "r.id = s.racunId")
      .select("SUM(s.kolicina)", "ukupnoKomada")
      .where("r.datum >= :start AND r.datum <= :end", {
        start: startDate,
        end: endDate,
      })
      .getRawOne();

    return {
      start,
      end,
      ukupnoKomada: Number(result?.ukupnoKomada) || 0,
    };
  }

  // mesečno prodatih komada za godinu
  async mesecnoProdatihKomadaZaGodinu(
    godina: number
  ): Promise<{ mesec: number; ukupnoKomada: number }[]> {
    const rows = await this.fiskalnaStavkaRepository
      .createQueryBuilder("s")
      .innerJoin(FiskalniRacun, "r", "r.id = s.racunId")
      .select("MONTH(r.datum)", "mesec")
      .addSelect("SUM(s.kolicina)", "ukupnoKomada")
      .where("YEAR(r.datum) = :godina", { godina })
      .groupBy("MONTH(r.datum)")
      .orderBy("MONTH(r.datum)", "ASC")
      .getRawMany();

    return rows.map((row: any) => ({
      mesec: Number(row.mesec),
      ukupnoKomada: Number(row.ukupnoKomada) || 0,
    }));
  }

  // godišnje prodatih komada za godinu
  async godisnjeProdatihKomada(godina: number): Promise<{
    godina: number;
    ukupnoKomada: number;
  }> {
    if (!Number.isInteger(godina) || godina < 2000) {
      throw new Error("Neispravna godina.");
    }

    const result = await this.fiskalnaStavkaRepository
      .createQueryBuilder("s")
      .innerJoin(FiskalniRacun, "r", "r.id = s.racunId")
      .select("SUM(s.kolicina)", "ukupnoKomada")
      .where("YEAR(r.datum) = :godina", { godina })
      .getRawOne();

    return {
      godina,
      ukupnoKomada: Number(result?.ukupnoKomada) || 0,
    };
  }
}
