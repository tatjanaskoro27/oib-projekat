export function validateUpdateOilStrengthData(
  data: any
): { success: boolean; message?: string } {
  if (data === undefined || data === null) {
    return { success: false, message: "Body is missing" };
  }

  const percent = Number(data.percent);

  if (Number.isNaN(percent)) {
    return { success: false, message: "Percent must be a number" };
  }

  if (percent < 0 || percent > 100) {
    return { success: false, message: "Percent must be between 0 and 100" };
  }

  return { success: true };
}
