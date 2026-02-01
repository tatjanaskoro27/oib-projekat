export type PlantStatus = "planted" | "harvested" | "processed";

export interface PlantResponse {
  id: number;
  name: string;
  latinName: string | null;
  originCountry: string | null;
  oilStrength: string;
  status: PlantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HarvestedPlantDTO {
  id: number;
  oilStrength: number;
  name: string;
  latinName: string;
  originCountry: string;

}

export interface HarvestResponse {
  harvestedPlants: HarvestedPlantDTO[];
}


export interface AvailableCountResponse {
  name: string;
  available: number;
}

export interface ProcessPlantsResponse {
  processedIds: number[];
  processedCount: number;
}

export interface PlantTypeSummaryResponse {
  name: string;
  latinName: string;
  originCountry: string;
  totalPlanted: number;
  totalHarvested: number;
  totalProcessed: number;
  total: number;
}
