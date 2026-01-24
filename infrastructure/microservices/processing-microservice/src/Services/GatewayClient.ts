import axios, { AxiosInstance } from "axios";
import { AvailableCountResponseDTO } from "../Domain/DTOs/AvailableCountResponseDTO";
import { HarvestPlantsResponseDTO } from "../Domain/DTOs/HarvestPlantsResponseDTO";
import { CreateDogadjajDTO } from "../Domain/DTOs/EventDTO";

export class GatewayClient {
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = process.env.GATEWAY_INTERNAL_API;
    if (!baseURL) throw new Error("GATEWAY_INTERNAL_API nije podešen u .env");
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) throw new Error("INTERNAL_API_KEY nije podešen u .env");

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey
      },
      timeout: 5000,
    });
  }

  async getAvailableCount(name: string): Promise<number> {
    const res = await this.client.get<AvailableCountResponseDTO>("/internal/plants/available-count", { params: { name } });
    return res.data.available;
  }

  async plantOne(body: { name: string; latinName: string; originCountry: string }): Promise<{ id: number; oilStrength: number }> {
    const res = await this.client.post("/internal/plants", body);
    return { id: res.data.id, oilStrength: Number(res.data.oilStrength) };
  }

  async harvest(name: string, count: number): Promise<HarvestPlantsResponseDTO> {
    const res = await this.client.post<HarvestPlantsResponseDTO>("/internal/plants/harvest", { name, count });
    return res.data;
  }

  async updateOilStrength(plantId: number, percent: number): Promise<void> {
    await this.client.patch(`/internal/plants/${plantId}/oil-strength`, { percent });
  }

  async markPlantsProcessed(plantIds: number[]): Promise<{ processedCount: number; processedIds: number[] }> {
    const res = await this.client.post<{ processedIds: number[]; processedCount: number }>("/internal/plants/process", { plantIds });
    return res.data;
  }

  async logEvent(dto: CreateDogadjajDTO): Promise<void> {
    await this.client.post("/internal/dogadjaji", dto);
  }
}
