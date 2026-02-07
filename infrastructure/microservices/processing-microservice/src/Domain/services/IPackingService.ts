import { PackAndSendRequestDTO } from "../DTOs/PackAndSendRequestDTO";
import { PackAndSendResponseDTO } from "../DTOs/PackAndSendResponseDTO";

export interface IPackingService {
  packAndSend(dto: PackAndSendRequestDTO): Promise<PackAndSendResponseDTO>;
}
