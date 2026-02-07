import { Repository } from "typeorm";
import { IServisSkladista } from "../Domain/services/IServisSkladista";
import { IStrategijaSkladista } from "../Domain/services/IStrategijaSkladista";
import { Skladiste } from "../Domain/models/Skladiste";
import { Ambalaza } from "../Domain/models/Ambalaza";
import { KreirajSkladisteDTO } from "../Domain/DTOs/skladiste/KreirajSkladisteDTO";
import { PrijemAmbalazeDTO } from "../Domain/DTOs/skladiste/PrijemAmbalazeDTO";
import { StatusAmbalaze } from "../Domain/enums/StatusAmbalaze";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// ✅ 0) DODAJ OVO GORE (ispod sleep / iznad klase)
const key = (s: string) => String(s || "").trim().toLowerCase();

type Item = { name: string; quantity: number };
type PackItem = { name: string; quantity: number };

function safeParse(json: string): PackItem[] {
  try {
    const v = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v
      .map((x: any) => ({ name: String(x?.name ?? "").trim(), quantity: Number(x?.quantity ?? 0) }))
      .filter((x) => x.name.length > 0 && Number.isFinite(x.quantity) && x.quantity > 0);
  } catch {
    return [];
  }
}

function toJson(items: PackItem[]) {
  return JSON.stringify(items);
}

export class ServisSkladista implements IServisSkladista {
  constructor(
    private readonly skladisteRepo: Repository<Skladiste>,
    private readonly ambalazaRepo: Repository<Ambalaza>,
    private readonly strategijaDistributivnog: IStrategijaSkladista,
    private readonly strategijaMagacinskog: IStrategijaSkladista
  ) {}

  private strategijaZaUlogu(uloga: "MENADZER_PRODAJE" | "PRODAVAC") {
    return uloga === "MENADZER_PRODAJE" ? this.strategijaDistributivnog : this.strategijaMagacinskog;
  }

  async kreirajSkladiste(dto: KreirajSkladisteDTO): Promise<Skladiste> {
    const s = this.skladisteRepo.create({
      naziv: dto.naziv,
      lokacija: dto.lokacija,
      maksimalanBrojAmbalaza: Number(dto.maksimalanBrojAmbalaza),
    });
    return this.skladisteRepo.save(s);
  }

  async svaSkladista(): Promise<Skladiste[]> {
    return this.skladisteRepo.find({ relations: ["ambalaze"] });
  }

  async sveAmbalaze(): Promise<Ambalaza[]> {
    return this.ambalazaRepo.find({
      relations: ["skladiste"],
      order: { id: "ASC" },
    });
  }

  async prijemAmbalaze(skladisteId: number, dto: PrijemAmbalazeDTO): Promise<Ambalaza> {
    const skladiste = await this.skladisteRepo.findOne({
      where: { id: skladisteId },
      relations: ["ambalaze"],
    });
    if (!skladiste) throw new Error("Skladiste nije pronadjeno.");

    const trenutno = skladiste.ambalaze?.length ?? 0;
    if (trenutno >= skladiste.maksimalanBrojAmbalaza) throw new Error("Kapacitet skladista je popunjen.");

    const amb = this.ambalazaRepo.create({
      naziv: dto.naziv,
      adresaPosiljaoca: dto.adresaPosiljaoca,
      perfumesJson: JSON.stringify(dto.items ?? []),
      status: StatusAmbalaze.USKLADISTENA,
      skladiste,
    });

    return this.ambalazaRepo.save(amb);
  }

private async calcState(): Promise<Map<string, number>> {
  const dostupne = await this.ambalazaRepo.find({
    where: { status: StatusAmbalaze.USKLADISTENA },
    order: { id: "ASC" },
  });

  const mapa = new Map<string, number>();
  for (const a of dostupne) {
    const items = safeParse(a.perfumesJson);
    for (const it of items) {
      const k = key(it.name);
      mapa.set(k, (mapa.get(k) ?? 0) + it.quantity);
    }
  }
  return mapa;
}




 async posaljiAmbalaze(broj: number): Promise<Ambalaza[]> {
  // UZIMAMO SAMO USKLADISTENA
  const dostupne = await this.ambalazaRepo.find({
  where: { status: StatusAmbalaze.USKLADISTENA },
  order: { id: "ASC" },
});


  if (dostupne.length < broj) {
    throw new Error("Nema dovoljno ambalaže u skladištu");
  }

  for (const a of dostupne) {
    a.status = StatusAmbalaze.POSLATA;
  }

  await this.ambalazaRepo.save(dostupne);

  return dostupne;
}


  async posaljiParfeme(
    items: Item[],
    uloga: "MENADZER_PRODAJE" | "PRODAVAC",
    mode: "STANJE" | "ISPORUKA"
  ): Promise<Item[]> {
    const trazeno = items.map((i) => ({ name: i.name, quantity: Number(i.quantity) }));

    // MODE = STANJE -> samo vraćamo trenutno stanje za tražene nazive
    if (mode === "STANJE") {
  const stanje = await this.calcState();
  return trazeno.map((t) => ({ name: t.name, quantity: stanje.get(key(t.name)) ?? 0 }));
}

    // MODE = ISPORUKA -> skidamo količine, uz strategiju
    const strategija = this.strategijaZaUlogu(uloga);
    const limit = strategija.maxAmbalazaPoSlanju();

    // učitamo sve dostupne ambalaže
    const dostupne = await this.ambalazaRepo.find({
  where: [
    { status: StatusAmbalaze.USKLADISTENA },
    { status: StatusAmbalaze.POSLATA }, // ✅ da moze skidanje i kad su sve POSLATA
  ],
  order: { id: "ASC" },
});


    // prvo provjerimo ima li dovoljno ukupno
    const stanje = await this.calcState();
for (const t of trazeno) {
  const ima = stanje.get(key(t.name)) ?? 0;
  if (ima < t.quantity) throw new Error(`Nema dovoljno na stanju za: ${t.name} (ima ${ima}, treba ${t.quantity})`);
}

    const remaining = new Map(trazeno.map((t) => [t.name, t.quantity]));
    const sent = new Map<string, number>();

    // šaljemo u "turama" po limit ambalaža i sa kašnjenjem
    for (let idx = 0; idx < dostupne.length; idx += limit) {
  const batch = dostupne.slice(idx, idx + limit);
  if (Array.from(remaining.values()).every((v) => v <= 0)) break;

  await sleep(strategija.kasnjenjeMs());

  let changed = false;

  for (const amb of batch) {
    let pack = safeParse(amb.perfumesJson);

    pack = pack
      .map((p) => {
        const k = key(p.name);
        const need = remaining.get(k) ?? 0;
        if (need <= 0) return p;

        const take = Math.min(need, p.quantity);
        if (take > 0) {
          remaining.set(k, need - take);
          sent.set(k, (sent.get(k) ?? 0) + take);
          changed = true;
          return { ...p, quantity: p.quantity - take };
        }
        return p;
      })
      .filter((p) => p.quantity > 0);

    amb.perfumesJson = toJson(pack);
    if (pack.length === 0) amb.status = StatusAmbalaze.ISPORUCENA;
  }

  if (changed) {
    await this.ambalazaRepo.save(batch);
  }
}

return trazeno.map((t) => ({ name: t.name, quantity: sent.get(key(t.name)) ?? 0 }));
  }
}
