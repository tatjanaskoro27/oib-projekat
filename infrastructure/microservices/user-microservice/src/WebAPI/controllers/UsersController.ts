import { Router, Request, Response } from "express";
import { ILogerService } from "../../Domain/services/ILogerService";
import { IUsersService } from "../../Domain/services/IUsersService";
import { validateCreateUserData } from "../validators/CreateUserValidator";
import { validateUpdateUserData } from "../validators/UpdateUserValidator";


export class UsersController {
  private readonly router: Router;

  constructor(
    private readonly usersService: IUsersService,
    private readonly logger: ILogerService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/users", this.getAllUsers.bind(this));
    this.router.get("/users/:id", this.getUserById.bind(this));
    this.router.delete("/users/:id", this.deleteUser.bind(this));
    this.router.post("/users", this.createUser.bind(this));
    this.router.put("/users/:id", this.updateUser.bind(this));

  }

  private async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log("Fetching all users");
      const users = await this.usersService.getAllUsers();
      res.status(200).json(users);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      this.logger.log(`Fetching user with ID ${id}`);
      const user = await this.usersService.getUserById(id);
      res.status(200).json(user);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    this.logger.log(`Deleting user with ID ${id}`);
    const result = await this.usersService.deleteUser(id);
    res.status(200).json(result);
  } catch (err) {
    this.logger.log((err as Error).message);
    res.status(404).json({ message: (err as Error).message });
    }
  }

  private async createUser(req: Request, res: Response): Promise<void> {
  try {
    this.logger.log("Creating user");
    const validation = validateCreateUserData(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: validation.message });
      return;
    }
    const created = await this.usersService.createUser(req.body);
    res.status(201).json(created);
  } catch (err) {
    this.logger.log((err as Error).message);
    res.status(400).json({ message: (err as Error).message });
    }
  }

  private async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateUpdateUserData(req.body);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }
      const id = parseInt(req.params.id, 10);
      this.logger.log(`Updating user with ID ${id}`);
      const updated = await this.usersService.updateUser(id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}