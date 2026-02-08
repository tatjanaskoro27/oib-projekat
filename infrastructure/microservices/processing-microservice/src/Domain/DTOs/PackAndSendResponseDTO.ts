export interface PackAndSendResponseDTO {
  success: boolean;
  packageRef: string;
  skladisteId: number;
  createdPerfumes: number;
  packedPerfumes: number;
  sentToWarehouse: boolean;
}
