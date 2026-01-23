import { PlantDTO } from "../../models/production/PlantDTO";
import { GetPlantsQueryDTO } from "../../models/production/GetPlantsQueryDTO";

export interface IProductionAPI {
  getPlants(token: string, query?: GetPlantsQueryDTO): Promise<PlantDTO[]>;
  getPlantById(token: string, id: number): Promise<PlantDTO>;
}
