export interface PerfumeDTO {
  id: number;
  name: string;
  type: "parfum" | "cologne";
  netoMl: 150 | 250;
  serialNumber: string;
  plantId: number;
  expiryDate: string; // dolazi kao ISO string (iz TypeORM)
}
