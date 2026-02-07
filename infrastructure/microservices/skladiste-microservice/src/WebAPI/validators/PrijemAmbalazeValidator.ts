import { PrijemAmbalazeDTO } from "../../Domain/DTOs/skladiste/PrijemAmbalazeDTO";

const isNonEmptyString = (v: any): v is string => typeof v === "string" && v.trim().length > 0;

export function validirajPrijemAmbalaze(body: any): { perfumeId: string; naziv: string }[] {
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("items mora biti niz i ne sme biti prazan.");
  }

  return items.map((x: any) => {
    const perfumeId = String(x?.perfumeId ?? "").trim();
    const naziv = String(x?.naziv ?? x?.name ?? "").trim();

    if (!perfumeId) throw new Error("Svaki item mora imati perfumeId.");
    if (!naziv) throw new Error("Svaki item mora imati naziv.");

    return { perfumeId, naziv };
  });
}


