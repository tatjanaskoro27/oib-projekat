export type PackItemDTO = {
  perfumeName: string;
  perfumeType: "parfum" | "cologne";
  bottleVolume: 150 | 250;
  quantity: number;
};

export interface PackAndSendRequestDTO {
  skladisteId: number;
  adresaPosiljaoca: string;
  items: PackItemDTO[];
}
