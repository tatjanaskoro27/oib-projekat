import { ZahtevZaSlanjeDTO } from "../../Domain/DTOs/skladiste/ZahtevZaSlanjeDTO";

export function validirajSlanje(body: any): ZahtevZaSlanjeDTO {
  const { trazenaKolicina } = body ?? {};
  const k = Number(trazenaKolicina);

  if (!Number.isFinite(k) || k <= 0) throw new Error("trazenaKolicina mora biti > 0.");

  return { trazenaKolicina: k };
}
