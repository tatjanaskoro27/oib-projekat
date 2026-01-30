import { PlantDTO } from "../../models/production/PlantDTO";
import { GetPlantsQueryDTO } from "../../models/production/GetPlantsQueryDTO";
import { CreatePlantDTO } from "../../models/production/CreatePlantDTO";
import { UpdateOilStrengthDTO } from "../../models/production/UpdateOilStrengthDTO";

export interface IProductionAPI {
  getPlants(token: string, query?: GetPlantsQueryDTO): Promise<PlantDTO[]>;
  getPlantById(token: string, id: number): Promise<PlantDTO>;
  createPlant(token: string, dto: CreatePlantDTO): Promise<PlantDTO>;
  updateOilStrength(token: string, plantId: number, dto: UpdateOilStrengthDTO): Promise<PlantDTO>;
}
