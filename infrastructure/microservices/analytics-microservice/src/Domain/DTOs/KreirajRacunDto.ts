import { TipProdaje, NacinPlacanja } from "../enums/ProdajaEnums";

export interface KreirajRacunDto {
  datum?: string; 

  tipProdaje?: TipProdaje; 
  nacinPlacanja?: NacinPlacanja;

  stavke: Array<{
    parfemNaziv: string;
    kolicina: number;
    cenaPoKomadu: number;
  }>;
}
