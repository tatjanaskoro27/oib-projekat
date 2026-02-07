import axios, { AxiosInstance } from "axios";
import type { ISalesAPI } from "./ISalesAPI";
import type { SalesPerfumeDTO } from "../../models/sales/SalesPerfumeDTO";
import type { PurchaseRequestDTO, PurchaseResponseDTO } from "../../models/sales/PurchaseDTO";

type ProcessingPerfumeDTO = {
  id: number;
  name: string;
  type: string;        // "parfum"
  netoMl: number;      // 150
  serialNumber: string;
  plantId: number;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
};

export class SalesAPI implements ISalesAPI {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  private authHeaders(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * ✅ Katalog parfema se povlači iz Processing (realni podaci iz baze),
   * preko Gateway-a: POST /processing/get
   */
  async getPerfumes(token: string): Promise<SalesPerfumeDTO[]> {
  const res = await this.axiosInstance.get<SalesPerfumeDTO[]>("/sales/perfumes", {
    headers: this.authHeaders(token),
    params: { t: Date.now() },
  });
  return res.data;
}


  async purchase(token: string, dto: PurchaseRequestDTO): Promise<PurchaseResponseDTO> {
    const res = await this.axiosInstance.post<PurchaseResponseDTO>("/sales/purchase", dto, {
      headers: {
        ...this.authHeaders(token),
        "x-uloga": "PRODAVAC", // ili MENADZER_PRODAJE ako treba
      },
    });
    return res.data;
  }
}
