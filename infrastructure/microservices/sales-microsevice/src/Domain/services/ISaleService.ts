import { Perfume } from "../Entities/Perfume";
import { Sale } from "../Entities/Sale";
import { PurchaseRequestDTO } from "../DTOs/PurchaseRequestDTO";

export interface ISalesService {
  getAllPerfumes(): Promise<Perfume[]>;
  seedPerfumes(): Promise<{ message: string }>;

  // vraća lokalni zapis + rezultat iz analytics-a (fiskalni račun)
 purchase(dto: PurchaseRequestDTO, uloga: "MENADZER_PRODAJE" | "PRODAVAC"): Promise<any>;


}
