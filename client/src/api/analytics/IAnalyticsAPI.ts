import { KreirajRacunDTO } from "../../models/analytics/KreirajRacunDTO";
import { FiskalniRacunDTO } from "../../models/analytics/FiskalniRacunDTO";

export interface IAnalyticsAPI {
  // Racuni
  getAllRacuni(token: string): Promise<FiskalniRacunDTO[]>;
  createRacun(token: string, dto: KreirajRacunDTO): Promise<FiskalniRacunDTO>;

  // Prihod (primeri)
  prihodUkupno(token: string): Promise<number>;
  prihodGodisnji(token: string, godina: number): Promise<any>;
  prihodMesecni(token: string, godina: number): Promise<any>;

  // Top 10
  top10Prihod(token: string): Promise<any>;
  top10PrihodUkupno(token: string): Promise<number>;
}
