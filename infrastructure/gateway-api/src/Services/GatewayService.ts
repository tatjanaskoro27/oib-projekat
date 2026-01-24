import axios, { AxiosInstance } from "axios";
import { IGatewayService } from "../Domain/services/IGatewayService";

import { LoginUserDTO } from "../Domain/DTOs/user/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/user/RegistrationUserDTO";
import { AuthResponseType } from "../Domain/types/AuthResponse";

import { UserDTO } from "../Domain/DTOs/user/UserDTO";
import { CreateUserDTO } from "../Domain/DTOs/user/CreateUserDTO";
import { UpdateUserDTO } from "../Domain/DTOs/user/UpdateUserDTO";

// analytics DTOs
import { UkupnaProdajaDTO } from "../Domain/DTOs/analytics/UkupnaProdajaDTO";
import { UkupnoKomadaDTO } from "../Domain/DTOs/analytics/UkupnoKomadaDTO";
import { NedeljnaProdajaDTO } from "../Domain/DTOs/analytics/NedeljnaProdajaDTO";
import { TrendProdajeDTO } from "../Domain/DTOs/analytics/TrendProdajeDTO";
import { TopPrihodDTO } from "../Domain/DTOs/analytics/TopPrihodDTO";
import { UkupanPrihodTop10DTO } from "../Domain/DTOs/analytics/UkupanPrihodTop10DTO";
import { RacunDTO } from "../Domain/DTOs/analytics/RacunDTO";
import { KreirajRacunDTO } from "../Domain/DTOs/analytics/KreirajRacunDTO";
import { MesecnaProdajaDTO } from "../Domain/DTOs/analytics/MesecnaProdajaDTO";
import { GodisnjaProdajaDTO } from "../Domain/DTOs/analytics/GodisnjaProdajaDTO";
import { TopKolicinaDTO } from "../Domain/DTOs/analytics/TopKolicinaDTO";
import { KolicinaNedeljnaDTO } from "../Domain/DTOs/analytics/KolicinaNedeljnoDTO";
import { KolicinaMesecnaDTO } from "../Domain/DTOs/analytics/KolicinaMesecnoDTO";
import { KolicinaGodisnjaDTO } from "../Domain/DTOs/analytics/KolicinaGodisnjaDTO";

//
import { CreatePlantDTO, HarvestPlantsDTO, ProcessPlantsDTO, UpdateOilStrengthDTO } from "../Domain/DTOs/production/PlantDTOs";
import { PlantResponse, HarvestResponse, AvailableCountResponse, ProcessPlantsResponse } from "../Domain/DTOs/production/PlantTypes";

import { StartProcessingDTO, GetPerfumesDTO } from "../Domain/DTOs/processing/ProcessingDTOs";
import { PerfumeResponse } from "../Domain/DTOs/processing/PerfumeTypes";

//dogadjaji
import { DogadjajDTO } from "../Domain/DTOs/dogadjaji/DogadjajDTO";
import { CreateDogadjajDTO } from "../Domain/DTOs/dogadjaji/CreateDogadjajDTO";
import { UpdateDogadjajDTO } from "../Domain/DTOs/dogadjaji/UpdateDogadjajDTO";
import { TipDogadjaja } from "../Domain/DTOs/dogadjaji/TipDogadjaja";

export class GatewayService implements IGatewayService {
  private readonly authClient: AxiosInstance;
  private readonly userClient: AxiosInstance;
  private readonly analyticsClient: AxiosInstance;
  private readonly productionClient: AxiosInstance;
  private readonly processingClient: AxiosInstance;
  private readonly dogadjajiClient: AxiosInstance;
  private readonly salesClient: AxiosInstance;


