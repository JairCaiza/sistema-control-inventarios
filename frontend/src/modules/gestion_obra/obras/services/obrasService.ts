import { api } from "../../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export type EstadoObra =
  | "planificada"
  | "en_proceso"
  | "pausada"
  | "finalizada"
  | "cancelada";

/* =====================================================
   OBRA
===================================================== */

export interface Obra {
  id: string;

  codigo: string;

  nombre: string;

  cliente_id?: string | null;

  cliente_nombre?: string | null;

  ubicacion?: string | null;

  fecha_inicio?: string | null;

  fecha_fin?: string | null;

  presupuesto?: number | string | null;

  estado: EstadoObra;

  descripcion?: string | null;

  fecha_creacion?: string | null;
}

/* =====================================================
   PAYLOAD CREATE
===================================================== */

export interface CrearObraPayload {
  codigo: string;

  nombre: string;

  cliente_id?: string | null;

  ubicacion?: string | null;

  fecha_inicio?: string | null;

  fecha_fin?: string | null;

  presupuesto?: number;

  estado?: EstadoObra;

  descripcion?: string | null;
}

/* =====================================================
   PAYLOAD UPDATE
===================================================== */

export interface ActualizarObraPayload {
  codigo?: string;

  nombre?: string;

  cliente_id?: string | null;

  ubicacion?: string | null;

  fecha_inicio?: string | null;

  fecha_fin?: string | null;

  presupuesto?: number;

  estado?: EstadoObra;

  descripcion?: string | null;
}

/* =====================================================
   RESPONSE
===================================================== */

interface ApiResponse<T> {
  success: boolean;

  message?: string;

  data: T;
}

/* =====================================================
   HELPERS
===================================================== */

const limpiarPayload = <T extends object>(data: T): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
};

/* =====================================================
   GET OBRAS
===================================================== */

export const getObras = async (): Promise<Obra[]> => {
  const response = await api.get<ApiResponse<Obra[]>>("/obras");

  return response.data.data;
};

/* =====================================================
   GET OBRA BY ID
===================================================== */

export const getObraById = async (id: string): Promise<Obra> => {
  const response = await api.get<ApiResponse<Obra>>(`/obras/${id}`);

  return response.data.data;
};

/* =====================================================
   CREATE OBRA
===================================================== */

export const createObra = async (data: CrearObraPayload): Promise<Obra> => {
  const payload = limpiarPayload(data);

  const response = await api.post<ApiResponse<Obra>>("/obras", payload);

  return response.data.data;
};

/* =====================================================
   UPDATE OBRA
===================================================== */

export const updateObra = async (
  id: string,
  data: ActualizarObraPayload,
): Promise<Obra> => {
  const payload = limpiarPayload(data);

  const response = await api.put<ApiResponse<Obra>>(`/obras/${id}`, payload);

  return response.data.data;
};

/* =====================================================
   DELETE OBRA
===================================================== */

export interface EliminarObraResponse {
  id: string;

  codigo?: string;

  nombre?: string;
}

export const deleteObra = async (id: string): Promise<EliminarObraResponse> => {
  const response = await api.delete<ApiResponse<EliminarObraResponse>>(
    `/obras/${id}`,
  );

  return response.data.data;
};

/* =====================================================
   EXPORT DEFAULT OPCIONAL
===================================================== */

const obrasService = {
  getObras,
  getObraById,
  createObra,
  updateObra,
  deleteObra,
};

export default obrasService;
