import { Router, Request, Response } from "express";
import { PurchaseRequestDTO, PurchaseItemDTO } from "../Domain/DTOs/PurchaseRequestDTO";
import { SalesService } from "../Services/SalesService";

// mali lokalni tip za normalizovane stavke
type NormalizedItem = { perfumeId: number; quantity: number };

export class SalesController {
  private readonly router: Router;

  constructor(private readonly salesService: SalesService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/sales/perfumes", this.getPerfumes.bind(this));
    this.router.post("/sales/seed", this.seed.bind(this));
    this.router.post("/sales/purchase", this.purchase.bind(this));
  }

  private async getPerfumes(req: Request, res: Response) {
    try {
      const perfumes = await this.salesService.getAllPerfumes();
      return res.status(200).json(perfumes);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  private async seed(req: Request, res: Response) {
    try {
      const result = await this.salesService.seedPerfumes();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  private async purchase(req: Request, res: Response) {
  try {
    const body = req.body as any;

    const items = (Array.isArray(body.items) ? body.items : []).map((it: any) => ({
      name: String(it?.name ?? "").trim(),
      quantity: Number(it?.quantity ?? it?.kolicina ?? it?.qty ?? 1),
    }));

    if (!items.length) {
      return res.status(400).json({ message: "Items array is empty" });
    }

    if (items.some((i: any) => !i.name || !Number.isFinite(i.quantity) || i.quantity <= 0)) {
      return res.status(400).json({
        message: "Each item must have name and quantity > 0",
        items,
      });
    }

    // userId šalji kao string (da ne puca TS ako DTO traži string)
    const dto: any = {
      userId: String(body.userId),
      saleType: body.saleType,
      paymentType: body.paymentType,
      items,
    };

    if (!dto.userId || dto.userId.trim() === "") {
      return res.status(400).json({ message: "userId is required" });
    }

    const raw = String(req.header("x-uloga") || "").toUpperCase();
    const uloga: "MENADZER_PRODAJE" | "PRODAVAC" =
      raw === "MENADZER_PRODAJE" ? "MENADZER_PRODAJE" : "PRODAVAC";

    const sale = await this.salesService.purchase(dto, uloga);

    return res.status(201).json({ message: "Purchase successful", sale });
  } catch (err: any) {
    console.log("🔥 SALES PURCHASE ERROR:", err);
    return res.status(400).json({ message: err?.message ?? "Error" });
  }
}



  public getRouter(): Router {
    return this.router;
  }
}
