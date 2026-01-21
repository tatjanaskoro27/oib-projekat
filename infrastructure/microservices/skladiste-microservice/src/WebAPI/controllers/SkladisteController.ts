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
    this.router.post("/slanje", this.posalji.bind(this));
  }

  getRouter() {
    return this.router;
  }

  private async svaSkladista(req: Request, res: Response) {
    const data = await this.servis.svaSkladista();
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
      if (!Number.isFinite(skladisteId) || skladisteId <= 0) throw new Error("Neispravan skladisteId.");

      const dto = validirajPrijemAmbalaze(req.body);
      const amb = await this.servis.prijemAmbalaze(skladisteId, dto);
      return res.status(201).json(amb);
    } catch (e) {
      return res.status(400).json({ message: (e as Error).message });
    }
  }

  private async posalji(req: Request, res: Response) {
    try {
      // bez gateway-a: ulogu šalješ preko header-a
      // x-uloga: MENADZER_PRODAJE | PRODAVAC
      const uloga = (req.header("x-uloga") || "PRODAVAC") as "MENADZER_PRODAJE" | "PRODAVAC";

      const { trazenaKolicina } = validirajSlanje(req.body);
      const ambalaze = await this.servis.posaljiAmbalaze(trazenaKolicina, uloga);

      return res.json({ uloga, poslato: ambalaze.length, ambalaze });
    } catch (e) {
      return res.status(400).json({ message: (e as Error).message });
    }
  }
}
