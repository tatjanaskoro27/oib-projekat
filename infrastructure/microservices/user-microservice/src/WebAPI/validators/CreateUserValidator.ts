import { CreateUserDTO } from "../../Domain/DTOs/CreateUserDTO";
import { UserRole } from "../../Domain/enums/UserRole";

export function validateCreateUserData(data: CreateUserDTO): { success: boolean; message?: string } {
  if (!data.username || data.username.trim().length < 3) {
    return { success: false, message: "Username must be at least 3 characters long" };
  }
  if (!data.password || data.password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long" };
  }
  if (!data.email || !data.email.includes("@")) {
    return { success: false, message: "Invalid email address" };
  }
  if (data.role && !Object.values(UserRole).includes(data.role as UserRole)) {
    return { success: false, message: "Invalid role" };
  }
  if (data.profileImage !== undefined && data.profileImage !== null && typeof data.profileImage !== "string") {
    return { success: false, message: "Invalid profileImage" };
  }
  return { success: true };
}
