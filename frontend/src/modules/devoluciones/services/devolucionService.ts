import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export type EstadoPenalidad =
  | "sin_penalidad"
  | "pendiente"
  | "parcial"
  | "pagada";

/* =====================================================
   DEVOLUCIÓN
===================================================== */

export interface Devolucion {
  id: string;

  contrato_id: string;

  numero_contrato: string;

  cliente: string;

  fecha_devolucion: string;

  dias_retraso: number;

  /* =============================================
     CONTRATO
  ============================================= */

  valor_contrato: number;

  contrato_pagado: number;

  saldo_pendiente: number;

  estado_contrato: string;

  /* =============================================
     PENALIDAD
  ============================================= */

  penalidad_total: number;

  penalidad_pagada: number;

  penalidad_pendiente: number;

  estado_penalidad: EstadoPenalidad;

  /* =============================================
     TOTALES
  ============================================= */

  total_generado: number;

  total_cobrado: number;
}

/* =====================================================
   RESUMEN GENERAL
===================================================== */

export interface ResumenDevoluciones {
  total_devoluciones: number;

  sin_retraso: number;

  con_retraso: number;

  penalidades_generadas: number;

  penalidades_cobradas: number;

  penalidades_pendientes: number;

  total_generado: number;
}

/* =====================================================
   PAYLOAD REGISTRAR DEVOLUCIÓN
===================================================== */

export interface RegistrarDevolucionPayload {
  contrato_id: string;

  fecha_devolucion: string;
}

/* =====================================================
   RESPUESTA REGISTRAR
===================================================== */

export interface RegistrarDevolucionResponse {
  id: string;

  contrato_id: string;

  fecha_devolucion: string;

  dias_retraso: number;

  penalidad_total: number;

  numero_contrato?: string;

  valor_contrato?: number;

  total_generado?: number;

  mensaje?: string;

  contrato?: {
    id: string;

    numero_contrato: string;

    estado: string;

    total: number | string;

    pagado: number | string;

    saldo_pendiente: number | string;
  };
}

/* =====================================================
   HELPER - NORMALIZAR NÚMERO
===================================================== */

const numero = (valor: number | string | null | undefined): number => {
  const convertido = Number(valor ?? 0);

  return Number.isFinite(convertido) ? convertido : 0;
};

/* =====================================================
   NORMALIZAR DEVOLUCIÓN
===================================================== */

const normalizarDevolucion = (data: Record<string, unknown>): Devolucion => {
  return {
    id: String(data.id ?? ""),

    contrato_id: String(data.contrato_id ?? ""),

    numero_contrato: String(data.numero_contrato ?? ""),

    cliente: String(data.cliente ?? ""),

    fecha_devolucion: String(data.fecha_devolucion ?? ""),

    dias_retraso: numero(
      data.dias_retraso as number | string | null | undefined,
    ),

    valor_contrato: numero(
      data.valor_contrato as number | string | null | undefined,
    ),

    contrato_pagado: numero(
      data.contrato_pagado as number | string | null | undefined,
    ),

    saldo_pendiente: numero(
      data.saldo_pendiente as number | string | null | undefined,
    ),

    estado_contrato: String(data.estado_contrato ?? ""),

    penalidad_total: numero(
      data.penalidad_total as number | string | null | undefined,
    ),

    penalidad_pagada: numero(
      data.penalidad_pagada as number | string | null | undefined,
    ),

    penalidad_pendiente: numero(
      data.penalidad_pendiente as number | string | null | undefined,
    ),

    estado_penalidad: (data.estado_penalidad ??
      "sin_penalidad") as EstadoPenalidad,

    total_generado: numero(
      data.total_generado as number | string | null | undefined,
    ),

    total_cobrado: numero(
      data.total_cobrado as number | string | null | undefined,
    ),
  };
};

/* =====================================================
   GET DEVOLUCIONES
===================================================== */

export const getDevoluciones = async (): Promise<Devolucion[]> => {
  const response = await api.get("/devoluciones");

  const data = response.data?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item: Record<string, unknown>) =>
    normalizarDevolucion(item),
  );
};

/* =====================================================
   GET DEVOLUCIÓN POR ID
===================================================== */

export const getDevolucionById = async (id: string): Promise<Devolucion> => {
  const response = await api.get(`/devoluciones/${id}`);

  return normalizarDevolucion(response.data?.data ?? {});
};

/* =====================================================
   GET RESUMEN GENERAL
===================================================== */

export const getResumenDevoluciones =
  async (): Promise<ResumenDevoluciones> => {
    const response = await api.get("/devoluciones/resumen");

    const data = response.data?.data ?? {};

    return {
      total_devoluciones: numero(data.total_devoluciones),

      sin_retraso: numero(data.sin_retraso),

      con_retraso: numero(data.con_retraso),

      penalidades_generadas: numero(data.penalidades_generadas),

      penalidades_cobradas: numero(data.penalidades_cobradas),

      penalidades_pendientes: numero(data.penalidades_pendientes),

      total_generado: numero(data.total_generado),
    };
  };

/* =====================================================
   REGISTRAR DEVOLUCIÓN
===================================================== */

export const registrarDevolucion = async (
  data: RegistrarDevolucionPayload,
): Promise<RegistrarDevolucionResponse> => {
  const response = await api.post("/devoluciones", data);

  const result = response.data?.data;

  return {
    ...result,

    dias_retraso: numero(result?.dias_retraso),

    penalidad_total: numero(result?.penalidad_total),

    valor_contrato:
      result?.valor_contrato !== undefined
        ? numero(result.valor_contrato)
        : undefined,

    total_generado:
      result?.total_generado !== undefined
        ? numero(result.total_generado)
        : undefined,
  };
};

/* =====================================================
   DESCARGAR NOTA PDF
===================================================== */

/*
 * Esta función pertenece al flujo histórico
 * de notas de venta.
 *
 * La mantenemos para no romper ningún componente
 * que todavía pueda estar utilizándola.
 *
 * No forma parte directamente del nuevo flujo
 * financiero de penalidades.
 */

export const descargarNotaPDF = async (id: string): Promise<Blob> => {
  const response = await api.get(`/notas/${id}/pdf`, {
    responseType: "blob",
  });

  return response.data;
};

/* =====================================================
   DEFAULT SERVICE
===================================================== */

const devolucionService = {
  getDevoluciones,

  getDevolucionById,

  getResumenDevoluciones,

  registrarDevolucion,

  descargarNotaPDF,
};

export default devolucionService;
