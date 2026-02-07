import { Router, Request, Response } from "express";
import { IServisSkladista } from "../../Domain/services/IServisSkladista";

import { validirajKreiranjeSkladista } from "../validators/KreirajSkladisteValidator";
import { validirajPrijemAmbalaze } from "../validators/PrijemAmbalazeValidator";
import { validirajSlanje } from "../validators/SlanjeAmbalazeValidator";

// ✅ DODAJ OVAJ IMPORT (prilagodi putanju ako ti je drugačija)
import { StatusAmbalaze } from "../../Domain/enums/StatusAmbalaze";

export class SkladisteController {
  private readonly router: Router;

  constructor(private readonly servis: IServisSkladista) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get("/skladista", this.svaSkladista.bind(this));
    this.router.post("/skladista", this.kreirajSkladiste.bind(this));
    this.router.post("/skladista/:id/prijem", this.prijemAmbalaze.bind(this));

    // ✅ Gateway gađa baš /slanje sa { trazenaKolicina }
    this.router.post("/slanje", this.posalji.bind(this));

    this.router.get("/ambalaze", this.sveAmbalaze.bind(this));
  }

  getRouter() {
    return this.router;
  }

  // ✅ OVDE: filtriraj POSLATA da UI vidi realno stanje
  private async svaSkladista(req: Request, res: Response) {
    const data: any[] = await this.servis.svaSkladista();

    const filtered = data.map((s) => ({
      ...s,
      ambalaze: Array.isArray(s.ambalaze)
        ? s.ambalaze.filter((a: any) => a.status === StatusAmbalaze.USKLADISTENA)
        : s.ambalaze,
    }));

    return res.json(filtered);
  }

  // ✅ OVDE: po želji isto filtriraj /ambalaze (da ne vidiš POSLATA u listi)
  private async sveAmbalaze(_req: Request, res: Response) {
    const data: any[] = await this.servis.sveAmbalaze();

    const filtered = Array.isArray(data)
      ? data.filter((a: any) => a.status === StatusAmbalaze.USKLADISTENA)
      : data;

    return res.json(filtered);
  }

  private async kreirajSkladiste(req: Request, res: Response) {
    try {
      const dto = validirajKreiranjeSkladista(req.body);
      const s = await this.servis.kreirajSkladiste(dto);
      return res.status(201).json(s);
    } catch (e) {
      return res.status(400).json({ message: (e as Error).message });
    }
  }

  private async prijemAmbalaze(req: Request, res: Response) {
    try {
      const skladisteId = Number(req.params.id);
      if (!Number.isFinite(skladisteId) || skladisteId <= 0) {
        throw new Error("Neispravan skladisteId.");
      }

      const parfemi = validirajPrijemAmbalaze(req.body);
      const amb = await this.servis.prijemAmbalaze(skladisteId, parfemi);
      return res.status(201).json(amb);
    } catch (e) {
      return res.status(400).json({ message: (e as Error).message });
    }
  }

  // ✅ KLJUČNO: uskladi sa Gateway-om (NE DIRAJ OVO)
  // u src/WebAPI/controllers/SkladisteController.ts
private async posalji(req: Request, res: Response) {
  try {
    const ulogaHeader = req.header("x-uloga");
    if (!ulogaHeader) throw new Error("Nedostaje header x-uloga.");

    const uloga = ulogaHeader as "MENADZER_PRODAJE" | "PRODAVAC";

    // format { items: [...] } + x-mode
    if (Array.isArray(req.body?.items)) {
      const modeHeader = req.header("x-mode");
      if (!modeHeader) throw new Error("Nedostaje header x-mode (STANJE ili ISPORUKA).");

      const mode = modeHeader as "STANJE" | "ISPORUKA";
      const dto = validirajSlanje(req.body);
      const poslato = await this.servis.posaljiParfeme(dto.items, uloga, mode);
      return res.json({ uloga, mode, poslato });
    }

    // format { trazenaKolicina }
    const trazenaKolicina = Number(req.body?.trazenaKolicina);
    if (!Number.isFinite(trazenaKolicina) || trazenaKolicina <= 0) {
      throw new Error("trazenaKolicina mora biti > 0");
    }

    const poslato = await this.servis.posaljiAmbalaze(trazenaKolicina, uloga);
    return res.json({ uloga, trazenaKolicina, poslato });
  } catch (e) {
    return res.status(400).json({ message: (e as Error).message });
  }
}

}
