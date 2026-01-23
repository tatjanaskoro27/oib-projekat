import { PlantStatus } from "./PlantTypes";
export type SortBy = "createdAt" | "oilStrength" | "name";
export type SortDir = "ASC" | "DESC";

export interface GetPlantsParams {
  search?: string;
  status?: PlantStatus;
  sortBy?: SortBy;
  sortDir?: SortDir;
}
