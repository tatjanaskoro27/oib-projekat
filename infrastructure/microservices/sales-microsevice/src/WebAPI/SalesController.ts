import { Router, Request, Response } from "express";
import { PurchaseRequestDTO } from "../Domain/DTOs/PurchaseRequestDTO";
import { SalesService } from "../Services/SalesService";

export class SalesController {
  private readonly router: Router;

  constructor(private readonly salesService: SalesService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // BITNO: ove rute će biti pod /api/v1 (iz app.ts)
    // a najčešće i pod /sales, ako ga dodaš u app.ts (vidi ispod)
    this.router.get("/sales/perfumes", this.getPerfumes.bind(this));
    this.router.post("/sales/seed", this.seed.bind(this));
    this.router.post("/sales/purchase", this.purchase.bind(this));
  }

  private async getPerfumes(req: Request, res: Response) {
    try {
      const perfumes = await this.salesService.getAllPerfumes();
      res.status(200).json(perfumes);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  private async seed(req: Request, res: Response) {
    try {
      const result = await this.salesService.seedPerfumes();
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  private async purchase(req: Request, res: Response) {
  try {
    const dto: PurchaseRequestDTO = req.body;

    // uloga dolazi od gateway-a kao header (x-uloga)
    const h = (req.header("x-uloga") || "").toUpperCase();
    const uloga: "MENADZER_PRODAJE" | "PRODAVAC" = h === "MENADZER_PRODAJE" ? "MENADZER_PRODAJE" : "PRODAVAC";
    const sale = await this.salesService.purchase(dto, uloga);


    res.status(201).json({ message: "Purchase successful", sale });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}


  public getRouter(): Router {
    return this.router;
  }
}
