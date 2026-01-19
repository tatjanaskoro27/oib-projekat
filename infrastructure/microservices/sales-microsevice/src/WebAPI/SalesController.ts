import { Router, Request, Response } from "express";
import { SalesService } from "../Services/SalesService";
import { PurchaseRequestDTO } from "../Domain/DTOs/PurchaseRequestDTO";

export class SalesController {
  public router: Router;
  private salesService: SalesService;

  constructor() {
    this.router = Router();
    this.salesService = new SalesService();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/perfumes", this.getPerfumes.bind(this));
    this.router.post("/seed", this.seed.bind(this));
    this.router.post("/purchase", this.purchase.bind(this));
  }

  private async getPerfumes(req: Request, res: Response) {
    try {
      const perfumes = await this.salesService.getAllPerfumes();
      res.json(perfumes);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  private async seed(req: Request, res: Response) {
    try {
      const result = await this.salesService.seedPerfumes();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  private async purchase(req: Request, res: Response) {
    try {
      const dto: PurchaseRequestDTO = req.body;
      const sale = await this.salesService.purchase(dto);
      res.status(201).json({ message: "Purchase successful", sale });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }
}
