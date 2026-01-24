import { ProcessPlantsDTO } from "../../Domain/DTOs/ProcessPlantsDTO";

export function validateProcessPlantsData(
  body: ProcessPlantsDTO
): { success: true } | { success: false; message: string } {

  if (!Array.isArray(body.plantIds)) {
    return { success: false, message: "plantIds must be an array." };
  }

  if (body.plantIds.length === 0) {
    return { success: false, message: "plantIds must not be empty." };
  }

  const allValid = body.plantIds.every(
    (id) => Number.isInteger(id) && id > 0
  );

  if (!allValid) {
    return { success: false, message: "plantIds must contain positive integers only." };
  }

  return { success: true };
}
