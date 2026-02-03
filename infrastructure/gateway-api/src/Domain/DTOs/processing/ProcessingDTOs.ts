export type PerfumeType = "parfum" | "cologne";

export interface StartProcessingDTO {
  plantName: string;
  perfumeName: string;
  perfumeType: PerfumeType;
  bottleCount: number;
  bottleVolume: 150 | 250;
}

export interface GetPerfumesDTO {
  perfumeType: PerfumeType;
  count: number;
}
