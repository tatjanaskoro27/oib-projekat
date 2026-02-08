export interface RacunDTO {
  id: number;
  ukupanIznos: number;
  datum: string; 
  tipProdaje: "MALOPRODAJA" | "VELEPRODAJA";
  nacinPlacanja: "GOTOVINA" | "KARTICA" | "UPLATA_NA_RACUN";
}