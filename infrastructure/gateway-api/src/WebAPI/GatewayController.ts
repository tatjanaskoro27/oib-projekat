import { Request, Response, Router } from "express";
import { IGatewayService } from "../Domain/services/IGatewayService";
import { LoginUserDTO } from "../Domain/DTOs/user/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/user/RegistrationUserDTO";
import { authenticate } from "../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../Middlewares/authorization/AuthorizeMiddleware";
import { internalAuth } from "../Middlewares/internal/InternalAuth";


export class GatewayController {
  private readonly router: Router;

  constructor(private readonly gatewayService: IGatewayService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Auth
    this.router.post("/login", this.login.bind(this));
    this.router.post("/register", this.register.bind(this));

    // Users
    this.router.get("/users", authenticate, authorize("admin"), this.getAllUsers.bind(this));
    this.router.get("/users/:id", authenticate, authorize("admin", "seller"), this.getUserById.bind(this));
    this.router.delete("/users/:id", authenticate, authorize("admin"), this.deleteUser.bind(this));
    this.router.post("/users", authenticate, authorize("admin"), this.createUser.bind(this));
    this.router.put("/users/:id", authenticate, authorize("admin"), this.updateUser.bind(this));

    //analytics
    // racuni
    this.router.get("/analytics/racuni", authenticate, authorize("admin", "seller"), this.getRacuni.bind(this));
    this.router.post("/analytics/racuni", authenticate, authorize("admin", "seller"), this.createRacun.bind(this));
    // prodaja - novac
    this.router.get("/analytics/prodaja/ukupno", authenticate, authorize("admin", "seller"), this.getUkupnaProdaja.bind(this));
    this.router.get("/analytics/prodaja/nedeljna", authenticate, authorize("admin", "seller"), this.getProdajaNedeljna.bind(this));
    this.router.get("/analytics/prodaja/trend", authenticate, authorize("admin", "seller"), this.getTrendProdaje.bind(this));
    // prodaja - kolicina
    this.router.get("/analytics/prodaja/kolicina/ukupno", authenticate, authorize("admin", "seller"), this.getUkupnoKomada.bind(this));
    // top 10 prihod
    this.router.get("/analytics/prodaja/top10-prihod", authenticate, authorize("admin", "seller"), this.getTop10Prihod.bind(this));
    this.router.get("/analytics/prodaja/top10-prihod/ukupno", authenticate, authorize("admin", "seller"), this.getTop10PrihodUkupno.bind(this));

    this.router.get(
      "/analytics/prodaja/mesecna/:godina",
      authenticate,
      authorize("admin", "seller"),
      this.getProdajaMesecna.bind(this)
    );

    this.router.get(
      "/analytics/prodaja/godisnja/:godina",
      authenticate,
      authorize("admin", "seller"),
      this.getProdajaGodisnja.bind(this)
    );
    this.router.get(
      "/analytics/prodaja/top10",
      authenticate,
      authorize("admin", "seller"),
      this.getTop10Kolicina.bind(this)
    );


    //Production
    this.router.post("/plants", authenticate, authorize("admin", "seller"), this.plant.bind(this));
    this.router.patch("/plants/:id/oil-strength", authenticate, authorize("admin", "seller"), this.updateOilStrength.bind(this));
    this.router.post("/plants/harvest", authenticate, authorize("admin", "seller"), this.harvest.bind(this));


    //Processing
    this.router.post("/processing/start", authenticate, authorize("admin", "seller"), this.startProcessing.bind(this));
    this.router.post("/processing/get", authenticate, authorize("admin", "seller"), this.getPerfumes.bind(this));

    // INTERNAL (server-to-server) proxy za Processing -> Production preko Gateway-a
    this.router.get("/internal/plants/available-count", internalAuth, this.internalAvailableCount.bind(this));
    this.router.post("/internal/plants", internalAuth, this.internalPlant.bind(this));
    this.router.post("/internal/plants/harvest", internalAuth, this.internalHarvest.bind(this));
    this.router.patch("/internal/plants/:id/oil-strength", internalAuth, this.internalUpdateOilStrength.bind(this));

    // Dogadjaji
    this.router.get("/dogadjaji", authenticate, authorize("admin", "seller"), this.getDogadjaji.bind(this));
    this.router.get("/dogadjaji/tip/:tip", authenticate, authorize("admin", "seller"), this.getDogadjajiByTip.bind(this));
    this.router.post("/dogadjaji", authenticate, authorize("admin", "seller"), this.createDogadjaj.bind(this));
    this.router.put("/dogadjaji/:id", authenticate, authorize("admin", "seller"), this.updateDogadjaj.bind(this));
    this.router.delete("/dogadjaji/:id", authenticate, authorize("admin", "seller"), this.deleteDogadjaj.bind(this));


    this.router.get(
      "/analytics/prodaja/kolicina/nedeljna",
      authenticate,
      authorize("admin", "seller"),
      this.getKolicinaNedeljna.bind(this)
    );

    this.router.get(
      "/analytics/prodaja/kolicina/mesecna/:godina",
      authenticate,
      authorize("admin", "seller"),
      this.getKolicinaMesecna.bind(this)
    );

    this.router.get(
      "/analytics/prodaja/kolicina/godisnja/:godina",
      authenticate,
      authorize("admin", "seller"),
      this.getKolicinaGodisnja.bind(this)
    );



  }

