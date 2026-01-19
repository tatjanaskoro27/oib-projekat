import { UserRole } from "../../enums/UserRole";

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  profileImage?: string | null;
}
