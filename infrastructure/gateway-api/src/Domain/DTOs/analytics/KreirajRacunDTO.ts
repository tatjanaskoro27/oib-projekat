export interface KreirajRacunDTO {
  datum?: string; // "YYYY-MM-DD"
  tipProdaje?: "MALOPRODAJA" | "VELEPRODAJA";
  nacinPlacanja?: "GOTOVINA" | "KARTICA" | "UPLATA_NA_RACUN";
  stavke: Array<{
    parfemNaziv: string;
    kolicina: number;
    cenaPoKomadu: number;
  }>;
}