import axios, { AxiosInstance, AxiosResponse } from "axios";
import { IDogadjajiAPI } from "./IDogadjajiAPI";
import { DogadjajDTO } from "../../models/dogadjaji/DogadjajDTO";
import { TipDogadjaja } from "../../models/dogadjaji/TipDogadjaja";

export class DogadjajiAPI implements IDogadjajiAPI {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  private auth(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }

  async getDogadjaji(token: string): Promise<DogadjajDTO[]> {
    const res: AxiosResponse<DogadjajDTO[]> =
      await this.axiosInstance.get("/dogadjaji", {
        headers: this.auth(token),
      });

    return res.data;
  }

  async getDogadjajiByTip(
    token: string,
    tip: TipDogadjaja
  ): Promise<DogadjajDTO[]> {
    const res: AxiosResponse<DogadjajDTO[]> =
      await this.axiosInstance.get(`/dogadjaji/tip/${tip}`, {
        headers: this.auth(token),
      });

    return res.data;
  }
}
