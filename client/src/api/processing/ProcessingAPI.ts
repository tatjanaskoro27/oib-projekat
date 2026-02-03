import axios, { AxiosInstance } from "axios";
import { IProcessingAPI } from "./IProcessingAPI";
import type { StartProcessingDTO } from "../../models/processing/StartProcessingDTO";
import type { ProcessingResultDTO } from "../../models/processing/ProcessingResultDTO";
import type { PerfumeDTO } from "../../models/processing/PerfumeDTO";

export class ProcessingAPI implements IProcessingAPI {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_GATEWAY_URL;
    this.axiosInstance = axios.create({ baseURL });
  }

  private auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  private noCache() {
    return {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    };
  }

  async startProcessing(
    token: string,
    data: StartProcessingDTO,
  ): Promise<ProcessingResultDTO> {
    const res = await this.axiosInstance.post<ProcessingResultDTO>(
      "/processing/start",
      data,
      {
        headers: { ...this.auth(token), ...this.noCache() },
        params: { t: Date.now() },
      },
    );
    return res.data;
  }

  async getPerfumes(token: string): Promise<PerfumeDTO[]> {
  const [parfumsRes, colognesRes] = await Promise.all([
    this.axiosInstance.post<PerfumeDTO[]>(
      "/processing/get",
      { perfumeType: "parfum", count: 10000 },
      { headers: { ...this.auth(token) } }
    ),
    this.axiosInstance.post<PerfumeDTO[]>(
      "/processing/get",
      { perfumeType: "cologne", count: 10000 },
      { headers: { ...this.auth(token) } }
    ),
  ]);

  return [...parfumsRes.data, ...colognesRes.data].sort(
    (a, b) => (b.id ?? 0) - (a.id ?? 0)
  );
}

}
