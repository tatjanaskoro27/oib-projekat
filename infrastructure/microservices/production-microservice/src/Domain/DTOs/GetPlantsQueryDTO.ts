import { PlantStatus } from "../enums/PlantStatus";

export type SortBy = "createdAt" | "oilStrength" | "name";
export type SortDir = "ASC" | "DESC";

export interface GetPlantsQueryDTO {
  search?: string;
  status?: PlantStatus;
  sortBy?: SortBy;
  sortDir?: SortDir;
}
