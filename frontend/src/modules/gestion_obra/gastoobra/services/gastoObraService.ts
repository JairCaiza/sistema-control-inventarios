import api from "../../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export type EstadoGastoObra = "pendiente" | "pagado" | "anulado";

export type TipoGastoObra =
  | "materiales"
  | "transporte"
  | "alimentacion"
  | "combustible"
  | "herramientas"
  | "servicios"
  | "mantenimiento"
  | "administrativo"
  | "otro";

export type MetodoPagoGasto =
  | "efectivo"
  | "transferencia"
  | "deposito"
  | "cheque";

/* =====================================================
   INTERFACE GASTO
===================================================== */

export interface GastoObra {
  id: string;

  obra_id: string;
  control_diario_id?: string | null;
  cuenta_id?: string | null;
  transaccion_id?: string | null;

  tipo: TipoGastoObra;

  descripcion: string;

  monto: number | string;

  fecha: string;

  fecha_pago?: string | null;

  metodo_pago?: MetodoPagoGasto | null;

  estado: EstadoGastoObra;

  referencia?: string | null;

  observaciones?: string | null;

  fecha_creacion?: string;
  fecha_actualizacion?: string;

  /* =================================================
       DATOS RELACIONADOS
    ================================================= */

  obra_codigo?: string;
  obra_nombre?: string;
  obra_estado?: string;
  obra_presupuesto?: number | string;

  obra_fecha_inicio?: string;
  obra_fecha_fin?: string;

  control_diario_fecha?: string | null;
  control_diario_actividad?: string | null;
  control_diario_descripcion?: string | null;

  cuenta_nombre?: string | null;
  cuenta_tipo?: string | null;

  transaccion_tipo?: string | null;
  transaccion_monto?: number | string | null;
  transaccion_fecha?: string | null;
  transaccion_descripcion?: string | null;
  transaccion_origen_modulo?: string | null;
  transaccion_origen_id?: string | null;
}

/* =====================================================
   CREAR GASTO
===================================================== */

export interface CrearGastoObraPayload {
  obra_id: string;

  control_diario_id?: string | null;

  tipo: TipoGastoObra;

  descripcion: string;

  monto: number;

  fecha: string;

  referencia?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   ACTUALIZAR GASTO
===================================================== */

export interface ActualizarGastoObraPayload {
  obra_id?: string;

  control_diario_id?: string | null;

  tipo?: TipoGastoObra;

  descripcion?: string;

  monto?: number;

  fecha?: string;

  referencia?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   CONFIRMAR GASTO
===================================================== */

export interface ConfirmarGastoObraPayload {
  cuenta_id: string;

  fecha_pago: string;

  metodo_pago: MetodoPagoGasto;

  referencia?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   ANULAR GASTO
===================================================== */

export interface AnularGastoObraPayload {
  motivo: string;
}

/* =====================================================
   FILTROS
===================================================== */

export interface FiltrosGastosObra {
  obra_id?: string;

  control_diario_id?: string;

  cuenta_id?: string;

  estado?: EstadoGastoObra | "";

  tipo?: TipoGastoObra | "";

  fecha_desde?: string;

  fecha_hasta?: string;

  buscar?: string;

  page?: number;

  limit?: number;
}

/* =====================================================
   PAGINACIÓN
===================================================== */

export interface PaginacionGastosObra {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* =====================================================
   RESPONSE LISTADO
===================================================== */

export interface ListarGastosObraResponse {
  success: boolean;

  message: string;

  data: GastoObra[];

  pagination: PaginacionGastosObra;
}

/* =====================================================
   RESPONSE INDIVIDUAL
===================================================== */

export interface GastoObraResponse {
  success: boolean;

  message: string;

  data: GastoObra;
}

/* =====================================================
   TRANSACCIÓN FINANCIERA
===================================================== */

export interface TransaccionGasto {
  id: string;

  cuenta_id: string;

  tipo: "ingreso" | "egreso" | "transferencia";

  monto: number | string;

  descripcion?: string | null;

  fecha: string;

  referencia_id?: string | null;

  obra_id?: string | null;

  control_diario_id?: string | null;

  origen_modulo?: string | null;

  origen_id?: string | null;

  fecha_creacion?: string;
}

/* =====================================================
   CUENTA FINANCIERA
===================================================== */

export interface CuentaFinancieraMovimiento {
  id: string;

  nombre: string;

  tipo: string;

  saldo_actual: number | string;

  activo: boolean;
}

/* =====================================================
   CONFIRMACIÓN RESPONSE
===================================================== */

export interface ConfirmarGastoObraResponse {
  success: boolean;

  message: string;

  data: {
    gasto: GastoObra;

    cuenta: CuentaFinancieraMovimiento;

    transaccion: TransaccionGasto;
  };
}

/* =====================================================
   ANULACIÓN RESPONSE
===================================================== */

export interface AnularGastoObraResponse {
  success: boolean;

  message: string;

  data: {
    gasto: GastoObra;

    cuenta?: CuentaFinancieraMovimiento;

    transaccion_original?: TransaccionGasto;

    reversion?: TransaccionGasto | null;
  };
}

/* =====================================================
   RESUMEN GENERAL
===================================================== */

export interface ResumenGastos {
  total_registros: number;

