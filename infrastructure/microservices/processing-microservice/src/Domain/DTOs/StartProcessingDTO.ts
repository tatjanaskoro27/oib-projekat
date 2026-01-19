import { PerfumeType } from "../enums/PerfumeType";

export interface StartProcessingDTO {
  perfumeName: string;
  perfumeType: PerfumeType;
  bottleCount: number;
  bottleVolume: 150 | 250;
}
