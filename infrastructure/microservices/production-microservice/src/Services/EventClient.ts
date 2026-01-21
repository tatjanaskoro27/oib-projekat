import axios, { AxiosInstance } from "axios";
import { CreateDogadjajDTO } from "../Domain/DTOs/EventDTO";

export class EventClient {
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = process.env.GATEWAY_INTERNAL_API;
    if (!baseURL) throw new Error("GATEWAY_INTERNAL_API nije podešen u .env");

    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) throw new Error("INTERNAL_API_KEY nije podešen u .env");

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      timeout: 5000,
    });
  }

  async logEvent(dto: CreateDogadjajDTO): Promise<void> {
    await this.client.post("/internal/dogadjaji", dto);
  }
}
