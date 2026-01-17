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
  // random sam ovo -100 do +300
  if (percent < -100 || percent > 300) {
    return { success: false, message: "Percent must be between -100 and 300" };
  }

  return { success: true };
}
