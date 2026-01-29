import axios, { AxiosInstance } from "axios";
import { IUserAPI } from "./IUserAPI";
import { UserDTO } from "../../models/users/UserDTO";
import { CreateUserDTO } from "../../models/users/CreateUserDTO";
import { UpdateUserDTO } from "../../models/users/UpdateUserDTO";

export class UserAPI implements IUserAPI {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  private auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async getAllUsers(token: string): Promise<UserDTO[]> {
    return (
      await this.axiosInstance.get<UserDTO[]>("/users", {
        headers: this.auth(token),
      })
    ).data;
  }

  async getUserById(token: string, id: number): Promise<UserDTO> {
    return (
      await this.axiosInstance.get<UserDTO>(`/users/${id}`, {
        headers: this.auth(token),
      })
    ).data;
  }

  async createUser(token: string, dto: CreateUserDTO): Promise<UserDTO> {
    return (
      await this.axiosInstance.post<UserDTO>("/users", dto, {
        headers: this.auth(token),
      })
    ).data;
  }

  async updateUser(
    token: string,
    id: number,
    dto: UpdateUserDTO,
  ): Promise<UserDTO> {
    return (
      await this.axiosInstance.put<UserDTO>(`/users/${id}`, dto, {
        headers: this.auth(token),
      })
    ).data;
  }

  async deleteUser(token: string, id: number): Promise<{ deleted: true }> {
    return (
      await this.axiosInstance.delete<{ deleted: true }>(`/users/${id}`, {
        headers: this.auth(token),
      })
    ).data;
  }
}
