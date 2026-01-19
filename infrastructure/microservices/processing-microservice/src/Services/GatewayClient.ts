import axios, { AxiosInstance } from "axios";
import { AvailableCountResponseDTO } from "../Domain/DTOs/AvailableCountResponseDTO";
import { HarvestResponseDTO } from "../Domain/DTOs/HarvestResponseDTO";
import { PlantOneRequestDTO } from "../Domain/DTOs/PlantOneRequestDTO";

export class GatewayClient {
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = process.env.GATEWAY_INTERNAL_API;
    if (!baseURL) throw new Error("GATEWAY_INTERNAL_API nije podešen u .env");

    this.client = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });
  }

  async getAvailableCount(name: string): Promise<number> {
    const res = await this.client.get<AvailableCountResponseDTO>(
      "/internal/plants/available-count",
      { params: { name } }
    );
    return res.data.available;
  }

  async plantOne(body: PlantOneRequestDTO): Promise<void> {
    // zadržavamo tvoju rutu koja već radi
    await this.client.post("/internal/plants", body);
  }

  async harvest(name: string, count: number): Promise<number[]> {
    const res = await this.client.post<HarvestResponseDTO>(
      "/internal/plants/harvest",
      { name, count }
    );
    return res.data.harvestedIds;
  }
}
