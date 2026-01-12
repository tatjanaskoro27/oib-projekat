import { CreatePlantDTO } from "../DTOs/CreatePlantDTO";
import { UpdatePlantDTO } from "../DTOs/UpdatePlantDTO";
import { PlantDTO } from "../DTOs/PlantDTO";

export interface IPlantsService {
  getAll(): Promise<PlantDTO[]>;
  getById(id: number): Promise<PlantDTO>;
  create(data: CreatePlantDTO): Promise<PlantDTO>;
  update(id: number, data: UpdatePlantDTO): Promise<PlantDTO>;
  delete(id: number): Promise<{ deleted: true }>;
}
