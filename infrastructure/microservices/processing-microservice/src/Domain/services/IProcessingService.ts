// src/Domain/services/IProcessingService.ts
import { StartProcessingDTO } from "../DTOs/StartProcessingDTO";
import { GetPerfumesDTO } from "../DTOs/GetPerfumesDTO";
import { Perfume } from "../models/Perfume";
import { CatalogItemDTO } from "../DTOs/CatalogItemDTO";

export interface IProcessingService {
  startProcessing(dto: StartProcessingDTO): Promise<Perfume[]>;
  getPerfumes(dto: GetPerfumesDTO): Promise<Perfume[]>;

  // ✅ NOVO: katalog parfema (meta podaci) iz Processing DB
  getCatalog(): Promise<CatalogItemDTO[]>;
}
