export interface HarvestedPlantDTO {
  id: number;
  oilStrength: number;
}

export interface HarvestPlantsResponseDTO {
  harvestedPlants: HarvestedPlantDTO[];
}
