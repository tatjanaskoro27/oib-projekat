import { Router, Request, Response } from "express";
import { DogadjajiService } from "../../Services/DogadjajService";
import { TipDogadjaja } from "../../Domain/models/Dogadjaj";

export class DogadjajiController {
  private router = Router();

  constructor(private service: DogadjajiService) {
    this.router.post("/dogadjaji", this.create);
    this.router.put("/dogadjaji/:id", this.update);
    this.router.delete("/dogadjaji/:id", this.delete);
    this.router.get("/dogadjaji", this.getAll);
    this.router.get("/dogadjaji/tip/:tip", this.getByTip);
  }

  private create = async (req: Request, res: Response) => {
    try {
      const { tip, opis } = req.body;
      const dogadjaj = await this.service.create(tip, opis);
      res.status(201).json(dogadjaj);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  private update = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { tip, opis } = req.body;
      const dogadjaj = await this.service.update(id, tip, opis);
      res.json(dogadjaj);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  private delete = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.service.delete(id);
      res.status(204).send();
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  private getAll = async (_: Request, res: Response) => {
    const data = await this.service.getAll();
    res.json(data);
  };

  private getByTip = async (req: Request, res: Response) => {
    const tip = req.params.tip as TipDogadjaja;
    const data = await this.service.getByTip(tip);
    res.json(data);
  };

  getRouter() {
    return this.router;
  }
}
