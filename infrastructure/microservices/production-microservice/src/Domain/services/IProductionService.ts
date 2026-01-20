import { CreatePlantDTO } from "../DTOs/CreatePlantDTO";
import { HarvestPlantsDTO } from "../DTOs/HarvestPlantsDTO"
import { HarvestPlantsResponseDTO } from "../DTOs/HarvestPlantsResponseDTO";
import { Plant } from "../models/Plant";

export interface IProductionService {
  plant(dto: CreatePlantDTO): Promise<Plant>;
  updateOilStrength(plantId: number, percent: number): Promise<Plant>;
  harvest(dto: HarvestPlantsDTO): Promise<HarvestPlantsResponseDTO>;

  getAvailableCount(name: string): Promise<number>;
}
