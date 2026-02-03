import { PerfumeType } from "../enums/PerfumeType";

export interface StartProcessingDTO {
  plantName: string;
  perfumeName: string;
  perfumeType: PerfumeType;
  bottleCount: number;
  bottleVolume: 150 | 250;
}