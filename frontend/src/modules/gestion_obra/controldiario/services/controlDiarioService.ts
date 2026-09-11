import { api } from "../../../../services/api";

/* =====================================================
   CONTROL DIARIO
===================================================== */

export interface ControlDiario {
  id?: string;

  obra_id: string;

  /*
   * Estos campos existen cuando usamos
   * el endpoint general que hace JOIN con obras.
   */
  obra_codigo?: string | null;

  obra_nombre?: string | null;

  fecha: string;

  actividad: string;

  descripcion?: string | null;

  hora_inicio?: string | null;

  hora_fin?: string | null;

  avance?: number | null;

  observaciones?: string | null;

  clima?: string | null;
}

/* =====================================================
   PAYLOAD CREAR CONTROL
===================================================== */

export interface CrearControlDiarioPayload {
  obra_id: string;

  fecha: string;

  actividad: string;

  descripcion?: string | null;

  hora_inicio?: string | null;

  hora_fin?: string | null;

  avance?: number;

  observaciones?: string | null;

  clima?: string | null;
}

/* =====================================================
   RESPUESTA API
===================================================== */

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/* =====================================================
   REGISTRAR CONTROL
===================================================== */

export const registrarControlDiario = async (
  data: CrearControlDiarioPayload,
): Promise<ControlDiario> => {
  const response = await api.post<ApiResponse<ControlDiario>>(
    "/obras/controles-diarios",
    data,
  );

  return response.data.data;
};

/* =====================================================
   LISTAR TODOS LOS CONTROLES
===================================================== */

export const getControlesDiarios = async (): Promise<ControlDiario[]> => {
  const response = await api.get<ApiResponse<ControlDiario[]>>(
    "/obras/controles-diarios",
  );

  return Array.isArray(response.data.data) ? response.data.data : [];
};

/* =====================================================
   LISTAR CONTROLES POR OBRA
===================================================== */

export const getControlesDiariosPorObra = async (
  obraId: string,
): Promise<ControlDiario[]> => {
  const response = await api.get<ApiResponse<ControlDiario[]>>(
    `/obras/controles-diarios/${obraId}`,
  );

  return Array.isArray(response.data.data) ? response.data.data : [];
};

/* =====================================================
   EXPORT
===================================================== */

const controlDiarioService = {
  registrarControlDiario,
  getControlesDiarios,
  getControlesDiariosPorObra,
};

export default controlDiarioService;
