export type FiskalnaStavkaDTO = {
  proizvodId: number;
  naziv: string;
  kolicina: number;
  cena: number;
};

export type KreirajRacunDTO = {
  brojRacuna: string;
  datumVreme: string; // ISO string (new Date().toISOString())
  stavke: FiskalnaStavkaDTO[];
};
