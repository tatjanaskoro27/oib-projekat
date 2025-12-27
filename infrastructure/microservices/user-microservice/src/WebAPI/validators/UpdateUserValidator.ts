import { UpdateUserDTO } from "../../Domain/DTOs/UpdateUserDTO";
import { UserRole } from "../../Domain/enums/UserRole";

export function validateUpdateUserData(data: UpdateUserDTO): { success: boolean; message?: string } {
  if (!data || Object.keys(data).length === 0) {
    return { success: false, message: "No fields provided for update" };
  }
  if (data.username !== undefined && data.username.trim().length < 3) {
    return { success: false, message: "Username must be at least 3 characters long" };
  }
  if (data.password !== undefined && data.password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long" };
  }
  if (data.email !== undefined && !data.email.includes("@")) {
    return { success: false, message: "Invalid email address" };
  }
  if (data.role !== undefined && !Object.values(UserRole).includes(data.role as UserRole)) {
    return { success: false, message: "Invalid role" };
  }
  if (data.profileImage !== undefined && data.profileImage !== null && typeof data.profileImage !== "string") {
    return { success: false, message: "Invalid profileImage" };
  }

  return { success: true };
}
