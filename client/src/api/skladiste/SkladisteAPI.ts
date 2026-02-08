import axios from "axios";
import type {
  WarehouseDTO,
  SendPackagesResponseDTO,
} from "../../models/skladiste/SkladisteDTO";

export class SkladisteAPI {
  private client = axios.create({
    baseURL: import.meta.env.VITE_GATEWAY_URL,
    headers: { "Content-Type": "application/json" },
  });

  private authHeaders(token: string) {
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getWarehouses(token: string): Promise<WarehouseDTO[]> {
    const res = await this.client.get("/skladiste/skladista", {
      headers: this.authHeaders(token),
    });

    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }

  async sendPackages(token: string, brojAmbalaza: number): Promise<SendPackagesResponseDTO> {
    const res = await this.client.post(
      "/skladiste/send",
      { brojAmbalaza },
      { headers: this.authHeaders(token) }
    );

    return res.data ?? {};
  }
}
