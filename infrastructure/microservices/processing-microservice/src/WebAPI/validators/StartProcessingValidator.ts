import { StartProcessingDTO } from "../../Domain/DTOs/StartProcessingDTO";
import { PerfumeType } from "../../Domain/enums/PerfumeType";

export function validateStartProcessingData(
  data: StartProcessingDTO
): { success: boolean; message?: string } {
  if (!data.perfumeName || data.perfumeName.trim().length < 2) {
    return { success: false, message: "perfumeName is required" };
  }

  if (![PerfumeType.PARFUM, PerfumeType.COLOGNE].includes(data.perfumeType)) {
    return { success: false, message: "perfumeType must be 'parfum' or 'cologne'" };
  }

  const bottleCount = Number((data as any).bottleCount);
  if (!Number.isInteger(bottleCount) || bottleCount < 1) {
    return { success: false, message: "bottleCount must be integer >= 1" };
  }

  const volume = Number((data as any).bottleVolume);
  if (volume !== 150 && volume !== 250) {
    return { success: false, message: "bottleVolume must be 150 or 250" };
  }

  if (!Array.isArray(data.plantIds) || data.plantIds.length < 1) {
    return { success: false, message: "plantIds must be a non-empty array" };
  }

  const allInts = data.plantIds.every((x) => Number.isInteger(Number(x)) && Number(x) > 0);
  if (!allInts) {
    return { success: false, message: "plantIds must be positive integers" };
  }

  return { success: true };
}
