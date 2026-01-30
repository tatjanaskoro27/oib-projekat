import { Router } from "express";
import { AnalyticsService } from "../../Services/AnalyticsService";
import { AnalyticsPdfService } from "../../Services/AnalyticsPdfService";
import { Db } from "../../Database/DbConnectionPool";
import { FiskalniRacun } from "../../Domain/models/FiskalniRacun";
import { FiskalnaStavka } from "../../Domain/models/FiskalnaStavka";

export class AnalyticsController {
  private service: AnalyticsService;
  private router: Router;

  constructor() {
    this.service = new AnalyticsService(
      Db.getRepository(FiskalniRacun),
      Db.getRepository(FiskalnaStavka)
    );
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // =========================
    // RACUNI
    // =========================

    // kreiranje računa + stavki
    this.router.post("/racuni", async (req, res) => {
      try {
        const result = await this.service.kreirajFiskalniRacun(req.body);
        res.status(201).json(result);
      } catch (err: any) {
        res.status(400).json({
          error: err?.message ?? "Neispravni podaci za kreiranje računa",
        });
      }
    });

    // pregled računa
    this.router.get("/racuni", async (req, res) => {
      try {
        const data = await this.service.pregledFiskalnihRacuna();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Greška pri čitanju računa" });
      }
    });

    // =========================
    // ZARADA / PRIHOD (NOVAC)
    // =========================

    // ukupna zarada/prihod
    this.router.get("/prodaja/ukupno", async (req, res) => {
      try {
        const result = await this.service.ukupnaProdaja();
        res.json({ ukupnaProdaja: result });
      } catch (err) {
        res.status(500).json({ error: "Greška pri izračunu ukupne prodaje" });
      }
    });

    // nedeljna/period zarada (query: start, end)
    // primer: /prodaja/nedeljna?start=2026-01-01&end=2026-01-07
    this.router.get("/prodaja/nedeljna", async (req, res) => {
      try {
        const start = String(req.query.start ?? "");
        const end = String(req.query.end ?? "");

        if (!start || !end) {
          return res.status(400).json({
            error: "Query parametri start i end su obavezni (YYYY-MM-DD).",
          });
        }

        const data = await this.service.nedeljnaProdaja(start, end);
        res.json(data);
      } catch (err: any) {
        res.status(400).json({
          error: err?.message ?? "Greška pri izračunu nedeljne prodaje",
        });
      }
    });

    // mesečna zarada po zadatoj godini
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
          error: "Greška pri izračunu mesečne prodaje",
        });
      }
    });

    // godišnja zarada
    this.router.get("/prodaja/godisnja/:godina", async (req, res) => {
      try {
        const godina = Number(req.params.godina);

        if (Number.isNaN(godina)) {
          return res.status(400).json({
            error: "Godina mora biti broj.",
          });
        }

        const data = await this.service.godisnjaProdaja(godina);
        res.json(data);
      } catch (err: any) {
        res.status(400).json({
          error: err?.message ?? "Greška pri izračunu godišnje prodaje",
        });
      }
    });

    // trend zarade po danima (query: start, end)
    // primer: /prodaja/trend?start=2026-01-01&end=2026-01-31
    this.router.get("/prodaja/trend", async (req, res) => {
      try {
        const start = String(req.query.start ?? "");
        const end = String(req.query.end ?? "");

        if (!start || !end) {
          return res.status(400).json({
            error: "Query parametri start i end su obavezni (YYYY-MM-DD).",
          });
        }

        const data = await this.service.trendProdaje(start, end);
        res.json(data);
      } catch (err: any) {
        res.status(400).json({
          error: err?.message ?? "Greška pri dobijanju trenda prodaje",
        });
      }
    });

    // =========================
    // PRODAJA (KOLIČINA / KOMADI)
    // =========================

    // ukupno prodatih komada
    this.router.get("/prodaja/kolicina/ukupno", async (req, res) => {
      try {
        const ukupnoKomada = await this.service.ukupnoProdatihKomada();
        res.json({ ukupnoKomada });
      } catch (err) {
        res.status(500).json({ error: "Greška pri izračunu ukupne količine" });
      }
    });

    // prodatih komada u opsegu (query: start, end)
    // primer: /prodaja/kolicina/nedeljna?start=2026-01-01&end=2026-01-07
    this.router.get("/prodaja/kolicina/nedeljna", async (req, res) => {
      try {
        const start = String(req.query.start ?? "");
        const end = String(req.query.end ?? "");

        if (!start || !end) {
          return res.status(400).json({
            error: "Query parametri start i end su obavezni (YYYY-MM-DD).",
          });
        }

        const data = await this.service.prodatihKomadaUPeriodu(start, end);
        res.json(data);
      } catch (err: any) {
        res.status(400).json({
          error: err?.message ?? "Greška pri izračunu količine",
        });
      }
    });

    // mesečno prodatih komada za godinu
    this.router.get("/prodaja/kolicina/mesecna/:godina", async (req, res) => {
      try {
        const godina = Number(req.params.godina);

        if (Number.isNaN(godina)) {
          return res.status(400).json({ error: "Godina mora biti broj." });
        }

        const data = await this.service.mesecnoProdatihKomadaZaGodinu(godina);
        res.json(data);
      } catch (err) {
        res.status(500).json({
          error: "Greška pri izračunu mesečne količine",
        });
      }
    });

    // godišnje prodatih komada za godinu
    this.router.get("/prodaja/kolicina/godisnja/:godina", async (req, res) => {
      try {
        const godina = Number(req.params.godina);

        if (Number.isNaN(godina)) {
          return res.status(400).json({ error: "Godina mora biti broj." });
        }

        const data = await this.service.godisnjeProdatihKomada(godina);
        res.json(data);
      } catch (err: any) {
        res.status(400).json({
          error: err?.message ?? "Greška pri izračunu godišnje količine",
        });
      }
    });

    // =========================
    // TOP 10
    // =========================

    // top 10 po količini
    this.router.get("/prodaja/top10", async (req, res) => {
      try {
        const data = await this.service.top10NajprodavanijihParfema();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Greška pri dobijanju top 10 parfema" });
      }
    });

    // ukupan prihod top 10 (jedan broj)
    this.router.get("/prodaja/top10-prihod/ukupno", async (req, res) => {
      try {
        const ukupno = await this.service.ukupanPrihodTop10();
        res.json({ ukupno });
      } catch (err) {
        res.status(500).json({
          error: "Greška pri izračunu ukupnog prihoda top 10",
        });
      }
    });

    // top 10 po prihodu
    this.router.get("/prodaja/top10-prihod", async (req, res) => {
      try {
        const data = await this.service.prihodTop10Parfema();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Greška pri dobijanju top 10 prihoda" });
      }
    });

    // =========================
    // PDF IZVESTAJ (NOVO)
    // =========================
    // Primeri:
    // /izvestaj/pdf
    // /izvestaj/pdf?godina=2026
    // /izvestaj/pdf?start=2026-01-01&end=2026-01-31
    // /izvestaj/pdf?godina=2026&start=2026-01-01&end=2026-01-31
    this.router.get("/izvestaj/pdf", async (req, res) => {
      try {
        const start = req.query.start ? String(req.query.start) : undefined;
        const end = req.query.end ? String(req.query.end) : undefined;
        const godina = req.query.godina ? Number(req.query.godina) : undefined;

        const ukupnaProdaja = await this.service.ukupnaProdaja();
        const ukupnoKomada = await this.service.ukupnoProdatihKomada();

        const top10Kolicina = await this.service.top10NajprodavanijihParfema();
        const top10Prihod = await this.service.prihodTop10Parfema();
        const ukupanPrihodTop10 = await this.service.ukupanPrihodTop10();

        const izvestaj: any = {
          datumKreiranja: new Date().toLocaleString(),
          ukupnaProdaja,
          ukupnoKomada,
          top10Kolicina,
          top10Prihod,
          ukupanPrihodTop10,
        };

        // period + trend (ako imamo start/end)
        if (start && end) {
          const p = await this.service.nedeljnaProdaja(start, end);
          const k = await this.service.prodatihKomadaUPeriodu(start, end);
          const trend = await this.service.trendProdaje(start, end);

          izvestaj.period = {
            start: p.start,
            end: p.end,
            ukupnaProdaja: p.ukupno,
            ukupnoKomada: k.ukupnoKomada,
          };
          izvestaj.trend = trend;
        }

        // godisnja + mesecna (ako imamo godinu)
        if (godina && !Number.isNaN(godina)) {
          const god = await this.service.godisnjaProdaja(godina);
          const godKom = await this.service.godisnjeProdatihKomada(godina);

          const mesProdaja = await this.service.mesecnaProdajaZaGodinu(godina);
          const mesKom = await this.service.mesecnoProdatihKomadaZaGodinu(godina);

          izvestaj.godisnja = {
            godina: god.godina,
            ukupno: god.ukupno,
            ukupnoKomada: godKom.ukupnoKomada,
          };

          izvestaj.mesecna = {
            godina,
            prodaja: mesProdaja,
            komadi: mesKom,
          };
        }

        return AnalyticsPdfService.streamIzvestajPdf(res, izvestaj);
      } catch (err: any) {
        return res.status(500).json({
          error: err?.message ?? "Greška pri generisanju PDF izveštaja analize",
        });
      }
    });
  }

  public getRouter() {
    return this.router;
  }
}
