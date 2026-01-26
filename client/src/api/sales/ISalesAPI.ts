import type { SalesPerfumeDTO } from "../../models/sales/SalesPerfumeDTO";
import type { PurchaseRequestDTO, PurchaseResponseDTO } from "../../models/sales/PurchaseDTO";

export interface ISalesAPI {
  getPerfumes(token: string): Promise<SalesPerfumeDTO[]>;
  purchase(token: string, dto: PurchaseRequestDTO): Promise<PurchaseResponseDTO>;
}
