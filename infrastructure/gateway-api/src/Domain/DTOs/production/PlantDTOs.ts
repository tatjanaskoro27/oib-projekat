export interface CreatePlantDTO {
  name: string;
  latinName?: string;
  originCountry?: string;
}

export interface UpdateOilStrengthDTO {
  percent: number;
}

export interface HarvestPlantsDTO {
  name: string;
  count: number;
}

export interface ProcessPlantsDTO {
  plantIds: number[];
}

