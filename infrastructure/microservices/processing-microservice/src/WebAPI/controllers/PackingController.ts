import { Router, Request, Response } from "express";
import { ILogerService } from "../../Domain/services/ILogerService";
import { IPackingService } from "../../Domain/services/IPackingService";
import { validatePackAndSendData } from "../validators/PackAndSendValidator";

export class PackingController {
  private readonly router: Router;

  constructor(
    private readonly packingService: IPackingService,
    private readonly logger: ILogerService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // novo: processing pakovanje -> skladiste
    this.router.post("/packing/send", this.packAndSend.bind(this));
  }

  private async packAndSend(req: Request, res: Response): Promise<void> {
    try {
      const validation = validatePackAndSendData(req.body);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      this.logger.log("Packing and sending package to warehouse");
      const result = await this.packingService.packAndSend(req.body);
      res.status(201).json(result);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
