import { ZahtevZaSlanjeDTO } from "../../Domain/DTOs/skladiste/ZahtevZaSlanjeDTO";

const isNonEmptyString = (v: any): v is string => typeof v === "string" && v.trim().length > 0;

export function validirajSlanje(body: any): { items: { naziv: string; kolicina: number }[] } {
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("items mora biti niz i ne sme biti prazan.");
  }

  const mapped = items.map((x: any) => {
    const naziv = String(x?.naziv ?? x?.name ?? "").trim();
    const kolicina = Number(x?.kolicina ?? x?.quantity ?? 0);

    if (!naziv) throw new Error("Svaki item mora imati naziv/name.");
    if (!Number.isFinite(kolicina) || kolicina <= 0) throw new Error("kolicina/quantity mora biti > 0.");

    return { naziv, kolicina };
  });

  return { items: mapped };
}

