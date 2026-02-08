import { PerfumeType } from "../enums/PerfumeType";

export type PackItemRequestDTO = {
  perfumeName: string;
  perfumeType: PerfumeType;
  bottleVolume: number; // 150 ili 250
  quantity: number;
};

export interface PackAndSendRequestDTO {
  skladisteId: number;
  nazivAmbalaze?: string;
  adresaPosiljaoca?: string;
  items: PackItemRequestDTO[];
}
