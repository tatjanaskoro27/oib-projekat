import axios, { AxiosInstance, AxiosResponse } from "axios";
import { IProductionAPI } from "./IProductionAPI";
import { PlantDTO } from "../../models/production/PlantDTO";
import { GetPlantsQueryDTO } from "../../models/production/GetPlantsQueryDTO";

export class ProductionAPI implements IProductionAPI {
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

  async getPlants(token: string, query?: GetPlantsQueryDTO): Promise<PlantDTO[]> {
    const response: AxiosResponse<PlantDTO[]> = await this.axiosInstance.get("/plants", {
      headers: this.authHeaders(token),
      params: query,
    });
    return response.data;
  }

  async getPlantById(token: string, id: number): Promise<PlantDTO> {
    const response: AxiosResponse<PlantDTO> = await this.axiosInstance.get(`/plants/${id}`, {
      headers: this.authHeaders(token),
    });
    return response.data;
  }
}
