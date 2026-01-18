import { GetPerfumesDTO } from "../../Domain/DTOs/GetPerfumesDTO";
import { PerfumeType } from "../../Domain/enums/PerfumeType";

export function validateGetPerfumesData(
  data: GetPerfumesDTO
): { success: boolean; message?: string } {
  if (![PerfumeType.PARFUM, PerfumeType.COLOGNE].includes(data.perfumeType)) {
    return { success: false, message: "perfumeType must be 'parfum' or 'cologne'" };
  }

  const count = Number((data as any).count);
  if (!Number.isInteger(count) || count < 1) {
    return { success: false, message: "count must be integer >= 1" };
  }

  return { success: true };
}
