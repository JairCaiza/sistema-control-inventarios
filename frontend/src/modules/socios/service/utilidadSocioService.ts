import { api } from "../../../services/api";

/* =====================================================
   TIPOS GENERALES
===================================================== */

export type EstadoUtilidad = "pendiente" | "pagado" | "anulado";

export type MetodoPagoUtilidad =
  | "efectivo"
  | "transferencia"
  | "deposito"
  | "cheque";

/* =====================================================
   UTILIDAD DEL PERIODO
===================================================== */

export interface UtilidadPeriodo {
  periodo: string;

  fecha_inicio: string;

  fecha_fin: string;

  total_ingresos: number;

  total_egresos: number;

  utilidad: number;
}

/* =====================================================
   SOCIO EN CÁLCULO
===================================================== */

export interface SocioCalculoUtilidad {
  socio_id: string;

  nombre: string;

  identificacion: string;

  total_aportes: number;

  total_retiros: number;

  capital_neto: number;

  porcentaje_participacion: number;

  monto_estimado: number;
}

/* =====================================================
   CÁLCULO / SIMULACIÓN
===================================================== */

export interface CalculoDistribucion {
  periodo: string;

  total_ingresos: number;

  total_egresos: number;

  utilidad_periodo: number;

  monto_distribuir: number;

  capital_total: number;

  total_socios: number;

  socios: SocioCalculoUtilidad[];
}

/* =====================================================
   DISTRIBUCIÓN GUARDADA
===================================================== */

export interface DistribucionUtilidad {
  id: string;

  socio_id: string;

  socio_nombre: string;

  socio_identificacion?: string | null;

  periodo: string;

  utilidad_periodo: number;

  utilidad_base: number;

  porcentaje_aplicado: number;

  monto: number;

  estado: EstadoUtilidad;

  cuenta_id?: string | null;

  cuenta_nombre?: string | null;

  cuenta_tipo?: string | null;

  metodo_pago?: MetodoPagoUtilidad | null;

  referencia?: string | null;

  fecha_pago?: string | null;

  transaccion_id?: string | null;

  observaciones?: string | null;

  fecha_creacion?: string;

  fecha_actualizacion?: string;

  capital_neto?: number;
}

/* =====================================================
   GENERAR DISTRIBUCIÓN
===================================================== */

export interface GenerarDistribucionData {
  periodo: string;

  monto_distribuir: number;

  observaciones?: string | null;
}

export interface ResultadoGenerarDistribucion {
  periodo: string;

  total_ingresos: number;

  total_egresos: number;

  utilidad_periodo: number;

  monto_distribuido: number;

  capital_total: number;

  total_socios: number;

  distribuciones: DistribucionUtilidad[];
}

/* =====================================================
   PAGAR UTILIDAD
===================================================== */

export interface PagarUtilidadData {
  cuenta_id: string;

  fecha_pago: string;

  metodo_pago: MetodoPagoUtilidad;

  referencia?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   FILTROS
===================================================== */

export interface FiltrosUtilidades {
  periodo?: string;

  socio_id?: string;

  estado?: EstadoUtilidad | "";

  fecha_desde?: string;

  fecha_hasta?: string;
}

/* =====================================================
   RESUMEN
===================================================== */

export interface ResumenUtilidades {
  total_distribuido: number;

  total_pagado: number;

  total_pendiente: number;

  cantidad_pagadas: number;

  cantidad_pendientes: number;
}

/* =====================================================
   RESPUESTAS BACKEND
===================================================== */

interface DataResponse<T> {
  ok: boolean;

  message?: string;

  data: T;
}

interface ListaResponse {
  ok: boolean;

  total: number;

