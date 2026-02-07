// src/Domain/DTOs/CatalogItemDTO.ts
export interface CatalogItemDTO {
  name: string;
  type: string;
  netoMl: number;
  description: string;
  price: number;
  availableQty?: number; // Sales će popuniti iz Skladišta
}
