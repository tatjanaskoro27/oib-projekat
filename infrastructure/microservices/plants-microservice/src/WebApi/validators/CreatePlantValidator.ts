import { CreatePlantDTO } from "../../Domain/DTOs/CreatePlantDTO";

export function validateCreatePlant(data: CreatePlantDTO): {
  success: boolean;
  message?: string;
} {
  if (!data || typeof data !== "object")
    return { success: false, message: "Invalid payload" };
  if (!data.name || data.name.trim().length < 2)
    return {
      success: false,
      message: "Name must be at least 2 characters long",
    };
  if (data.price === undefined || Number(data.price) < 0)
    return { success: false, message: "Price must be a non-negative number" };
  if (data.stock !== undefined && Number(data.stock) < 0)
    return { success: false, message: "Stock must be >= 0" };
  return { success: true };
}
