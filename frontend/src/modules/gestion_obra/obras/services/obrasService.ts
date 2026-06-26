import { api } from "../../../../services/api";

export interface Obra {
  id: string;

  codigo: string;

  nombre: string;

  cliente_id?: string;

  cliente_nombre?: string;

  ubicacion?: string;

  fecha_inicio?: string;

  fecha_fin?: string;

  presupuesto?: number;

  estado: "planificada" | "en_proceso" | "pausada" | "finalizada" | "cancelada";

  descripcion?: string;

  observaciones?: string;

  activo?: boolean;

  fecha_creacion?: string;
}

/* =========================
   GET OBRAS
========================= */
export const getObras = async (): Promise<Obra[]> => {
  const response = await api.get("/obras");

  return response.data.data;
};

/* =========================
   GET OBRA BY ID
========================= */
export const getObraById = async (id: string): Promise<Obra> => {
  const response = await api.get(`/obras/${id}`);

  return response.data.data;
};

/* =========================
   CREATE
========================= */
export const createObra = async (data: Partial<Obra>): Promise<Obra> => {
  const response = await api.post("/obras", data);

  return response.data.data;
};

/* =========================
   UPDATE
========================= */
export const updateObra = async (
  id: string,
  data: Partial<Obra>,
): Promise<Obra> => {
  const response = await api.put(`/obras/${id}`, data);

  return response.data.data;
};

/* =========================
   DELETE
========================= */
export const deleteObra = async (id: string): Promise<void> => {
  await api.delete(`/obras/${id}`);
};
