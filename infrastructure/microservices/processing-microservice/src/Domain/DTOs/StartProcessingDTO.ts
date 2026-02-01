import { PerfumeType } from "../enums/PerfumeType";

export interface StartProcessingDTO {
  // vrsta biljke (opšti naziv)
  plantName: string;

  // ako se bira "Nova vrsta" na frontu
  latinName?: string;
  originCountry?: string;

  perfumeName: string;
  perfumeType: PerfumeType;
  bottleCount: number;
  bottleVolume: 150 | 250;
}
