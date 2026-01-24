import { DataSource } from "typeorm";

/**
 * Performance microservice nema inicijalne (seed) podatke.
 * Izveštaji se kreiraju nakon pokretanja simulacije i čuvaju u bazi.
 */
export async function initializeInitialData(_db: DataSource) {
  console.log("[InitData] Nema inicijalnih podataka za performance microservice.");
}
