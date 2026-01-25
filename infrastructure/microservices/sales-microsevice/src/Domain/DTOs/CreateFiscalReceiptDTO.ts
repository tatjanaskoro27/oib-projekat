export type TipProdaje = "MALOPRODAJA" | "VELEPRODAJA";
export type NacinPlacanja = "GOTOVINA" | "UPLATA_NA_RACUN" | "KARTICA";

export type StavkaRacunaDTO = {
  parfemNaziv: string;
  kolicina: number;
  cenaPoKomadu: number;
};

export type CreateFiscalReceiptDTO = {
  datum?: string;
  tipProdaje?: TipProdaje;
  nacinPlacanja?: NacinPlacanja;
  stavke: StavkaRacunaDTO[];
};
