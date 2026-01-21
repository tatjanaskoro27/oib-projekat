import { Ambalaza } from "../../models/Ambalaza";

export interface OdgovorNaSlanjeDTO {
  uloga: "MENADZER_PRODAJE" | "PRODAVAC";
  poslato: number;
  ambalaze: Ambalaza[];
}
