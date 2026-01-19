import { PerfumeType } from "../../DTOs/processing/ProcessingDTOs";

export interface PerfumeResponse {
  id: number;
  name: string;
  type: PerfumeType;
  netoMl: number;
  serialNumber: string;
  plantId: number;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}
