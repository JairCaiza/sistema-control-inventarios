import { api } from "../../../../services/api";

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await api.get("/categorias");
  return res.data.data;
};

export const createCategoria = async (data: {
  nombre: string;
  descripcion: string;
}) => {
  const res = await api.post("/categorias", data);
  return res.data;
};
