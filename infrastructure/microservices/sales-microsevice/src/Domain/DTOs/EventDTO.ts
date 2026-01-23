export type EventType = "INFO" | "WARNING" | "ERROR";

export type CreateDogadjajDTO = {
  type: EventType;
  description: string;
  createdAt?: string; // opcionalno, audit MS može sam setovati
};
