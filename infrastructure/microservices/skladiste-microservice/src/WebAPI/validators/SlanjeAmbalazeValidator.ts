import { ZahtevZaSlanjeDTO } from "../../Domain/DTOs/skladiste/ZahtevZaSlanjeDTO";

const isNonEmptyString = (v: any): v is string => typeof v === "string" && v.trim().length > 0;

export function validirajSlanje(body: any): ZahtevZaSlanjeDTO {
  const { items } = body ?? {};
  if (!Array.isArray(items) || items.length === 0) throw new Error("items mora biti ne-prazan niz.");

  const norm = items.map((x: any) => {
    const name = String(x?.name ?? "").trim();
    const quantity = Number(x?.quantity);
    if (!isNonEmptyString(name)) throw new Error("Svaki item mora imati name.");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Svaki item mora imati quantity > 0.");
    return { name, quantity };
  });

  return { items: norm };
}
