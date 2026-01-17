import { CreatePlantDTO } from "../../Domain/DTOs/CreatePlantDTO";

export function validateCreatePlantData(
  data: CreatePlantDTO
): { success: boolean; message?: string } {
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, message: "Name must be at least 2 characters long" };
  }
  if (!data.latinName || data.latinName.trim().length < 3) {
    return { success: false, message: "Latin name must be at least 3 characters long" };
  }
  if (!data.originCountry || data.originCountry.trim().length < 2) {
    return { success: false, message: "Origin country must be provided" };
  }

  if (data.oilStrength !== undefined && data.oilStrength !== null) {
    const val = Number(data.oilStrength);
    if (Number.isNaN(val) || val < 1.0 || val > 5.0) {
      return { success: false, message: "Oil strength must be between 1.00 and 5.00" };
    }
  }

  return { success: true };
}
