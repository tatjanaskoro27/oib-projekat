export type CreateUserDTO = {
  username: string;
  password: string;
  email: string;
  role?: string; // npr "admin" / "seller" (zavisi kako je enum kod vas)
  profileImage?: string; // base64 ili url (string)
};
