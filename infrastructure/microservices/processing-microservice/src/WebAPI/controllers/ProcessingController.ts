import { Router, Request, Response } from "express";
import { ILogerService } from "../../Domain/services/ILogerService";
import { IProcessingService } from "../../Domain/services/IProcessingService";
import { validateStartProcessingData } from "../validators/StartProcessingValidator";
import { validateGetPerfumesData } from "../validators/GetPerfumesValidator";

export class ProcessingController {
  private readonly router: Router;

  constructor(
    private readonly processingService: IProcessingService,
    private readonly logger: ILogerService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/processing/start", this.startProcessing.bind(this));
    this.router.post("/processing/get", this.getPerfumes.bind(this));
  }

  private async startProcessing(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateStartProcessingData(req.body);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      this.logger.log("Starting processing");
      const perfumes = await this.processingService.startProcessing(req.body);
      res.status(201).json(perfumes);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getPerfumes(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateGetPerfumesData(req.body);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      this.logger.log("Getting perfumes");
      const perfumes = await this.processingService.getPerfumes(req.body);
      res.status(200).json(perfumes);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