  obras_con_gastos: number;

  gastos_pendientes: number;

  gastos_pagados: number;

  gastos_anulados: number;

  total_pagado: number | string;

  total_pendiente: number | string;
}

export interface DistribucionTipoGasto {
  tipo: string;

  cantidad: number;

  total: number | string;
}

export interface DistribucionObraGasto {
  obra_id: string;

  obra_codigo: string;

  obra_nombre: string;

  cantidad_gastos: number;

  total: number | string;
}

export interface ResumenGastosResponse {
  success: boolean;

  message: string;

  data: {
    resumen: ResumenGastos;

    distribucion_tipos: DistribucionTipoGasto[];

    distribucion_obras: DistribucionObraGasto[];
  };
}

/* =====================================================
   REPORTE POR OBRA
===================================================== */

export interface ReporteGastosObra {
  obra: {
    id: string;

    codigo: string;

    nombre: string;

    estado?: string;

    presupuesto?: number | string;

    fecha_inicio?: string;

    fecha_fin?: string;
  };

  resumen: {
    total_registros: number;

    gastos_pendientes: number;

    gastos_pagados: number;

    gastos_anulados: number;

    total_pagado: number | string;

    total_pendiente: number | string;

    presupuesto: number;

    total_gastos: number;

    presupuesto_restante: number;

    porcentaje_ejecutado: number;
  };

  distribucion_tipos: DistribucionTipoGasto[];

  gastos: GastoObra[];
}

export interface ReporteGastosObraResponse {
  success: boolean;

  message: string;

  data: ReporteGastosObra;
}

/* =====================================================
   HELPERS
===================================================== */

const limpiarParametros = (params: Record<string, unknown>) => {
  const resultado: Record<string, unknown> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      resultado[key] = value;
    }
  });

  return resultado;
};

/* =====================================================
   CREAR GASTO
===================================================== */

export const crearGastoObra = async (
  payload: CrearGastoObraPayload,
): Promise<GastoObra> => {
  const response = await api.post<GastoObraResponse>("/gastos-obra", payload);

  return response.data.data;
};

/* =====================================================
   LISTAR GASTOS
===================================================== */

export const listarGastosObra = async (
  filtros: FiltrosGastosObra = {},
): Promise<ListarGastosObraResponse> => {
  const params = limpiarParametros(
    filtros as unknown as Record<string, unknown>,
  );

  const response = await api.get<ListarGastosObraResponse>("/gastos-obra", {
    params,
  });

  return response.data;
};

/* =====================================================
   OBTENER POR ID
===================================================== */

export const obtenerGastoObraPorId = async (id: string): Promise<GastoObra> => {
  const response = await api.get<GastoObraResponse>(`/gastos-obra/${id}`);

  return response.data.data;
};

/* =====================================================
   ACTUALIZAR
===================================================== */

export const actualizarGastoObra = async (
  id: string,
  payload: ActualizarGastoObraPayload,
): Promise<GastoObra> => {
  const response = await api.put<GastoObraResponse>(
    `/gastos-obra/${id}`,
    payload,
  );

  return response.data.data;
};

/* =====================================================
   CONFIRMAR
===================================================== */

export const confirmarGastoObra = async (
  id: string,
  payload: ConfirmarGastoObraPayload,
): Promise<ConfirmarGastoObraResponse["data"]> => {
  const response = await api.patch<ConfirmarGastoObraResponse>(
    `/gastos-obra/${id}/confirmar`,
    payload,
  );

  return response.data.data;
};

/* =====================================================
   ANULAR
===================================================== */

export const anularGastoObra = async (
  id: string,
  payload: AnularGastoObraPayload,
): Promise<AnularGastoObraResponse["data"]> => {
  const response = await api.patch<AnularGastoObraResponse>(
    `/gastos-obra/${id}/anular`,
    payload,
  );

  return response.data.data;
};

/* =====================================================
   RESUMEN GENERAL
===================================================== */

export const obtenerResumenGastos = async (
  filtros: {
    obra_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {},
): Promise<ResumenGastosResponse["data"]> => {
  const params = limpiarParametros(filtros);

  const response = await api.get<ResumenGastosResponse>(
    "/gastos-obra/resumen",
    {
      params,
    },
  );

  return response.data.data;
};

/* =====================================================
   REPORTE POR OBRA
===================================================== */

export const obtenerReporteGastosPorObra = async (
  obraId: string,
  filtros: {
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {},
): Promise<ReporteGastosObra> => {
  const params = limpiarParametros(filtros);

  const response = await api.get<ReporteGastosObraResponse>(
    `/gastos-obra/reportes/obra/${obraId}`,
    {
      params,
    },
  );

  return response.data.data;
};

/* =====================================================
   EXPORT AGRUPADO
===================================================== */

const gastoObraService = {
  crearGastoObra,

  listarGastosObra,

  obtenerGastoObraPorId,

  actualizarGastoObra,

  confirmarGastoObra,

  anularGastoObra,

  obtenerResumenGastos,

  obtenerReporteGastosPorObra,
};

export default gastoObraService;
