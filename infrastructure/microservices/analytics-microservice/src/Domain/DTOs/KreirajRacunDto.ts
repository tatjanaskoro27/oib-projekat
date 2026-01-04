export interface KreirajRacunDto {
  datum?: string; 
  stavke: Array<{
    parfemNaziv: string;
    kolicina: number;
    cenaPoKomadu: number;
  }>;
}
