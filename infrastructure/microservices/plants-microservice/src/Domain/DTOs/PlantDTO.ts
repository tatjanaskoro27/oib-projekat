export interface PlantDTO {
  id: number;
  name: string;
  species?: string | null;
  price: number;
  stock: number;
  description?: string | null;
  imageUrl?: string | null;
}
