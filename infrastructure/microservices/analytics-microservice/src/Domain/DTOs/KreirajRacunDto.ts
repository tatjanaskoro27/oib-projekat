export interface KreirajRacunDto {
  datum?: string; // ISO string, opciono
  stavke: Array<{
    parfemNaziv: string;
    kolicina: number;
    cenaPoKomadu: number;
  }>;
}
