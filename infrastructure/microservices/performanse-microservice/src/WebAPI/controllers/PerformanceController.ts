import { Router, Request, Response } from "express";
import { Db } from "../../Database/DbConnectionPool";
import { IzvestajPerformanse } from "../../Domain/models/IzvestajPerformanse";
import { PerformanseService } from "../../Services/PerformanceService";
import { PdfService } from "../../Services/PDFService";

export class PerformanseController {
  private router: Router;
  private service: PerformanseService;

  constructor() {
    this.router = Router();
    this.service = new PerformanseService(Db.getRepository(IzvestajPerformanse));
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/simulacije", async (req: Request, res: Response) => {
      try {
        const saved = await this.service.pokreniSimulaciju(req.body);
        return res.status(201).json(saved);
      } catch (err: any) {
        return res.status(400).json({
          error: err?.message ?? "Neispravni podaci",
        });
      }
    });

    this.router.post("/izvestaji", async (req: Request, res: Response) => {
      try {
        const saved = await this.service.kreirajIzvestaj(req.body);
        return res.status(201).json(saved);
      } catch (err: any) {
        return res.status(400).json({
          error: err?.message ?? "Neispravni podaci",
        });
      }
    });

    this.router.get("/izvestaji", async (req: Request, res: Response) => {
      try {
        // ✅ helper: uzmi prvi element ako je query dupliran (string[])
        const pickFirst = (v: any): string | undefined => {
          if (typeof v === "string") return v;
          if (Array.isArray(v) && typeof v[0] === "string") return v[0];
          return undefined;
        };

        const algoritam = pickFirst(req.query.algoritam);
        const od = pickFirst(req.query.od);
        const doDat = pickFirst(req.query.do);

        const data = await this.service.filtrirajIzvestaje({
          algoritam,
          od,
          do: doDat,
        });

        return res.json(data);
      } catch (err: any) {
        return res.status(400).json({
          error: err?.message ?? "Neispravni parametri",
        });
      }
    });

    this.router.get("/izvestaji/:id", async (req, res) => {
      try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
          return res.status(400).json({ error: "ID mora biti broj." });
        }

        const data = await this.service.izvestajPoId(id);
        return res.json(data);
      } catch (err: any) {
        return res.status(404).json({
          error: err?.message ?? "Izveštaj nije pronađen",
        });
      }
    });

    this.router.get("/izvestaji/:id/pdf", async (req, res) => {
      try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
          return res.status(400).json({ error: "ID mora biti broj." });
        }

        const izvestaj = await this.service.izvestajPoId(id);

        const pdfBuffer = await PdfService.generateIzvestajPdf(izvestaj);

        if (!pdfBuffer || pdfBuffer.length === 0) {
          return res.status(500).json({
            error: "PDF nije uspešno generisan",
          });
        }

        const safeName = (izvestaj.nazivIzvestaja || "izvestaj")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "_");

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeName}.pdf"`
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        return res.status(200).send(pdfBuffer);
      } catch (err: any) {
        console.error("PDF ERROR:", err);
        return res.status(500).json({
          error: err?.message ?? "Greška pri generisanju PDF-a",
        });
      }
    });
  }

  public getRouter() {
    return this.router;
  }
}
