import { Router, Request, Response } from "express";
import { IPlantsService } from "../../Domain/services/IPlantsService";
import { validateCreatePlant } from "../validators/CreatePlantValidator";
import { validateUpdatePlant } from "../validators/UpdatePlantValidator";
import { CreatePlantDTO } from "../../Domain/DTOs/CreatePlantDTO";
import { UpdatePlantDTO } from "../../Domain/DTOs/UpdatePlantDTO";

export class PlantsController {
  private readonly router: Router;

  constructor(private readonly plantsService: IPlantsService) {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.get("/plants", this.getAll.bind(this));
    this.router.get("/plants/:id", this.getById.bind(this));
    this.router.post("/plants", this.create.bind(this));
    this.router.put("/plants/:id", this.update.bind(this));
    this.router.delete("/plants/:id", this.delete.bind(this));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    try {
      const plants = await this.plantsService.getAll();
      res.status(200).json(plants);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(id) || id <= 0) {
        res.status(400).json({ message: "Invalid ID parameter" });
        return;
      }
      const plant = await this.plantsService.getById(id);
      res.status(200).json(plant);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateCreatePlant(req.body as CreatePlantDTO);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }
      const created = await this.plantsService.create(
        req.body as CreatePlantDTO
      );
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async update(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateUpdatePlant(req.body as UpdatePlantDTO);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(id) || id <= 0) {
        res.status(400).json({ message: "Invalid ID parameter" });
        return;
      }
      const updated = await this.plantsService.update(
        id,
        req.body as UpdatePlantDTO
      );
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(id) || id <= 0) {
        res.status(400).json({ message: "Invalid ID parameter" });
        return;
      }
      const result = await this.plantsService.delete(id);
      res.status(200).json(result);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
