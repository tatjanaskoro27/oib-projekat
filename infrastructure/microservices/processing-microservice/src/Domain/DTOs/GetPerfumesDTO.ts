import { PerfumeType } from "../enums/PerfumeType";

export interface GetPerfumesDTO {
  perfumeType: PerfumeType;
  count: number;
}
