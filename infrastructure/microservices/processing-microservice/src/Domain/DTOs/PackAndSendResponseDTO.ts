export interface PackAndSendResponseDTO {
  success: boolean;
  packageRef: string;
  skladisteId: number;
  createdPerfumes: number; // koliko je napravljeno (dopuna)
  packedPerfumes: number; // koliko je spakovano
  sentToWarehouse: boolean;
}
