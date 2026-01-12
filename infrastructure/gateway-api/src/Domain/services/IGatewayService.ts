import { CreateUserDTO } from "../DTOs/CreateUserDTO";
import { LoginUserDTO } from "../DTOs/LoginUserDTO";
import { RegistrationUserDTO } from "../DTOs/RegistrationUserDTO";
import { UpdateUserDTO } from "../DTOs/UpdateUserDTO";
import { UserDTO } from "../DTOs/UserDTO";
import { AuthResponseType } from "../types/AuthResponse";

//analitiks
import { UkupnaProdajaDTO } from "../DTOs/UkupnaProdajaDTO";
import { UkupnoKomadaDTO } from "../DTOs/UkupnoKomadaDTO";
import { NedeljnaProdajaDTO } from "../DTOs/NedeljnaProdajaDTO";
import { TrendProdajeDTO } from "../DTOs/TrendProdajeDTO";
import { TopPrihodDTO } from "../DTOs/TopPrihodDTO";
import { UkupanPrihodTop10DTO } from "../DTOs/UkupanPrihodTop10DTO";
import { RacunDTO } from "../DTOs/RacunDTO";
import { KreirajRacunDTO } from "../DTOs/KreirajRacunDTO";


export interface IGatewayService {
  // Auth
  login(data: LoginUserDTO): Promise<AuthResponseType>;
  register(data: RegistrationUserDTO): Promise<AuthResponseType>;

  // Users
  getAllUsers(): Promise<UserDTO[]>;
  getUserById(id: number): Promise<UserDTO>;
  deleteUser(id: number): Promise<{ deleted: true }>;
  createUser(data: CreateUserDTO): Promise<UserDTO>;
  updateUser(id: number, data: UpdateUserDTO): Promise<UserDTO>;

    // Analytics
  getRacuni(): Promise<RacunDTO[]>;
  createRacun(data: KreirajRacunDTO): Promise<{ racunId: number; ukupanIznos: number }>;

  getUkupnaProdaja(): Promise<UkupnaProdajaDTO>;
  getProdajaNedeljna(start: string, end: string): Promise<NedeljnaProdajaDTO>;
  getTrendProdaje(start: string, end: string): Promise<TrendProdajeDTO[]>;

  getUkupnoKomada(): Promise<UkupnoKomadaDTO>;

  getTop10Prihod(): Promise<TopPrihodDTO[]>;
  getTop10PrihodUkupno(): Promise<UkupanPrihodTop10DTO>;



}
