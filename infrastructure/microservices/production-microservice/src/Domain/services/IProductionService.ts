import { CreatePlantDTO } from "../DTOs/CreatePlantDTO";
import { GetPlantsQueryDTO } from "../DTOs/GetPlantsQueryDTO";
import { HarvestPlantsDTO } from "../DTOs/HarvestPlantsDTO"
import { HarvestPlantsResponseDTO } from "../DTOs/HarvestPlantsResponseDTO";
import { PlantTypeSummaryDTO } from "../DTOs/PlantTypeSummaryDTO";
import { ProcessPlantsDTO, ProcessPlantsResponseDTO } from "../DTOs/ProcessPlantsDTO";
import { Plant } from "../models/Plant";

export interface IProductionService {
  plant(dto: CreatePlantDTO): Promise<Plant>;
  updateOilStrength(plantId: number, percent: number): Promise<Plant>;
  harvest(dto: HarvestPlantsDTO): Promise<HarvestPlantsResponseDTO>;
  getAvailableCount(name: string): Promise<number>;
  processPlants(dto: ProcessPlantsDTO): Promise<ProcessPlantsResponseDTO>;
  getPlants(query: GetPlantsQueryDTO): Promise<Plant[]>;
  getPlantById(id: number): Promise<Plant>;
  getPlantTypesSummary(): Promise<PlantTypeSummaryDTO[]>;
  getPlantTypeByName(name: string): Promise<PlantTypeSummaryDTO | null>;
}
