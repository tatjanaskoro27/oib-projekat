import { Skladiste } from "../models/Skladiste";
import { Ambalaza } from "../models/Ambalaza";
import { KreirajSkladisteDTO } from "../DTOs/skladiste/KreirajSkladisteDTO";
import { PrijemAmbalazeDTO } from "../DTOs/skladiste/PrijemAmbalazeDTO";

export interface IServisSkladista {
  kreirajSkladiste(dto: KreirajSkladisteDTO): Promise<Skladiste>;
  svaSkladista(): Promise<Skladiste[]>;

  prijemAmbalaze(skladisteId: number, dto: PrijemAmbalazeDTO): Promise<Ambalaza>;

  posaljiAmbalaze(
    trazenaKolicina: number,
    uloga: "MENADZER_PRODAJE" | "PRODAVAC"
  ): Promise<Ambalaza[]>;
}
