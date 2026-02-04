export type WarehouseDTO = {
  id: number;
  naziv: string;
  lokacija: string;
  maxAmbalaza: number;
  trenutnoAmbalaza?: number; // ako backend vraća
};

export type PackageDTO = {
  id: number;
  naziv: string;
  adresaPosiljaoca?: string;
  skladisteId: number;
  parfemiIds?: number[];
  status: string; // "SPAKOVANA" | "POSLATA" ...
};

export type SendPackagesRequestDTO = {
  brojAmbalaza: number;
};

export type SendPackagesResponseDTO = {
  message?: string;
  items?: PackageDTO[]; // ako backend vraća poslate
};
