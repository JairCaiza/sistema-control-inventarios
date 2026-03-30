import { api } from "../../../../services/api";

export interface Activo {
  id: string;
  nombre: string;
  codigo: string;
  categoria: string;
  ubicacion: string;
  cantidad: number;
  estado: string;
}

export const getActivos = async (): Promise<Activo[]> => {
  const res = await api.get("/activos");
  return res.data.data;
};

export const createActivo = async (data: {
  nombre: string;
  codigo: string;
  categoria_id: string;
  ubicacion_id: string;
  cantidad_total: number;
}) => {
  const res = await api.post("/activos", data);
  return res.data;
};

export const updateEstadoActivo = async (id: string, estado: string) => {
  const res = await api.patch(`/activos/${id}/estado`, {
    estado,
  });

  return res.data;
};
