import { UserDTO } from "../../models/users/UserDTO";
import { CreateUserDTO } from "../../models/users/CreateUserDTO";
import { UpdateUserDTO } from "../../models/users/UpdateUserDTO";

export interface IUserAPI {
  getAllUsers(token: string): Promise<UserDTO[]>;
  getUserById(token: string, id: number): Promise<UserDTO>;

  createUser(token: string, dto: CreateUserDTO): Promise<UserDTO>;
  updateUser(token: string, id: number, dto: UpdateUserDTO): Promise<UserDTO>;
  deleteUser(token: string, id: number): Promise<{ deleted: true }>;
}
