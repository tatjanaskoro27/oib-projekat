export interface RacunDTO {
  id: number;
  ukupanIznos: number;
  datum: string; // može doći i kao ISO string
  tipProdaje: "MALOPRODAJA" | "VELEPRODAJA";
  nacinPlacanja: "GOTOVINA" | "KARTICA" | "UPLATA_NA_RACUN";
}