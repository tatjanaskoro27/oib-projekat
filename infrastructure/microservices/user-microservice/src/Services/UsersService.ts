import { Repository } from "typeorm";
import { IUsersService } from "../Domain/services/IUsersService";
import { User } from "../Domain/models/User";
import { UserDTO } from "../Domain/DTOs/UserDTO";

import bcrypt from "bcryptjs";
import { CreateUserDTO } from "../Domain/DTOs/CreateUserDTO";
import { UpdateUserDTO } from "../Domain/DTOs/UpdateUserDTO";
import { UserRole } from "../Domain/enums/UserRole";


export class UsersService implements IUsersService {
  private readonly saltRounds: number = parseInt(process.env.SALT_ROUNDS || "10", 10);
  constructor(private userRepository: Repository<User>) {}

  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    const existingUsername = await this.userRepository.findOne({
      where: { username: data.username },
    });
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    const existingEmail = await this.userRepository.findOne({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

    const user = this.userRepository.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role ?? UserRole.SELLER,
      profileImage: data.profileImage ?? null,
    });

    const saved = await this.userRepository.save(user);
    return this.toDTO(saved);
  }

  async updateUser(id: number, data: UpdateUserDTO): Promise<UserDTO> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    // username unique samo ako se mijenja
    if (data.username && data.username !== user.username) {
      const exists = await this.userRepository.findOne({
        where: { username: data.username },
      });
      if (exists) throw new Error("Username already exists");
      user.username = data.username;
    }

    // email unique samo ako se mijenja
    if (data.email && data.email !== user.email) {
      const exists = await this.userRepository.findOne({
        where: { email: data.email },
      });
      if (exists) throw new Error("Email already exists");
      user.email = data.email;
    }

    // password update = hash
    if (data.password && data.password.trim().length > 0) {
      user.password = await bcrypt.hash(data.password, this.saltRounds);
    }

    // ostala polja
    if (data.role) user.role = data.role;
    if (data.profileImage !== undefined) user.profileImage = data.profileImage;

    const saved = await this.userRepository.save(user);
    return this.toDTO(saved);
  }

  async deleteUser(id: number): Promise<{ deleted: true; }> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);

    return { deleted: true };
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<UserDTO[]> {
    const users = await this.userRepository.find();
    return users.map(u => this.toDTO(u));
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new Error(`User with ID ${id} not found`);
    return this.toDTO(user);
  }

  /**
   * Convert User entity to UserDTO
   */
  private toDTO(user: User): UserDTO {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage ?? "",
    };
  }
}
