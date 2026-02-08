import { DataSource } from "typeorm";


export async function initializeInitialData(_db: DataSource) {
  console.log("[InitData] Nema inicijalnih podataka za performance microservice.");
}
