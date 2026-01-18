import { PerfumeType } from "../enums/PerfumeType";

export interface StartProcessingDTO {
  perfumeName: string;
  perfumeType: PerfumeType; // parfum | cologne
  bottleCount: number;      // broj bocica
  bottleVolume: 150 | 250;  // neto zapremina
  plantIds: number[];       // IDs biljaka koje se preradjuju (za sada ručno)
}
