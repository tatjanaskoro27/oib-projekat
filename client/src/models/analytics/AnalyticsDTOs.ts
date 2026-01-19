// RACUNI
export type FiskalnaStavkaDTO = {
  id?: number;
  racunId?: number;
  parfemNaziv: string;
  kolicina: number;
  cenaPoKomadu: number;
};

export type FiskalniRacunDTO = {
  id: number;
  datum: string;          // ISO string
  ukupanIznos: number;
  tipProdaje?: string | null;
  nacinPlacanja?: string | null;
};

// REQUEST za kreiranje računa
export type KreirajRacunDTO = {
  datum?: string; // "YYYY-MM-DD"
  tipProdaje?: string;
  nacinPlacanja?: string;
  stavke: FiskalnaStavkaDTO[];
};

export type KreirajRacunResponse = {
  racunId: number;
  ukupanIznos: number;
};

// PRIHOD
export type UkupnaProdajaResponse = { ukupnaProdaja: number };
export type PeriodProdajaResponse = { start: string; end: string; ukupno: number };
export type GodisnjaProdajaResponse = { godina: number; ukupno: number };
export type MesecnaProdajaItem = { mesec: number; ukupno: number };
export type TrendProdajeItem = { datum: string; ukupno: number };

// KOLICINA
export type UkupnoKomadaResponse = { ukupnoKomada: number };
export type PeriodKomadaResponse = { start: string; end: string; ukupnoKomada: number };
export type MesecnaKomadaItem = { mesec: number; ukupnoKomada: number };
export type GodisnjaKomadaResponse = { godina: number; ukupnoKomada: number };

// TOP10
export type Top10KolicinaItem = { parfemNaziv: string; kolicina: number };
export type Top10PrihodItem = { parfemNaziv: string; prihod: number };
export type Top10PrihodUkupnoResponse = { ukupno: number };