  data: DistribucionUtilidad[];
}

/* =====================================================
   NORMALIZADORES
===================================================== */

const normalizarDistribucion = (
  distribucion: DistribucionUtilidad,
): DistribucionUtilidad => {
  return {
    ...distribucion,

    utilidad_periodo: Number(distribucion.utilidad_periodo || 0),

    utilidad_base: Number(distribucion.utilidad_base || 0),

    porcentaje_aplicado: Number(distribucion.porcentaje_aplicado || 0),

    monto: Number(distribucion.monto || 0),

    capital_neto:
      distribucion.capital_neto !== undefined
        ? Number(distribucion.capital_neto || 0)
        : undefined,
  };
};

const normalizarUtilidadPeriodo = (data: UtilidadPeriodo): UtilidadPeriodo => ({
  ...data,

  total_ingresos: Number(data.total_ingresos || 0),

  total_egresos: Number(data.total_egresos || 0),

  utilidad: Number(data.utilidad || 0),
});

const normalizarCalculo = (data: CalculoDistribucion): CalculoDistribucion => ({
  ...data,

  total_ingresos: Number(data.total_ingresos || 0),

  total_egresos: Number(data.total_egresos || 0),

  utilidad_periodo: Number(data.utilidad_periodo || 0),

  monto_distribuir: Number(data.monto_distribuir || 0),

  capital_total: Number(data.capital_total || 0),

  total_socios: Number(data.total_socios || 0),

  socios: (data.socios || []).map((socio) => ({
    ...socio,

    total_aportes: Number(socio.total_aportes || 0),

    total_retiros: Number(socio.total_retiros || 0),

    capital_neto: Number(socio.capital_neto || 0),

    porcentaje_participacion: Number(socio.porcentaje_participacion || 0),

    monto_estimado: Number(socio.monto_estimado || 0),
  })),
});

/* =====================================================
   CONSULTAR UTILIDAD DEL PERIODO
===================================================== */

/*
 * GET
 *
 * /api/utilidades-socios/utilidad
 * ?periodo=2026-07
 */
export const getUtilidadPeriodo = async (
  periodo: string,
): Promise<UtilidadPeriodo> => {
  const response = await api.get<DataResponse<UtilidadPeriodo>>(
    "/utilidades-socios/utilidad",
    {
      params: {
        periodo,
      },
    },
  );

  return normalizarUtilidadPeriodo(response.data.data);
};

/* =====================================================
   CALCULAR / SIMULAR DISTRIBUCIÓN
===================================================== */

/*
 * NO GUARDA NADA.
 */
export const calcularDistribucionUtilidad = async (
  periodo: string,
  montoDistribuir?: number,
): Promise<CalculoDistribucion> => {
  const params: Record<string, string | number> = {
    periodo,
  };

  if (montoDistribuir !== undefined) {
    params.monto_distribuir = montoDistribuir;
  }

  const response = await api.get<DataResponse<CalculoDistribucion>>(
    "/utilidades-socios/calculo",
    {
      params,
    },
  );

  return normalizarCalculo(response.data.data);
};

/* =====================================================
   GENERAR DISTRIBUCIÓN REAL
===================================================== */

export const generarDistribucionUtilidad = async (
  data: GenerarDistribucionData,
): Promise<ResultadoGenerarDistribucion> => {
  const response = await api.post<DataResponse<ResultadoGenerarDistribucion>>(
    "/utilidades-socios/generar",
    {
      periodo: data.periodo,

      monto_distribuir: Number(data.monto_distribuir),

      observaciones: data.observaciones?.trim() || null,
    },
  );

  const resultado = response.data.data;

  return {
    ...resultado,

    total_ingresos: Number(resultado.total_ingresos || 0),

    total_egresos: Number(resultado.total_egresos || 0),

    utilidad_periodo: Number(resultado.utilidad_periodo || 0),

    monto_distribuido: Number(resultado.monto_distribuido || 0),

    capital_total: Number(resultado.capital_total || 0),

    total_socios: Number(resultado.total_socios || 0),

    distribuciones: (resultado.distribuciones || []).map(
      normalizarDistribucion,
    ),
  };
};

/* =====================================================
   LISTAR DISTRIBUCIONES
===================================================== */

export const getDistribucionesUtilidades = async (
  filtros: FiltrosUtilidades = {},
): Promise<DistribucionUtilidad[]> => {
  const params: Record<string, string> = {};

  if (filtros.periodo) {
    params.periodo = filtros.periodo;
  }

  if (filtros.socio_id) {
    params.socio_id = filtros.socio_id;
  }

  if (filtros.estado) {
    params.estado = filtros.estado;
  }

  if (filtros.fecha_desde) {
    params.fecha_desde = filtros.fecha_desde;
  }

  if (filtros.fecha_hasta) {
    params.fecha_hasta = filtros.fecha_hasta;
  }

  const response = await api.get<ListaResponse>("/utilidades-socios", {
    params,
  });

  return (response.data.data ?? []).map(normalizarDistribucion);
};

/* =====================================================
   OBTENER DISTRIBUCIÓN POR ID
===================================================== */

export const getDistribucionUtilidadById = async (
  id: string,
): Promise<DistribucionUtilidad> => {
  const response = await api.get<DataResponse<DistribucionUtilidad>>(
    `/utilidades-socios/${id}`,
  );

  return normalizarDistribucion(response.data.data);
};

/* =====================================================
   PAGAR UTILIDAD
===================================================== */

export const pagarDistribucionUtilidad = async (
  id: string,
  data: PagarUtilidadData,
): Promise<DistribucionUtilidad> => {
  const response = await api.post<DataResponse<DistribucionUtilidad>>(
    `/utilidades-socios/${id}/pagar`,
    {
      cuenta_id: data.cuenta_id,

      fecha_pago: data.fecha_pago,

      metodo_pago: data.metodo_pago,

      referencia: data.referencia?.trim() || null,

      observaciones: data.observaciones?.trim() || null,
    },
  );

  return normalizarDistribucion(response.data.data);
};

/* =====================================================
   ANULAR DISTRIBUCIÓN
===================================================== */

export const anularDistribucionUtilidad = async (
  id: string,
): Promise<DistribucionUtilidad> => {
  const response = await api.patch<DataResponse<DistribucionUtilidad>>(
    `/utilidades-socios/${id}/anular`,
  );

  return normalizarDistribucion(response.data.data);
};

/* =====================================================
   OBTENER RESUMEN
===================================================== */

export const getResumenUtilidades = async (
  periodo?: string,
): Promise<ResumenUtilidades> => {
  const response = await api.get<DataResponse<ResumenUtilidades>>(
    "/utilidades-socios/resumen",
    {
      params: periodo
        ? {
            periodo,
          }
        : undefined,
    },
  );

  const data = response.data.data;

  return {
    total_distribuido: Number(data.total_distribuido || 0),

    total_pagado: Number(data.total_pagado || 0),

    total_pendiente: Number(data.total_pendiente || 0),

    cantidad_pagadas: Number(data.cantidad_pagadas || 0),

    cantidad_pendientes: Number(data.cantidad_pendientes || 0),
  };
};

/* =====================================================
   EXPORTACIÓN AGRUPADA
===================================================== */

export const utilidadSocioService = {
  getUtilidadPeriodo,
  calcularDistribucionUtilidad,
  generarDistribucionUtilidad,
  getDistribucionesUtilidades,
  getDistribucionUtilidadById,
  pagarDistribucionUtilidad,
  anularDistribucionUtilidad,
  getResumenUtilidades,
};
