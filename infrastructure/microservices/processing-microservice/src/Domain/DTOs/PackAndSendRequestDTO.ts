import { PerfumeType } from "../enums/PerfumeType";

export type PackItemRequestDTO = {
  perfumeName: string;
  perfumeType: PerfumeType;
  bottleVolume: number; // 150 ili 250
  quantity: number; // broj bocica
};

/**
 * Request koji Processing prima kada treba da dopuni skladiste:
 * - po potrebi pravi parfeme
 * - spakuje u ambalazu
 * - posalje u skladiste
 */
export interface PackAndSendRequestDTO {
  skladisteId: number;
  nazivAmbalaze?: string;
  adresaPosiljaoca?: string;
  items: PackItemRequestDTO[];
}
