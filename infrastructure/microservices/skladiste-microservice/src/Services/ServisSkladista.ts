import { In } from "typeorm";
import { Repository } from "typeorm";
import { IServisSkladista } from "../Domain/services/IServisSkladista";
import { IStrategijaSkladista } from "../Domain/services/IStrategijaSkladista";
import { Skladiste } from "../Domain/models/Skladiste";
import { Ambalaza } from "../Domain/models/Ambalaza";
import { AmbalazaStavka } from "../Domain/models/AmbalazaStavka";
import { KreirajSkladisteDTO } from "../Domain/DTOs/skladiste/KreirajSkladisteDTO";
import { StatusAmbalaze } from "../Domain/enums/StatusAmbalaze";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ServisSkladista implements IServisSkladista {
  constructor(
    private readonly skladisteRepo: Repository<Skladiste>,
    private readonly ambalazaRepo: Repository<Ambalaza>,
    private readonly stavkaRepo: Repository<AmbalazaStavka>,
    private readonly strategijaDistributivnog: IStrategijaSkladista,
    private readonly strategijaMagacinskog: IStrategijaSkladista
  ) {}

  private strategijaZaUlogu(uloga: "MENADZER_PRODAJE" | "PRODAVAC") {
    return uloga === "MENADZER_PRODAJE"
      ? this.strategijaDistributivnog
      : this.strategijaMagacinskog;
  }

  async kreirajSkladiste(dto: KreirajSkladisteDTO): Promise<Skladiste> {
    const s = this.skladisteRepo.create(dto);
    return this.skladisteRepo.save(s);
  }

  async svaSkladista(): Promise<Skladiste[]> {
    return this.skladisteRepo.find({ relations: ["ambalaze"] });
  }

  async sveAmbalaze(): Promise<Ambalaza[]> {
    return this.ambalazaRepo.find({
      relations: ["skladiste", "stavke"],
      order: { id: "ASC" },
    });
  }

  // 🔥 PRIJEM AMBALAŽE – REALNI PARFEMI
  async prijemAmbalaze(
    skladisteId: number,
    parfemi: { perfumeId: string; naziv: string }[]
  ): Promise<Ambalaza> {
    const skladiste = await this.skladisteRepo.findOneByOrFail({ id: skladisteId });

    const ambalaza = this.ambalazaRepo.create({
      naziv: `Ambalaza-${Date.now()}`,
      adresaPosiljaoca: "Processing",
      status: StatusAmbalaze.USKLADISTENA,
      skladiste,
    });

    await this.ambalazaRepo.save(ambalaza);

    for (const p of parfemi) {
      const stavka = this.stavkaRepo.create({
        perfumeId: p.perfumeId,
        naziv: p.naziv,
        ambalaza,
      });
      await this.stavkaRepo.save(stavka);
    }

    return ambalaza;
  }

  async posaljiParfeme(
  items: { naziv: string; kolicina: number }[],
  uloga: "MENADZER_PRODAJE" | "PRODAVAC",
  mode: "STANJE" | "ISPORUKA"
): Promise<
  | { naziv: string; kolicina: number }[]
  | { perfumeId: string; naziv: string }[]
> {
  if (mode === "STANJE") {
    const stavke = await this.stavkaRepo.find({
      relations: ["ambalaza"],
      where: {
            ambalaza: {
            status: In([StatusAmbalaze.USKLADISTENA, StatusAmbalaze.POSLATA]),
              },
            },
    });

    return items.map((i) => ({
      naziv: i.naziv,
      kolicina: stavke.filter((s) => s.naziv === i.naziv).length,
    }));
  }

  // ISPORUKA
  const strategija = this.strategijaZaUlogu(uloga);
  const rezultat: { perfumeId: string; naziv: string }[] = [];

  // (možeš zadržati sleep po strategiji)
  await sleep(strategija.kasnjenjeMs());

  for (const item of items) {
    const dostupni = await this.stavkaRepo.find({
      where: { naziv: item.naziv },
      relations: ["ambalaza"],
      take: item.kolicina,
    });

    if (dostupni.length < item.kolicina) {
      throw new Error(`Nema dovoljno parfema: ${item.naziv}`);
    }

    for (const s of dostupni) {
      rezultat.push({ perfumeId: s.perfumeId, naziv: s.naziv });
      await this.stavkaRepo.remove(s);
    }
  }

  return rezultat;
}


 async posaljiAmbalaze(
  trazenaKolicina: number,
  uloga: "MENADZER_PRODAJE" | "PRODAVAC"
): Promise<Ambalaza[]> {

  const strategija = this.strategijaZaUlogu(uloga);

  // ✅ limit po specifikaciji: 3 ili 1
  const max = strategija.maxAmbalazaPoSlanju();
  if (trazenaKolicina > max) {
    throw new Error(
      `Uloga ${uloga} može poslati najviše ${max} ambalaža u jednom slanju.`
    );
  }

  // ✅ vreme nabavke po specifikaciji: 0.5s ili 2.5s
  await sleep(strategija.kasnjenjeMs());

  const dostupne = await this.ambalazaRepo.find({
    where: { status: StatusAmbalaze.USKLADISTENA },
    take: trazenaKolicina,
    relations: ["stavke"],
  });

  if (dostupne.length < trazenaKolicina) {
    throw new Error("Nema dovoljno ambalaža u skladištu");
  }

  dostupne.forEach((a) => (a.status = StatusAmbalaze.POSLATA));
  return this.ambalazaRepo.save(dostupne);
}

}
