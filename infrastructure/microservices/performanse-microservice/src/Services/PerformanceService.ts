import { Repository } from "typeorm";
import { IzvestajPerformanse } from "../Domain/models/IzvestajPerformanse";

export type KreirajIzvestajDto = {
  nazivIzvestaja: string;
  algoritam: string;
  rezultatiJson: any;
  zakljucak: string;
};

export type SimulirajDto = {
  algoritam: string;
  params?: {
    brojZahteva?: number;
    prosekLatencijeMs?: number;
    throughput?: number;
    stopaGreske?: number;
    seed?: number;
  };
};

export type FiltrirajIzvestajeDto = {
  algoritam?: string;
  od?: string;
  do?: string;
};

export class PerformanseService {
  constructor(private izvestajRepo: Repository<IzvestajPerformanse>) {}

  async kreirajIzvestaj(dto: KreirajIzvestajDto) {
    if (!dto?.nazivIzvestaja || dto.nazivIzvestaja.trim().length < 2) {
      throw new Error("Naziv izveštaja je obavezan.");
    }
    if (!dto?.algoritam || dto.algoritam.trim().length < 2) {
      throw new Error("Algoritam je obavezan.");
    }
    if (dto?.rezultatiJson === undefined || dto?.rezultatiJson === null) {
      throw new Error("Rezultati su obavezni.");
    }
    if (!dto?.zakljucak || dto.zakljucak.trim().length < 2) {
      throw new Error("Zaključak je obavezan.");
    }

    const rezultatiString =
      typeof dto.rezultatiJson === "string"
        ? dto.rezultatiJson
        : JSON.stringify(dto.rezultatiJson);

    const entity = this.izvestajRepo.create({
      nazivIzvestaja: dto.nazivIzvestaja.trim(),
      algoritam: dto.algoritam.trim(),
      rezultatiJson: rezultatiString,
      zakljucak: dto.zakljucak.trim(),
    });

    return await this.izvestajRepo.save(entity);
  }

  async sviIzvestaji() {
    return await this.izvestajRepo.find({
      order: { datumKreiranja: "DESC" as any },
    });
  }

  async filtrirajIzvestaje(filter: FiltrirajIzvestajeDto) {
    const qb = this.izvestajRepo
      .createQueryBuilder("i")
      .orderBy("i.datumKreiranja", "DESC");

    if (filter?.algoritam && filter.algoritam.trim().length > 0) {
      qb.andWhere("LOWER(i.algoritam) = LOWER(:alg)", {
        alg: filter.algoritam.trim(),
      });
    }

    const parseDate = (s: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        throw new Error("Datum mora biti u formatu YYYY-MM-DD.");
      }
      const d = new Date(s + "T00:00:00.000Z");
      if (Number.isNaN(d.getTime())) {
        throw new Error("Neispravan datum.");
      }
      return d;
    };

    if (filter?.od) {
      const odDate = parseDate(filter.od);
      qb.andWhere("i.datumKreiranja >= :od", { od: odDate.toISOString() });
    }

    if (filter?.do) {
      const doDate = parseDate(filter.do);
      const doInclusive = new Date(doDate.getTime() + 24 * 60 * 60 * 1000);
      qb.andWhere("i.datumKreiranja < :do", { do: doInclusive.toISOString() });
    }

    return await qb.getMany();
  }

  async izvestajPoId(id: number) {
    const found = await this.izvestajRepo.findOne({ where: { id } as any });
    if (!found) throw new Error("Izveštaj nije pronađen.");
    return found;
  }

  private generateConclusion(metrics: {
    errors: number;
    throughput: number;
    latencyAvgMs: number;
  }): string {
    if (metrics.errors > 0) {
      return "Nestabilno: zabeležene su greške tokom simulacije.";
    }
    if (metrics.throughput >= 50 && metrics.latencyAvgMs <= 200) {
      return "Stabilno: dobar protok i niska latencija.";
    }
    if (metrics.throughput < 20) {
      return "Usporeno: nizak protok (throughput).";
    }
    return "Umereno stabilno: bez grešaka, ali performanse variraju.";
  }

  private simulateMetrics(dto: SimulirajDto) {
    const p = dto.params ?? {};

    const brojZahteva = Math.max(1, Number(p.brojZahteva ?? 200));
    const targetLatency = Math.max(1, Number(p.prosekLatencijeMs ?? 180));
    const targetThroughput = Math.max(1, Number(p.throughput ?? 40));
    const errorRate = Math.min(1, Math.max(0, Number(p.stopaGreske ?? 0.01)));

    const jitter = () => (Math.random() - 0.5) * 0.2;

    const latencyAvgMs = Math.round(targetLatency * (1 + jitter()));
    const throughputPerSec = Math.round(targetThroughput * (1 + jitter()));

    const errors = Math.max(
      0,
      Math.round(brojZahteva * errorRate * (1 + jitter()))
    );
    const success = Math.max(0, brojZahteva - errors);

    const durationSec = Math.max(
      1,
      Math.round(brojZahteva / Math.max(1, throughputPerSec))
    );

    return {
      algorithm: dto.algoritam,
      input: {
        brojZahteva,
        targetLatency,
        targetThroughput,
        errorRate,
        seed: p.seed ?? null,
      },
      output: {
        latencyAvgMs,
        throughputPerSec,
        errors,
        success,
        durationSec,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async pokreniSimulaciju(dto: SimulirajDto) {
    if (!dto?.algoritam || dto.algoritam.trim().length < 2) {
      throw new Error("Algoritam je obavezan.");
    }

    const results = this.simulateMetrics({
      algoritam: dto.algoritam.trim(),
      params: dto.params,
    });

    const conclusion = this.generateConclusion({
      errors: results.output.errors,
      throughput: results.output.throughputPerSec,
      latencyAvgMs: results.output.latencyAvgMs,
    });

    const naziv = `${results.algorithm} - ${new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ")}`;

    return await this.kreirajIzvestaj({
      nazivIzvestaja: naziv,
      algoritam: results.algorithm,
      rezultatiJson: results,
      zakljucak: conclusion,
    });
  }
}
