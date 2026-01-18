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

export interface IAnalyticsAPI {
  // RACUNI
  getRacuni(token: string): Promise<FiskalniRacunDTO[]>;
  createRacun(token: string, dto: KreirajRacunDTO): Promise<KreirajRacunResponse>;

  // PRIHOD
  prihodUkupno(token: string): Promise<UkupnaProdajaResponse>;
  prihodNedeljna(token: string, start: string, end: string): Promise<PeriodProdajaResponse>;
  prihodMesecna(token: string, godina: number): Promise<MesecnaProdajaItem[]>;
  prihodGodisnja(token: string, godina: number): Promise<GodisnjaProdajaResponse>;
  prihodTrend(token: string, start: string, end: string): Promise<TrendProdajeItem[]>;

  // KOLICINA
  kolicinaUkupno(token: string): Promise<UkupnoKomadaResponse>;
  kolicinaNedeljna(token: string, start: string, end: string): Promise<PeriodKomadaResponse>;
  kolicinaMesecna(token: string, godina: number): Promise<MesecnaKomadaItem[]>;
  kolicinaGodisnja(token: string, godina: number): Promise<GodisnjaKomadaResponse>;

  // TOP10
  top10Kolicina(token: string): Promise<Top10KolicinaItem[]>;
  top10Prihod(token: string): Promise<Top10PrihodItem[]>;
  top10PrihodUkupno(token: string): Promise<Top10PrihodUkupnoResponse>;
}
