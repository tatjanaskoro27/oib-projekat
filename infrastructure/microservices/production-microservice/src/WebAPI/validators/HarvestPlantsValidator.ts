import { HarvestPlantsDTO } from "../../Domain/DTOs/HarvestPlantsDTO";

export function validateHarvestPlantsData(
  data: HarvestPlantsDTO
): { success: boolean; message?: string } {
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, message: "Name must be provided" };
  }

  const count = Number((data as any).count);

  if (!Number.isInteger(count) || count < 1) {
    return { success: false, message: "Count must be an integer greater than 0" };
  }

  return { success: true };
}
