import { Skladiste } from "../models/Skladiste";
import { Ambalaza } from "../models/Ambalaza";

export type Uloga = "MENADZER_PRODAJE" | "PRODAVAC";
export type Mode = "STANJE" | "ISPORUKA";

export interface IServisSkladista {
  kreirajSkladiste(dto: any): Promise<Skladiste>;
  svaSkladista(): Promise<Skladiste[]>;

  // ✅ Prijem ambalaze sada prima realne parfeme
  prijemAmbalaze(
    skladisteId: number,
    parfemi: { perfumeId: string; naziv: string }[]
  ): Promise<Ambalaza>;

  posaljiParfeme(
    items: { naziv: string; kolicina: number }[],
    uloga: Uloga,
    mode: Mode
  ): Promise<
    | { naziv: string; kolicina: number }[]           // STANJE
    | { perfumeId: string; naziv: string }[]          // ISPORUKA
  >;

  sveAmbalaze(): Promise<Ambalaza[]>;

  posaljiAmbalaze(trazenaKolicina: number, uloga: Uloga): Promise<Ambalaza[]>;
}
