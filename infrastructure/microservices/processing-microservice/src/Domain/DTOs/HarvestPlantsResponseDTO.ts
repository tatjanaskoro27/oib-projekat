export interface HarvestedPlantDTO {
  id: number;
  oilStrength: number;
  name: string;
  latinName: string;
  originCountry: string;
}

export interface HarvestPlantsResponseDTO {
  harvestedPlants: HarvestedPlantDTO[];
}