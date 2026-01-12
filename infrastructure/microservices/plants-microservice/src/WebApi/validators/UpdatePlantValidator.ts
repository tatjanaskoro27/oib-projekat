import { UpdatePlantDTO } from "../../Domain/DTOs/UpdatePlantDTO";

export function validateUpdatePlant(data: UpdatePlantDTO): {
  success: boolean;
  message?: string;
} {
  if (!data || Object.keys(data).length === 0)
    return { success: false, message: "No fields provided for update" };
  if (data.name !== undefined && data.name.trim().length < 2)
    return {
      success: false,
      message: "Name must be at least 2 characters long",
    };
  if (data.price !== undefined && Number(data.price) < 0)
    return { success: false, message: "Price must be a non-negative number" };
  if (data.stock !== undefined && Number(data.stock) < 0)
    return { success: false, message: "Stock must be >= 0" };
  return { success: true };
}
