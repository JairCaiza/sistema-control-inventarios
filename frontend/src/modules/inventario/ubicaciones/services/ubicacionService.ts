import { api } from "../../../../services/api";

/* =========================
   INTERFACE
========================= */
export interface Ubicacion {
  id: string;
  nombre: string;
  descripcion: string;
}

/* =========================
   OBTENER UBICACIONES
========================= */
export const getUbicaciones = async (): Promise<Ubicacion[]> => {
  const res = await api.get("/ubicaciones");
  return res.data.data;
};

/* =========================
   CREAR UBICACION
========================= */
export const createUbicacion = async (data: {
  nombre: string;
  descripcion: string;
}) => {
  const res = await api.post("/ubicaciones", data);
  return res.data;
};

/* =========================
   ACTUALIZAR UBICACION
========================= */
export const updateUbicacion = async (
  id: string,
  data: {
    nombre: string;
    descripcion: string;
  },
) => {
  const res = await api.put(`/ubicaciones/${id}`, data);
  return res.data;
};

/* =========================
   ELIMINAR UBICACION
========================= */
export const deleteUbicacion = async (id: string) => {
  const res = await api.delete(`/ubicaciones/${id}`);
  return res.data;
};
