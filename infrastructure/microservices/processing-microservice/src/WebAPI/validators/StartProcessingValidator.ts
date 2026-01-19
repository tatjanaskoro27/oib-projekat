import { StartProcessingDTO } from "../../Domain/DTOs/StartProcessingDTO";
import { PerfumeType } from "../../Domain/enums/PerfumeType";

export function validateStartProcessingData(
  data: StartProcessingDTO
): { success: boolean; message?: string } {
  if (!data.perfumeName || data.perfumeName.trim().length < 2) {
    return { success: false, message: "perfumeName is required" };
  }

  if (![PerfumeType.PARFUM, PerfumeType.COLOGNE].includes(data.perfumeType)) {
    return { success: false, message: "perfumeType must be 'PARFUM' or 'COLOGNE'" };
  }

  if (!Number.isInteger(data.bottleCount) || data.bottleCount < 1) {
    return { success: false, message: "bottleCount must be integer >= 1" };
  }

  if (data.bottleVolume !== 150 && data.bottleVolume !== 250) {
    return { success: false, message: "bottleVolume must be 150 or 250" };
  }

  return { success: true };
}
