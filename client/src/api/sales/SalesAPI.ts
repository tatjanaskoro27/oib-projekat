import axios, { AxiosInstance } from "axios";
import type { ISalesAPI } from "./ISalesAPI";
import type { SalesPerfumeDTO } from "../../models/sales/SalesPerfumeDTO";
import type {
  PurchaseRequestDTO,
  PurchaseResponseDTO,
} from "../../models/sales/PurchaseDTO";

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

  async getPerfumes(token: string): Promise<SalesPerfumeDTO[]> {
    const res = await this.axiosInstance.get<SalesPerfumeDTO[]>("/sales/perfumes", {
      headers: this.authHeaders(token),
      params: { t: Date.now() }, // anti-cache (kao processing)
    });
    return res.data;
  }

  async purchase(token: string, dto: PurchaseRequestDTO): Promise<PurchaseResponseDTO> {
    const res = await this.axiosInstance.post<PurchaseResponseDTO>("/sales/purchase", dto, {
      headers: this.authHeaders(token),
    });
    return res.data;
  }
}
