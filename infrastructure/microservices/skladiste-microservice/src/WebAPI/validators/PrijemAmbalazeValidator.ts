import { PrijemAmbalazeDTO } from "../../Domain/DTOs/skladiste/PrijemAmbalazeDTO";

export function validirajPrijemAmbalaze(body: any): PrijemAmbalazeDTO {
  const { naziv, adresaPosiljaoca, perfumeIds } = body ?? {};

  if (!naziv || typeof naziv !== "string") throw new Error("Naziv ambalaze je obavezan.");
  if (!adresaPosiljaoca || typeof adresaPosiljaoca !== "string") throw new Error("Adresa posiljaoca je obavezna.");

  const ids = Array.isArray(perfumeIds) ? perfumeIds.map(Number) : [];
  if (ids.some((x) => !Number.isFinite(x) || x <= 0)) throw new Error("perfumeIds mora biti niz pozitivnih brojeva.");

  return { naziv, adresaPosiljaoca, perfumeIds: ids };
}
