import axios, { AxiosInstance, AxiosResponse } from "axios";
import { IProductionAPI } from "./IProductionAPI";
import { PlantDTO } from "../../models/production/PlantDTO";
import { GetPlantsQueryDTO } from "../../models/production/GetPlantsQueryDTO";
import { CreatePlantDTO } from "../../models/production/CreatePlantDTO";
import { UpdateOilStrengthDTO } from "../../models/production/UpdateOilStrengthDTO";

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

  async createPlant(token: string, dto: CreatePlantDTO): Promise<PlantDTO> {
    const response: AxiosResponse<PlantDTO> = await this.axiosInstance.post("/plants", dto, {
      headers: this.authHeaders(token),
    });
    return response.data;
  }

  async updateOilStrength(token: string, plantId: number, dto: UpdateOilStrengthDTO): Promise<PlantDTO> {
    const response: AxiosResponse<PlantDTO> = await this.axiosInstance.patch(`/plants/${plantId}/oil-strength`, dto, {
      headers: this.authHeaders(token),
    });
    return response.data;
  }
}
