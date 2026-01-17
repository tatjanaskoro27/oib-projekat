import { Router, Request, Response } from "express";
import { ILogerService } from "../../Domain/services/ILogerService";
import { IProductionService } from "../../Domain/services/IProductionService";
import { validateCreatePlantData } from "../validators/CreatePlantValidator";
import { validateUpdateOilStrengthData } from "../validators/UpdateOilStrengthValidator";
import { validateHarvestPlantsData } from "../validators/HarvestPlantsValidator";

export class PlantsController {
  private readonly router: Router;

  constructor(
    private readonly productionService: IProductionService,
    private readonly logger: ILogerService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/plants", this.plant.bind(this));
    this.router.patch("/plants/:id/oil-strength", this.updateOilStrength.bind(this));
    this.router.post("/plants/harvest", this.harvest.bind(this));
  }

  private async plant(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log("Planting new plant");

      const validation = validateCreatePlantData(req.body);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      const created = await this.productionService.plant(req.body);
      res.status(201).json(created);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async updateOilStrength(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateUpdateOilStrengthData(req.body);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      const id = parseInt(req.params.id, 10);
      this.logger.log(`Updating oilStrength for plant ID ${id}`);

      const percent = Number(req.body.percent);
      const updated = await this.productionService.updateOilStrength(id, percent);

      res.status(200).json(updated);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async harvest(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateHarvestPlantsData(req.body);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      this.logger.log(`Harvesting plants: ${req.body.name}, count=${req.body.count}`);

      const result = await this.productionService.harvest(req.body);
      res.status(200).json(result);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
