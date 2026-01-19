import { FiskalnaStavkaDTO } from "./KreirajRacunDTO";

export type FiskalniRacunDTO = {
  id: number;
  brojRacuna: string;
  datumVreme: string;
  stavke: FiskalnaStavkaDTO[];
  ukupno?: number; // ako backend vraca
};
