import { PrijemAmbalazeDTO } from "../../Domain/DTOs/skladiste/PrijemAmbalazeDTO";

const isNonEmptyString = (v: any): v is string => typeof v === "string" && v.trim().length > 0;

export function validirajPrijemAmbalaze(body: any): PrijemAmbalazeDTO {
  const { naziv, adresaPosiljaoca, items } = body ?? {};

  if (!isNonEmptyString(naziv)) throw new Error("Naziv ambalaže je obavezan.");
  if (!isNonEmptyString(adresaPosiljaoca)) throw new Error("Adresa pošiljaoca je obavezna.");

  if (!Array.isArray(items) || items.length === 0) throw new Error("items mora biti ne-prazan niz.");

  const norm = items.map((x: any) => {
    const name = String(x?.name ?? "").trim();
    const quantity = Number(x?.quantity);
    if (!isNonEmptyString(name)) throw new Error("Svaki item mora imati name.");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Svaki item mora imati quantity > 0.");
    return { name, quantity };
  });

  return {
    naziv: naziv.trim(),
    adresaPosiljaoca: adresaPosiljaoca.trim(),
    items: norm,
  };
}
