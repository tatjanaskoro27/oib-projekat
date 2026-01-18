import axios, { AxiosInstance } from "axios";
import { IAnalyticsAPI } from "./IAnalyticsAPI";
import { KreirajRacunDTO } from "../../models/analytics/KreirajRacunDTO";
import { FiskalniRacunDTO } from "../../models/analytics/FiskalniRacunDTO";

export class AnalyticsAPI implements IAnalyticsAPI {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  private auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  // RACUNI
  async getAllRacuni(token: string): Promise<FiskalniRacunDTO[]> {
    return (
      await this.axiosInstance.get<FiskalniRacunDTO[]>("/analytics/racuni", {
        headers: this.auth(token),
      })
    ).data;
  }

  async createRacun(token: string, dto: KreirajRacunDTO): Promise<FiskalniRacunDTO> {
    return (
      await this.axiosInstance.post<FiskalniRacunDTO>("/analytics/racuni", dto, {
        headers: this.auth(token),
      })
    ).data;
  }

 async prihodUkupno(token: string): Promise<number> {
  const res = await this.axiosInstance.get<{ ukupnaProdaja: number }>(
    "/analytics/prodaja/ukupno",
    {
      headers: {
        ...this.auth(token),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      params: { t: Date.now() },
    }
  );

  const val = res.data?.ukupnaProdaja;

  if (typeof val !== "number") {
    throw new Error("Backend nije vratio 'ukupnaProdaja' kao broj.");
  }

  return val;
}


  async prihodGodisnji(token: string, godina: number): Promise<any> {
    return (
      await this.axiosInstance.get(`/analytics/prodaja/godisnja/${godina}`, {
        headers: this.auth(token),
      })
    ).data;
  }

  async prihodMesecni(token: string, godina: number): Promise<any> {
    return (
      await this.axiosInstance.get(`/analytics/prodaja/mesecna/${godina}`, {
        headers: this.auth(token),
      })
    ).data;
  }

  // TOP 10
  async top10Prihod(token: string): Promise<any> {
    return (
      await this.axiosInstance.get("/analytics/prodaja/top10-prihod", {
        headers: this.auth(token),
      })
    ).data;
  }

  async top10PrihodUkupno(token: string): Promise<number> {
    return (
      await this.axiosInstance.get<number>("/analytics/prodaja/top10-prihod/ukupno", {
        headers: this.auth(token),
      })
    ).data;
  }
}
