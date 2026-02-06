import { Skladiste } from "../models/Skladiste";
import { Ambalaza } from "../models/Ambalaza";
import { KreirajSkladisteDTO } from "../DTOs/skladiste/KreirajSkladisteDTO";
import { PrijemAmbalazeDTO } from "../DTOs/skladiste/PrijemAmbalazeDTO";

export interface IServisSkladista {
  kreirajSkladiste(dto: KreirajSkladisteDTO): Promise<Skladiste>;
  svaSkladista(): Promise<Skladiste[]>;

  prijemAmbalaze(skladisteId: number, dto: PrijemAmbalazeDTO): Promise<Ambalaza>;

  // x-mode=STANJE -> samo vraća stanje (ne skida)
  // bez x-mode ili x-mode=ISPORUKA -> skida količine i vraća isporučeno
  posaljiParfeme(
    items: { name: string; quantity: number }[],
    uloga: "MENADZER_PRODAJE" | "PRODAVAC",
    mode: "STANJE" | "ISPORUKA"
  ): Promise<{ name: string; quantity: number }[]>;

  sveAmbalaze(): Promise<Ambalaza[]>;



  posaljiAmbalaze(
  trazenaKolicina: number,
  uloga: "MENADZER_PRODAJE" | "PRODAVAC"
  ): Promise<Ambalaza[]>;

}
