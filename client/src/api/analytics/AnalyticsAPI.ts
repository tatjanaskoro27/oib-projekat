import axios, { AxiosInstance } from "axios";
import { IAnalyticsAPI } from "./IAnalyticsAPI";
import {
  FiskalniRacunDTO,
  KreirajRacunDTO,
  KreirajRacunResponse,
  UkupnaProdajaResponse,
  PeriodProdajaResponse,
  MesecnaProdajaItem,
  GodisnjaProdajaResponse,
  TrendProdajeItem,
  UkupnoKomadaResponse,
  PeriodKomadaResponse,
  MesecnaKomadaItem,
  GodisnjaKomadaResponse,
  Top10KolicinaItem,
  Top10PrihodItem,
  Top10PrihodUkupnoResponse,
} from "../../models/analytics/AnalyticsDTOs";

export class AnalyticsAPI implements IAnalyticsAPI {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_GATEWAY_URL; // npr. http://localhost:4000/api/v1
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

  // RACUNI
  async getRacuni(token: string): Promise<FiskalniRacunDTO[]> {
    const res = await this.axiosInstance.get<FiskalniRacunDTO[]>("/analytics/racuni", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  async createRacun(token: string, dto: KreirajRacunDTO): Promise<KreirajRacunResponse> {
    const res = await this.axiosInstance.post<KreirajRacunResponse>("/analytics/racuni", dto, {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  // PRIHOD
  async prihodUkupno(token: string): Promise<UkupnaProdajaResponse> {
    const res = await this.axiosInstance.get<UkupnaProdajaResponse>("/analytics/prodaja/ukupno", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  async prihodNedeljna(token: string, start: string, end: string): Promise<PeriodProdajaResponse> {
    const res = await this.axiosInstance.get<PeriodProdajaResponse>("/analytics/prodaja/nedeljna", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { start, end, t: Date.now() },
    });
    return res.data;
  }

  async prihodMesecna(token: string, godina: number): Promise<MesecnaProdajaItem[]> {
    const res = await this.axiosInstance.get<MesecnaProdajaItem[]>(`/analytics/prodaja/mesecna/${godina}`, {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  async prihodGodisnja(token: string, godina: number): Promise<GodisnjaProdajaResponse> {
    const res = await this.axiosInstance.get<GodisnjaProdajaResponse>(`/analytics/prodaja/godisnja/${godina}`, {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  async prihodTrend(token: string, start: string, end: string): Promise<TrendProdajeItem[]> {
    const res = await this.axiosInstance.get<TrendProdajeItem[]>("/analytics/prodaja/trend", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { start, end, t: Date.now() },
    });
    return res.data;
  }

  // KOLICINA
  async kolicinaUkupno(token: string): Promise<UkupnoKomadaResponse> {
    const res = await this.axiosInstance.get<UkupnoKomadaResponse>("/analytics/prodaja/kolicina/ukupno", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  async kolicinaNedeljna(token: string, start: string, end: string): Promise<PeriodKomadaResponse> {
    const res = await this.axiosInstance.get<PeriodKomadaResponse>("/analytics/prodaja/kolicina/nedeljna", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { start, end, t: Date.now() },
    });
    return res.data;
  }

  async kolicinaMesecna(token: string, godina: number): Promise<MesecnaKomadaItem[]> {
    const res = await this.axiosInstance.get<MesecnaKomadaItem[]>(`/analytics/prodaja/kolicina/mesecna/${godina}`, {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  async kolicinaGodisnja(token: string, godina: number): Promise<GodisnjaKomadaResponse> {
    const res = await this.axiosInstance.get<GodisnjaKomadaResponse>(`/analytics/prodaja/kolicina/godisnja/${godina}`, {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  // TOP10
  async top10Kolicina(token: string): Promise<Top10KolicinaItem[]> {
    const res = await this.axiosInstance.get<Top10KolicinaItem[]>("/analytics/prodaja/top10", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  async top10Prihod(token: string): Promise<Top10PrihodItem[]> {
    const res = await this.axiosInstance.get<Top10PrihodItem[]>("/analytics/prodaja/top10-prihod", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }

  async top10PrihodUkupno(token: string): Promise<Top10PrihodUkupnoResponse> {
    const res = await this.axiosInstance.get<Top10PrihodUkupnoResponse>("/analytics/prodaja/top10-prihod/ukupno", {
      headers: { ...this.auth(token), ...this.noCache() },
      params: { t: Date.now() },
    });
    return res.data;
  }
}
