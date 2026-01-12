export interface UpdatePlantDTO {
  name?: string;
  species?: string | null;
  price?: number;
  stock?: number;
  description?: string | null;
  imageUrl?: string | null;
}
