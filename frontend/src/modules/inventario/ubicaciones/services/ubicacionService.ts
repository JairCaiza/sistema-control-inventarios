import { api } from "../../../../services/api";

export interface Ubicacion {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export const getUbicaciones = async (): Promise<Ubicacion[]> => {
  const res = await api.get("/ubicaciones");
  return res.data.data;
};

export const createUbicacion = async (data: {
  nombre: string;
  descripcion: string;
}) => {
  const res = await api.post("/ubicaciones", data);
  return res.data;
};