  // Auth
  private async login(req: Request, res: Response): Promise<void> {
    const data: LoginUserDTO = req.body;
    const result = await this.gatewayService.login(data);
    res.status(200).json(result);
  }

  private async register(req: Request, res: Response): Promise<void> {
    const data: RegistrationUserDTO = req.body;
    const result = await this.gatewayService.register(data);
    res.status(200).json(result);
  }

  // Users
  private async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.gatewayService.getAllUsers();
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (!req.user || req.user.id !== id) {
        res.status(401).json({ message: "You can only access your own data!" });
        return;
      }

      const user = await this.gatewayService.getUserById(id);
      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      const result = await this.gatewayService.deleteUser(id);

      res.status(200).json(result);
    } catch (err) {
      res.status(404).json({
        message: (err as Error).message,
      });
    }
  }

  private async createUser(req: Request, res: Response): Promise<void> {
    try {
      const created = await this.gatewayService.createUser(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.gatewayService.updateUser(id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  //analytics handlers
  private async getRacuni(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.getRacuni();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async createRacun(req: Request, res: Response): Promise<void> {
    try {
      const created = await this.gatewayService.createRacun(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getUkupnaProdaja(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.getUkupnaProdaja();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getProdajaNedeljna(req: Request, res: Response): Promise<void> {
    try {
      const start = String(req.query.start ?? "");
      const end = String(req.query.end ?? "");

      if (!start || !end) {
        res.status(400).json({ message: "Query parametri start i end su obavezni." });
        return;
      }

      const data = await this.gatewayService.getProdajaNedeljna(start, end);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getTrendProdaje(req: Request, res: Response): Promise<void> {
    try {
      const start = String(req.query.start ?? "");
      const end = String(req.query.end ?? "");

      if (!start || !end) {
        res.status(400).json({ message: "Query parametri start i end su obavezni." });
        return;
      }

      const data = await this.gatewayService.getTrendProdaje(start, end);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getUkupnoKomada(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.getUkupnoKomada();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getTop10Prihod(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.getTop10Prihod();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getTop10PrihodUkupno(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.getTop10PrihodUkupno();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getProdajaMesecna(req: Request, res: Response): Promise<void> {
    try {
      const godina = Number(req.params.godina);
      if (Number.isNaN(godina)) {
        res.status(400).json({ message: "Godina mora biti broj." });
        return;
      }
      const data = await this.gatewayService.getProdajaMesecna(godina);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getProdajaGodisnja(req: Request, res: Response): Promise<void> {
    try {
      const godina = Number(req.params.godina);
      if (Number.isNaN(godina)) {
        res.status(400).json({ message: "Godina mora biti broj." });
        return;
      }
      const data = await this.gatewayService.getProdajaGodisnja(godina);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }
  private async getTop10Kolicina(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.getTop10Kolicina();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }
  private async getKolicinaNedeljna(req: Request, res: Response): Promise<void> {
    try {
      const start = String(req.query.start ?? "");
      const end = String(req.query.end ?? "");

      if (!start || !end) {
        res.status(400).json({ message: "Query parametri start i end su obavezni." });
        return;
      }

      const data = await this.gatewayService.getKolicinaNedeljna(start, end);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getKolicinaMesecna(req: Request, res: Response): Promise<void> {
    try {
      const godina = Number(req.params.godina);
      if (Number.isNaN(godina)) {
        res.status(400).json({ message: "Godina mora biti broj." });
        return;
      }

      const data = await this.gatewayService.getKolicinaMesecna(godina);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getKolicinaGodisnja(req: Request, res: Response): Promise<void> {
    try {
      const godina = Number(req.params.godina);
      if (Number.isNaN(godina)) {
        res.status(400).json({ message: "Godina mora biti broj." });
        return;
      }

      const data = await this.gatewayService.getKolicinaGodisnja(godina);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }



  private async plant(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.plant(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async updateOilStrength(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await this.gatewayService.updatePlantOilStrength(id, req.body);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async harvest(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.harvestPlants(req.body);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async startProcessing(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.startProcessing(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getPerfumes(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.getPerfumes(req.body);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async internalAvailableCount(req: Request, res: Response): Promise<void> {
    try {
      const name = String(req.query.name ?? "").trim();
      if (!name) {
        res.status(400).json({ message: "Query param 'name' is required" });
        return;
      }
      const data = await this.gatewayService.getAvailablePlantCount(name);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async internalPlant(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.plant(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async internalHarvest(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.harvestPlants(req.body);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async internalUpdateOilStrength(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await this.gatewayService.updatePlantOilStrength(id, req.body);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getDogadjaji(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.getDogadjaji();
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getDogadjajiByTip(req: Request, res: Response): Promise<void> {
    try {
      const tip = String(req.params.tip).toUpperCase() as any;
      const data = await this.gatewayService.getDogadjajiByTip(tip);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async createDogadjaj(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.gatewayService.createDogadjaj(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async updateDogadjaj(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await this.gatewayService.updateDogadjaj(id, req.body);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async deleteDogadjaj(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await this.gatewayService.deleteDogadjaj(id);
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }


  public getRouter(): Router {
    return this.router;
  }
}
