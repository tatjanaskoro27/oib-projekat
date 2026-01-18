export type MicroserviceLink = {
  key:
    | "analytics"
    | "auth"
    | "dogadjaji"
    | "processing"
    | "production"
    | "sales"
    | "user";
  title: string;
  description: string;
  path: string;
  badge: "CORE" | "DATA" | "GATEWAY" | "OPS";
};
