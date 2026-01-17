export interface CreatePlantDTO {
  name: string;
  latinName: string;
  originCountry: string;

  // optional: ako ne dodje -> random 1.00–5.00
  oilStrength?: number;
}
