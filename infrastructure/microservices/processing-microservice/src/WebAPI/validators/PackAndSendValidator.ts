import { PackAndSendRequestDTO } from "../../Domain/DTOs/PackAndSendRequestDTO";

type ValidationResult = { success: true } | { success: false; message: string };

export function validatePackAndSendData(body: any): ValidationResult {
  const dto = body as PackAndSendRequestDTO;
  const skladisteId = Number(dto?.skladisteId);
  if (!Number.isFinite(skladisteId) || skladisteId <= 0) {
    return { success: false, message: "skladisteId mora biti > 0" };
  }

  if (!Array.isArray(dto?.items) || dto.items.length === 0) {
    return { success: false, message: "items mora biti ne-prazan niz" };
  }

  for (let i = 0; i < dto.items.length; i++) {
    const it: any = dto.items[i];
    if (!it?.perfumeName || String(it.perfumeName).trim().length === 0) {
      return { success: false, message: `items[${i}].perfumeName je obavezan` };
    }
    if (!it?.perfumeType || String(it.perfumeType).trim().length === 0) {
      return { success: false, message: `items[${i}].perfumeType je obavezan` };
    }
    const bottleVolume = Number(it?.bottleVolume);
    if (!Number.isFinite(bottleVolume) || bottleVolume <= 0) {
      return { success: false, message: `items[${i}].bottleVolume mora biti > 0` };
    }
    const quantity = Number(it?.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { success: false, message: `items[${i}].quantity mora biti > 0` };
    }
  }

  return { success: true };
}
