import { KreirajSkladisteDTO } from "../../Domain/DTOs/skladiste/KreirajSkladisteDTO";

export function validirajKreiranjeSkladista(body: any): KreirajSkladisteDTO {
  const { naziv, lokacija, maksimalanBrojAmbalaza } = body ?? {};

  if (!naziv || typeof naziv !== "string") throw new Error("Naziv je obavezan.");
  if (!lokacija || typeof lokacija !== "string") throw new Error("Lokacija je obavezna.");

  const max = Number(maksimalanBrojAmbalaza);
  if (!Number.isFinite(max) || max <= 0) throw new Error("maksimalanBrojAmbalaza mora biti > 0.");

  return { naziv, lokacija, maksimalanBrojAmbalaza: max };
}