  constructor() {
    const authBaseURL = process.env.AUTH_SERVICE_API;
    const userBaseURL = process.env.USER_SERVICE_API;
    const analyticsBaseURL = process.env.ANALYTICS_SERVICE_API;
    const productionBaseURL = process.env.PRODUCTION_SERVICE_API;
    const processingBaseURL = process.env.PROCESSING_SERVICE_API;
    const dogadjajiBaseURL = process.env.DOGADJAJI_SERVICE_API;
    const salesBaseURL = process.env.SALES_SERVICE_API;


    if (!authBaseURL) throw new Error("AUTH_SERVICE_API nije podešen u .env");
    if (!userBaseURL) throw new Error("USER_SERVICE_API nije podešen u .env");
    if (!analyticsBaseURL) throw new Error("ANALYTICS_SERVICE_API nije podešen u .env");
    if (!productionBaseURL) throw new Error("PRODUCTION_SERVICE_API nije podešen u .env");
    if (!processingBaseURL) throw new Error("PROCESSING_SERVICE_API nije podešen u .env");
    if (!dogadjajiBaseURL) throw new Error("DOGADJAJI_SERVICE_API nije podešen u .env");
    if (!salesBaseURL) throw new Error("SALES_SERVICE_API nije podešen u .env");


    this.authClient = axios.create({
      baseURL: authBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.userClient = axios.create({
      baseURL: userBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.analyticsClient = axios.create({
      baseURL: analyticsBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.productionClient = axios.create({
      baseURL: productionBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.processingClient = axios.create({
      baseURL: processingBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.dogadjajiClient = axios.create({
      baseURL: dogadjajiBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.salesClient = axios.create({
      baseURL: salesBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });



  }
  // Auth microservice

  async login(data: LoginUserDTO): Promise<AuthResponseType> {
    try {
      const response = await this.authClient.post<AuthResponseType>("/auth/login", data);
      return response.data;
    } catch {
      return { authenificated: false };
    }
  }

  async register(data: RegistrationUserDTO): Promise<AuthResponseType> {
    try {
      const response = await this.authClient.post<AuthResponseType>("/auth/register", data);
      return response.data;
    } catch {
      return { authenificated: false };
    }
  }

  // User microservice

  async getAllUsers(): Promise<UserDTO[]> {
    const response = await this.userClient.get<UserDTO[]>("/users");
    return response.data;
  }

  async getUserById(id: number): Promise<UserDTO> {
    const response = await this.userClient.get<UserDTO>(`/users/${id}`);
    return response.data;
  }

  async deleteUser(id: number): Promise<{ deleted: true }> {
    const response = await this.userClient.delete<{ deleted: true }>(`/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    const response = await this.userClient.post<UserDTO>("/users", data);
    return response.data;
  }

  async updateUser(id: number, data: UpdateUserDTO): Promise<UserDTO> {
    const response = await this.userClient.put<UserDTO>(`/users/${id}`, data);
    return response.data;
  }

  //taci mikroservis

  async getRacuni(): Promise<RacunDTO[]> {
    const response = await this.analyticsClient.get<RacunDTO[]>("/analytics/racuni");
    return response.data;
  }

  async createRacun(
    data: KreirajRacunDTO
  ): Promise<{ racunId: number; ukupanIznos: number }> {
    const response = await this.analyticsClient.post<{ racunId: number; ukupanIznos: number }>(
      "/analytics/racuni",
      data
    );
    return response.data;
  }

  async getUkupnaProdaja(): Promise<UkupnaProdajaDTO> {
    const response = await this.analyticsClient.get<UkupnaProdajaDTO>("/analytics/prodaja/ukupno");
    return response.data;
  }

  async getProdajaNedeljna(start: string, end: string): Promise<NedeljnaProdajaDTO> {
    const response = await this.analyticsClient.get<NedeljnaProdajaDTO>(
      "/analytics/prodaja/nedeljna",
      { params: { start, end } }
    );
    return response.data;
  }

  async getTrendProdaje(start: string, end: string): Promise<TrendProdajeDTO[]> {
    const response = await this.analyticsClient.get<TrendProdajeDTO[]>(
      "/analytics/prodaja/trend",
      { params: { start, end } }
    );
    return response.data;
  }

  async getUkupnoKomada(): Promise<UkupnoKomadaDTO> {
    const response = await this.analyticsClient.get<UkupnoKomadaDTO>(
      "/analytics/prodaja/kolicina/ukupno"
    );
    return response.data;
  }

  async getTop10Prihod(): Promise<TopPrihodDTO[]> {
    const response = await this.analyticsClient.get<TopPrihodDTO[]>(
      "/analytics/prodaja/top10-prihod"
    );
    return response.data;
  }

  async getTop10PrihodUkupno(): Promise<UkupanPrihodTop10DTO> {
    const response = await this.analyticsClient.get<UkupanPrihodTop10DTO>(
      "/analytics/prodaja/top10-prihod/ukupno"
    );
    return response.data;
  }

  async getProdajaMesecna(godina: number): Promise<MesecnaProdajaDTO[]> {
    const response = await this.analyticsClient.get<MesecnaProdajaDTO[]>(
      `/analytics/prodaja/mesecna/${godina}`
    );
    return response.data;
  }

  async getProdajaGodisnja(godina: number): Promise<GodisnjaProdajaDTO> {
    const response = await this.analyticsClient.get<GodisnjaProdajaDTO>(
      `/analytics/prodaja/godisnja/${godina}`
    );
    return response.data;
  }
  async getTop10Kolicina(): Promise<TopKolicinaDTO[]> {
    const response = await this.analyticsClient.get<TopKolicinaDTO[]>(
      "/analytics/prodaja/top10"
    );
    return response.data;
  }
  async getKolicinaNedeljna(start: string, end: string): Promise<KolicinaNedeljnaDTO> {
    const response = await this.analyticsClient.get<KolicinaNedeljnaDTO>(
      "/analytics/prodaja/kolicina/nedeljna",
      { params: { start, end } }
    );
    return response.data;
  }

  async getKolicinaMesecna(godina: number): Promise<KolicinaMesecnaDTO[]> {
    const response = await this.analyticsClient.get<KolicinaMesecnaDTO[]>(
      `/analytics/prodaja/kolicina/mesecna/${godina}`
    );
    return response.data;
  }

  async getKolicinaGodisnja(godina: number): Promise<KolicinaGodisnjaDTO> {
    const response = await this.analyticsClient.get<KolicinaGodisnjaDTO>(
      `/analytics/prodaja/kolicina/godisnja/${godina}`
    );
    return response.data;
  }

  //production

  async plant(dto: CreatePlantDTO): Promise<PlantResponse> {
    const response = await this.productionClient.post<PlantResponse>("/plants", dto);
    return response.data;
  }

  async updatePlantOilStrength(id: number, dto: UpdateOilStrengthDTO): Promise<PlantResponse> {
    const response = await this.productionClient.patch<PlantResponse>(`/plants/${id}/oil-strength`, dto);
    return response.data;
  }

  async harvestPlants(dto: HarvestPlantsDTO): Promise<HarvestResponse> {
    const response = await this.productionClient.post<HarvestResponse>("/plants/harvest", dto);
    return response.data;
  }

  async getAvailablePlantCount(name: string): Promise<AvailableCountResponse> {
    const response = await this.productionClient.get<AvailableCountResponse>("/plants/available-count", { params: { name } });
    return response.data;
  }

  async getPlants(params?: { search?: string; status?: string; sortBy?: string; sortDir?: string; }): Promise<PlantResponse[]> {
    const response = await this.productionClient.get<PlantResponse[]>("/plants", { params });
    return response.data;
  }

  async getPlantById(id: number): Promise<PlantResponse> {
    const response = await this.productionClient.get<PlantResponse>(`/plants/${id}`);
    return response.data;
  }

  async processPlants(dto: ProcessPlantsDTO): Promise<ProcessPlantsResponse> {
    const response = await this.productionClient.post<ProcessPlantsResponse>("/plants/process", dto);
    return response.data;
  }



  //processing
  async startProcessing(dto: StartProcessingDTO): Promise<PerfumeResponse[]> {
    const response = await this.processingClient.post<PerfumeResponse[]>("/processing/start", dto);
    return response.data;
  }

  async getPerfumes(dto: GetPerfumesDTO): Promise<PerfumeResponse[]> {
    const response = await this.processingClient.post<PerfumeResponse[]>("/processing/get", dto);
    return response.data;
  }

  // dogadjaji

  async getDogadjaji(): Promise<DogadjajDTO[]> {
    const res = await this.dogadjajiClient.get<DogadjajDTO[]>("/dogadjaji");
    return res.data;
  }

  async getDogadjajiByTip(tip: TipDogadjaja): Promise<DogadjajDTO[]> {
    const res = await this.dogadjajiClient.get<DogadjajDTO[]>(`/dogadjaji/tip/${tip}`);
    return res.data;
  }

  async createDogadjaj(dto: CreateDogadjajDTO): Promise<DogadjajDTO> {
    const res = await this.dogadjajiClient.post<DogadjajDTO>("/dogadjaji", dto);
    return res.data;
  }

  async updateDogadjaj(id: number, dto: UpdateDogadjajDTO): Promise<DogadjajDTO> {
    const res = await this.dogadjajiClient.put<DogadjajDTO>(`/dogadjaji/${id}`, dto);
    return res.data;
  }

  async deleteDogadjaj(id: number): Promise<{ deleted: true }> {
    const res = await this.dogadjajiClient.delete<{ deleted: true }>(`/dogadjaji/${id}`);
    return res.data;
  }


  // -------------------
  // SALES
  // -------------------
  async getSalesPerfumes(): Promise<any> {
    const res = await this.salesClient.get("/sales/perfumes");
    return res.data;
  }

  async salesPurchase(dto: any): Promise<any> {
    const res = await this.salesClient.post("/sales/purchase", dto);
    return res.data;
  }



}
