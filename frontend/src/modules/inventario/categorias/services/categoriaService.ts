import { api } from "../../../../services/api";

/* =========================
   INTERFACE
========================= */
export interface Categoria {
  id: string;
  nombre: string;
  tipo: "equipo" | "herramienta" | "encofrado";
  activo: boolean;
}

/* =========================
   GET
========================= */
export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await api.get("/categorias");
  return res.data.data;
};

/* =========================
   CREATE
========================= */
export const createCategoria = async (data: {
  nombre: string;
  tipo: string;
}) => {
  const res = await api.post("/categorias", data);
  return res.data;
};

/* =========================
   UPDATE
========================= */
export const updateCategoria = async (
  id: string,
  data: {
    nombre: string;
    tipo: string;
  },
) => {
  const res = await api.put(`/categorias/${id}`, data);
  return res.data;
};

/* =========================
   TOGGLE (ACTIVO / INACTIVO)
========================= */
export const toggleCategoriaStatus = async (id: string, activo: boolean) => {
  const res = await api.put(`/categorias/${id}/status`, {
    activo,
  });

  return res.data;
};

/* =========================
   DELETE
========================= */
export const deleteCategoria = async (id: string) => {
  const res = await api.delete(`/categorias/${id}`);
  return res.data;
};
