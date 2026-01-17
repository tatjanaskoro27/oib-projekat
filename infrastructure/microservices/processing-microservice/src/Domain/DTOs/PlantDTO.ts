import { PlantStatus } from "../enums/PlantStatus";

export interface PlantDTO {
  id: number;
  name: string;
  latinName: string;
  originCountry: string;
  oilStrength: number;
  status: PlantStatus;
  createdAt: Date;
  updatedAt: Date;
}
