import { UserRole } from "../enums/UserRole";

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;     
  role?: UserRole;
  profileImage?: string | null;
}
