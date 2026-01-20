export type PlantStatus = "planted" | "harvested";

export interface PlantResponse {
  id: number;
  name: string;
  latinName: string | null;
  originCountry: string | null;
  oilStrength: string; // DECIMAL iz MySQL dolazi kao string
  status: PlantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HarvestedPlantDTO {
  id: number;
  oilStrength: number;
}

export interface HarvestResponse {
  harvestedPlants: HarvestedPlantDTO[];
}


export interface AvailableCountResponse {
  name: string;
  available: number;
}

