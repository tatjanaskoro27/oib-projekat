import { Router, Request, Response } from "express";
import { ILogerService } from "../../Domain/services/ILogerService";
import { IProductionService } from "../../Domain/services/IProductionService";
import { validateCreatePlantData } from "../validators/CreatePlantValidator";
import { validateUpdateOilStrengthData } from "../validators/UpdateOilStrengthValidator";
import { validateHarvestPlantsData } from "../validators/HarvestPlantsValidator";
import { PlantStatus } from "../../Domain/enums/PlantStatus";
import { SortBy, SortDir } from "../../Domain/DTOs/GetPlantsQueryDTO";

const isPlantStatus = (value: string): value is PlantStatus =>
  Object.values(PlantStatus).includes(value as PlantStatus);

const isSortBy = (value: string): value is SortBy =>
  value === "createdAt" || value === "oilStrength" || value === "name";

const isSortDir = (value: string): value is SortDir =>
  value === "ASC" || value === "DESC";


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
    this.router.get("/plants/available-count", this.getAvailableCount.bind(this));
    this.router.post("/plants", this.plant.bind(this));
    this.router.patch("/plants/:id/oil-strength", this.updateOilStrength.bind(this));
    this.router.post("/plants/harvest", this.harvest.bind(this));
    this.router.get("/plants", this.getAll.bind(this));
    this.router.get("/plants/:id", this.getById.bind(this));
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

  private async getAvailableCount(req: Request, res: Response): Promise<void> {
    try {
      const name = String(req.query.name ?? "").trim();
      if (!name) {
        res.status(400).json({ message: "Query param 'name' is required" });
        return;
      }

      const available = await this.productionService.getAvailableCount(name);
      res.status(200).json({ name, available });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
      const status = typeof req.query.status === "string" && isPlantStatus(req.query.status) ? req.query.status : undefined;
      const sortBy = typeof req.query.sortBy === "string" && isSortBy(req.query.sortBy) ? req.query.sortBy : undefined;
      const sortDir = typeof req.query.sortDir === "string" && isSortDir(req.query.sortDir) ? req.query.sortDir : undefined;

      const plants = await this.productionService.getPlants({ search, status, sortBy, sortDir, });
      res.status(200).json(plants);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.logger.log(message);
      res.status(400).json({ message });
    }
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    try {
      const plant = await this.productionService.getPlantById(id);
      res.status(200).json(plant);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plant not found";
      res.status(404).json({ message });
    }
  }



  public getRouter(): Router {
    return this.router;
  }
}
