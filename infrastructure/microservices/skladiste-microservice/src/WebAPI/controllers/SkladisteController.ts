import { Router, Request, Response } from "express";
import { IServisSkladista } from "../../Domain/services/IServisSkladista";

import { validirajKreiranjeSkladista } from "../validators/KreirajSkladisteValidator";
import { validirajPrijemAmbalaze } from "../validators/PrijemAmbalazeValidator";

import { validirajSlanje } from "../validators/SlanjeAmbalazeValidator";

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

  private async svaSkladista(req: Request, res: Response) {
    const data = await this.servis.svaSkladista();
    return res.json(data);
  }

  private async sveAmbalaze(_req: Request, res: Response) {
    const data = await this.servis.sveAmbalaze();
    return res.json(data);
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

      const dto = validirajPrijemAmbalaze(req.body);
      const amb = await this.servis.prijemAmbalaze(skladisteId, dto);
      return res.status(201).json(amb);
    } catch (e) {
      return res.status(400).json({ message: (e as Error).message });
    }
  }

  // ✅ KLJUČNO: uskladi sa Gateway-om
  private async posalji(req: Request, res: Response) {
  try {
    const uloga = (req.header("x-uloga") || "PRODAVAC") as
      | "MENADZER_PRODAJE"
      | "PRODAVAC";

    // ✅ 1) PRVO: stari format { items: [...] } + x-mode
    if (Array.isArray(req.body?.items)) {
      const mode = ((req.header("x-mode") || "ISPORUKA") as "STANJE" | "ISPORUKA");
      const dto = validirajSlanje(req.body);
      const poslato = await this.servis.posaljiParfeme(dto.items, uloga, mode);
      return res.json({ uloga, mode, poslato });
    }

    // ✅ 2) ONDA: novi format { trazenaKolicina }
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
