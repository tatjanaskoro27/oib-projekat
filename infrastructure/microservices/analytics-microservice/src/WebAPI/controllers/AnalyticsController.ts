import { Router } from "express";
//import { AnalyticsService } from "../Services/AnalyticsService";
import { AnalyticsService } from "../../Services/AnalyticsService";
import { Db } from "../../Database/DbConnectionPool";
//import { FiskalniRacun } from "../Domain/models/FiskalniRacun";
import { FiskalniRacun } from "../../Domain/models/FiskalniRacun";

export class AnalyticsController {
  private service: AnalyticsService;
  private router: Router;

  constructor() {
    this.service = new AnalyticsService(Db.getRepository(FiskalniRacun));
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get("/racuni", async (req, res) => {
      try {
        const data = await this.service.pregledFiskalnihRacuna();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Greška pri čitanju računa" });
      }
    });

    this.router.get("/prodaja/ukupno", async (req, res) => {
      try {
        const result = await this.service.ukupnaProdaja();
        res.json({ ukupnaProdaja: result });
      } catch (err) {
        res.status(500).json({ error: "Greška pri izračunu ukupne prodaje" });
      }
    });

    // ⭐ NOVA RUTA — mesečna prodaja po zadatoj godini
    this.router.get("/prodaja/mesecna/:godina", async (req, res) => {
      try {
        const godina = Number(req.params.godina);

        if (Number.isNaN(godina)) {
          return res.status(400).json({ error: "Godina mora biti broj." });
        }

        const data = await this.service.mesecnaProdajaZaGodinu(godina);
        res.json(data);
      } catch (err) {
        res.status(500).json({
          error: "Greška pri izračunu mesečne prodaje"
        });
      }
    });
  }

  public getRouter() {
    return this.router;
  }
}
 
