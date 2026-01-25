export type BottleVolume = 150 | 250;
export type PerfumeType = "parfum" | "cologne";

export type GetPerfumesDTO = {
  perfumeType: PerfumeType;
  count: number;
};

export type StartProcessingDTO = {
  perfumeName: string;
  perfumeType: PerfumeType;
  bottleCount: number;
  bottleVolume: BottleVolume;
};
