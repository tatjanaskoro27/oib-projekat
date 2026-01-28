import axios, { AxiosInstance } from "axios";
import { IPerformanceAPI } from "./IPerformanceAPI";
import type {
  PerformanceReportDTO,
  SimulirajDTO,
} from "../../models/performanse/PerformanceDTOs";

export class PerformanceAPI implements IPerformanceAPI {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_GATEWAY_URL;
    this.axiosInstance = axios.create({ baseURL });
  }

  private auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  private noCache() {
    return { "Cache-Control": "no-cache", Pragma: "no-cache" };
  }

  async startSimulation(token: string, dto: SimulirajDTO): Promise<PerformanceReportDTO> {
    const res = await this.axiosInstance.post<PerformanceReportDTO>(
      "/performance/simulacije",
      dto,
      {
        headers: { ...this.auth(token), ...this.noCache() },
        params: { t: Date.now() },
      },
    );
    return res.data;
  }

  async getReports(
    token: string,
    filter?: { algoritam?: string; od?: string; do?: string },
  ): Promise<PerformanceReportDTO[]> {
    const res = await this.axiosInstance.get<PerformanceReportDTO[]>(
      "/performance/izvestaji",
      {
        headers: { ...this.auth(token), ...this.noCache() },
        params: { ...(filter ?? {}), t: Date.now() },
      },
    );
    return res.data;
  }

  async getReportById(token: string, id: number): Promise<PerformanceReportDTO> {
    const res = await this.axiosInstance.get<PerformanceReportDTO>(
      `/performance/izvestaji/${id}`,
      {
        headers: { ...this.auth(token), ...this.noCache() },
        params: { t: Date.now() },
      },
    );
    return res.data;
  }

  async downloadPdf(token: string, id: number): Promise<{ data: ArrayBuffer; filename: string }> {
    const res = await this.axiosInstance.get<ArrayBuffer>(
      `/performance/izvestaji/${id}/pdf`,
      {
        headers: { ...this.auth(token), ...this.noCache() },
        params: { t: Date.now() },
        responseType: "arraybuffer",
      },
    );

    const dispo = String(res.headers["content-disposition"] || "");
    let filename = `izvestaj_${id}.pdf`;

    // pokušaj da izvučeš filename iz Content-Disposition
    const match = dispo.match(/filename="([^"]+)"/i);
    if (match && match[1]) filename = match[1];

    return { data: res.data, filename };
  }
}
