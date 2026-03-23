import { api } from "./api";

export interface LoginData {
  correo: string;
  contrasena: string;
}

export const login = async (data: LoginData) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};
