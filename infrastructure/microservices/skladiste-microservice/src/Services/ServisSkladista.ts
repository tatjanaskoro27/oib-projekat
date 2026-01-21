import { Repository } from "typeorm";
import { IServisSkladista } from "../Domain/services/IServisSkladista";
import { IStrategijaSkladista } from "../Domain/services/IStrategijaSkladista";
import { Skladiste } from "../Domain/models/Skladiste";
import { Ambalaza } from "../Domain/models/Ambalaza";
import { KreirajSkladisteDTO } from "../Domain/DTOs/skladiste/KreirajSkladisteDTO";
import { PrijemAmbalazeDTO } from "../Domain/DTOs/skladiste/PrijemAmbalazeDTO";
import { StatusAmbalaze } from "../Domain/enums/StatusAmbalaze";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  async prijemAmbalaze(skladisteId: number, dto: PrijemAmbalazeDTO): Promise<Ambalaza> {
    const skladiste = await this.skladisteRepo.findOne({
      where: { id: skladisteId },
      relations: ["ambalaze"],
    });
    if (!skladiste) throw new Error("Skladiste nije pronadjeno.");

    const trenutno = skladiste.ambalaze?.length ?? 0;
    if (trenutno >= skladiste.maksimalanBrojAmbalaza) {
      throw new Error("Kapacitet skladista je popunjen.");
    }

    const amb = this.ambalazaRepo.create({
      naziv: dto.naziv,
      adresaPosiljaoca: dto.adresaPosiljaoca,
      perfumeIdsJson: JSON.stringify(dto.perfumeIds ?? []),
      status: StatusAmbalaze.USKLADISTENA,
      skladiste,
    });

    return this.ambalazaRepo.save(amb);
  }

  async posaljiAmbalaze(
    trazenaKolicina: number,
    uloga: "MENADZER_PRODAJE" | "PRODAVAC"
  ): Promise<Ambalaza[]> {
    if (!Number.isFinite(trazenaKolicina) || trazenaKolicina <= 0) {
      throw new Error("trazenaKolicina mora biti > 0.");
    }

    const strategija = this.strategijaZaUlogu(uloga);
    const limit = strategija.maxAmbalazaPoSlanju();

    const dostupne = await this.ambalazaRepo.find({
      where: { status: StatusAmbalaze.USKLADISTENA },
      relations: ["skladiste"],
      order: { id: "ASC" },
    });

    const zaSlanje = dostupne.slice(0, trazenaKolicina);
    const poslate: Ambalaza[] = [];

    while (poslate.length < zaSlanje.length) {
      const deo = zaSlanje.slice(poslate.length, poslate.length + limit);

      await sleep(strategija.kasnjenjeMs());

      for (const a of deo) {
        a.status = StatusAmbalaze.ISPORUCENA;
      }

      await this.ambalazaRepo.save(deo);
      poslate.push(...deo);
    }

    return poslate;
  }
}
