export type PerfumeType = "parfum" | "cologne";

export interface StartProcessingDTO {
  perfumeName: string;
  perfumeType: PerfumeType;
  bottleCount: number;
  bottleVolume: 150 | 250;

  // ako processing radi s postojećim biljkama
  plantIds?: number[];

  // ako processing sam traži sadnju
  plantName?: string;
  latinName?: string;
  originCountry?: string;
}

export interface GetPerfumesDTO {
  perfumeType: PerfumeType;
  count: number;
}
