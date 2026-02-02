export interface CreatePlantDTO {
  name: string;
  latinName: string;
  originCountry: string;

  // opciono: ako se ne posalje -> backend generise random 1.00–5.00
  oilStrength?: number;
}
