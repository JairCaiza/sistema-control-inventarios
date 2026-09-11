import api from "../../../../services/api";

/* =====================================================
   TIPOS GENERALES
===================================================== */

export type EstadoObra =
  | "planificada"
  | "en_proceso"
  | "pausada"
  | "finalizada"
  | "cancelada";

export type EstadoGastoObra = "pendiente" | "pagado" | "anulado";

export type TipoTransaccion = "ingreso" | "egreso" | "transferencia";

export type AgrupacionCostos = "dia" | "semana" | "mes";

/* =====================================================
   PAGINACIÓN
===================================================== */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* =====================================================
   OBRA
===================================================== */

export interface ObraReporte {
  id: string;
  codigo: string;
  nombre: string;
  ubicacion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  presupuesto: number | string;
  estado: EstadoObra;
  cliente_id?: string | null;
  cliente_nombre?: string | null;
}

/* =====================================================
   RESUMEN GENERAL
===================================================== */

export interface ResumenGeneralObras {
  total_obras: number;
  planificadas: number;
  en_proceso: number;
  pausadas: number;
  finalizadas: number;
  canceladas: number;
  presupuesto_total: number | string;
}

export interface ObraResumenItem {
  id: string;
  codigo: string;
  nombre: string;
  ubicacion?: string | null;
  estado: EstadoObra;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  presupuesto: number | string;

  cliente_id?: string | null;
  cliente_nombre?: string | null;

  gastos_pagados: number | string;
  gastos_pendientes: number | string;
  pagos_personal: number | string;

  controles_registrados: number;
  empleados_activos: number;
}

export interface FiltrosResumenGeneral {
  estado?: EstadoObra;
  fecha_desde?: string;
  fecha_hasta?: string;
  buscar?: string;
  page?: number;
  limit?: number;
}

export interface ResumenGeneralResponse {
  success: boolean;
  message: string;
  resumen: ResumenGeneralObras;
  data: ObraResumenItem[];
  pagination: Pagination;
}

/* =====================================================
   RESUMEN FINANCIERO DE OBRA
===================================================== */

export interface ResumenFinancieroObra {
  presupuesto: number;
  gastos_pagados: number;
  gastos_pendientes: number;
  pagos_personal: number;

  total_ejecutado: number;
  total_comprometido: number;

  presupuesto_disponible: number;
  presupuesto_disponible_comprometido: number;

  porcentaje_ejecutado: number;
  porcentaje_comprometido: number;

  ingresos: number;
  egresos: number;
  flujo_neto: number;
}

/* =====================================================
   GASTOS
===================================================== */

export interface GastoReporte {
  id: string;
  obra_id: string;

  control_diario_id?: string | null;

  tipo: string;
  descripcion: string;

  monto: number | string;
  fecha: string;

  cuenta_id?: string | null;
  transaccion_id?: string | null;

  fecha_pago?: string | null;
  metodo_pago?: string | null;

  estado: EstadoGastoObra;

  referencia?: string | null;
  observaciones?: string | null;

  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;

  cuenta_nombre?: string | null;
  cuenta_tipo?: string | null;

  control_fecha?: string | null;
  control_actividad?: string | null;
  control_descripcion?: string | null;

  transaccion_tipo?: TipoTransaccion | null;
  transaccion_fecha?: string | null;
  transaccion_descripcion?: string | null;

  origen_modulo?: string | null;
  origen_id?: string | null;
}

export interface ResumenGastosObra {
  total_registros: number;
  pendientes: number;
  pagados: number;
  anulados: number;

  total_pagado: number | string;
  total_pendiente: number | string;
}

export interface DistribucionGasto {
  tipo: string;
  cantidad: number;
  total: number | string;
}

export interface FiltrosGastosObra {
  estado?: EstadoGastoObra;
  tipo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  buscar?: string;
  page?: number;
  limit?: number;
}

export interface GastosObraResponse {
  success: boolean;
  message: string;
  resumen: ResumenGastosObra;
  distribucion: DistribucionGasto[];
  data: GastoReporte[];
  pagination: Pagination;
}

/* =====================================================
   PERSONAL
===================================================== */

export interface PersonalReporte {
  asignacion_id: string;
  obra_id: string;
  empleado_id: string;

  fecha_asignacion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;

  cargo_obra?: string | null;
  salario_acordado?: number | string | null;

  activo: boolean;
  observaciones?: string | null;

  cedula: string;
  nombres: string;
  apellidos: string;

  telefono?: string | null;
  correo?: string | null;
  cargo?: string | null;
  tipo_pago?: string | null;
  salario_base?: number | string | null;

  total_pagado: number | string;
  cantidad_pagos: number;
}

export interface ResumenPersonalObra {
  empleados_asignados: number;
  empleados_activos: number;
  total_pagado_personal: number | string;
}

export interface FiltrosPersonalObra {
  activo?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  buscar?: string;
  page?: number;
  limit?: number;
}

export interface PersonalObraResponse {
  success: boolean;
  message: string;
  resumen: ResumenPersonalObra;
  data: PersonalReporte[];
  pagination: Pagination;
}

/* =====================================================
   CONTROLES DIARIOS
===================================================== */

export interface ControlDiarioReporte {
  id: string;
  obra_id: string;

  fecha?: string | null;
  actividad?: string | null;
  descripcion?: string | null;

  horas?: number | string | null;
  avance?: number | string | null;
  clima?: string | null;

  gastos_pagados?: number | string;
  gastos_pendientes?: number | string;

  [key: string]: unknown;
}

export interface FiltrosControlesObra {
  fecha_desde?: string;
  fecha_hasta?: string;
  buscar?: string;
  page?: number;
  limit?: number;
}

export interface ControlesObraResponse {
  success: boolean;
  message: string;
  data: ControlDiarioReporte[];
  pagination: Pagination;
}

/* =====================================================
   FINANZAS
===================================================== */

export interface TransaccionReporte {
  id: string;

  cuenta_id?: string | null;

  tipo: TipoTransaccion;

  monto: number | string;
  descripcion?: string | null;

  fecha: string;
  referencia_id?: string | null;

  fecha_creacion?: string | null;

  obra_id?: string | null;
  control_diario_id?: string | null;

  origen_modulo?: string | null;
  origen_id?: string | null;

  cuenta_nombre?: string | null;
  cuenta_tipo?: string | null;
}

export interface ResumenFinanzasObra {
  ingresos: number | string;
  egresos: number | string;

  cantidad_ingresos: number;
  cantidad_egresos: number;

  flujo_neto: number;
}

export interface FiltrosFinanzasObra {
  tipo?: TipoTransaccion;
  origen_modulo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  buscar?: string;
  page?: number;
  limit?: number;
}

export interface FinanzasObraResponse {
  success: boolean;
  message: string;
  resumen: ResumenFinanzasObra;
  data: TransaccionReporte[];
  pagination: Pagination;
}

/* =====================================================
   EVOLUCIÓN DE COSTOS
===================================================== */

export interface EvolucionCostoItem {
  periodo: string;
  total: number | string;
  gastos_obra: number | string;
  pagos_personal: number | string;
}

export interface FiltrosEvolucionCostos {
  fecha_desde?: string;
  fecha_hasta?: string;
  agrupar_por?: AgrupacionCostos;
}

export interface EvolucionCostosResponse {
  success: boolean;
  message: string;
  agrupar_por: AgrupacionCostos;
  data: EvolucionCostoItem[];
}

/* =====================================================
   PRESUPUESTO
===================================================== */

export interface PresupuestoObraData {
  obra: {
    id: string;
    codigo: string;
    nombre: string;
    estado: EstadoObra;
    presupuesto: number;
  };

  gastos_pagados: number;
  gastos_pendientes: number;
  pagos_personal: number;

  total_ejecutado: number;
  total_comprometido: number;

  saldo_presupuesto: number;
  saldo_presupuesto_comprometido: number;

  porcentaje_ejecutado: number;
  porcentaje_comprometido: number;
}

export interface FiltrosPresupuestoObra {
  fecha_desde?: string;
  fecha_hasta?: string;
  incluir_pendientes?: boolean;
}

export interface PresupuestoObraResponse {
  success: boolean;
  message: string;
  data: PresupuestoObraData;
}

/* =====================================================
   REPORTE COMPLETO
===================================================== */

export interface ReporteObraCompleto {
  obra: ObraReporte;

  resumen_financiero: ResumenFinancieroObra;

  gastos: {
    resumen: ResumenGastosObra;
    distribucion: DistribucionGasto[];
    data: GastoReporte[];
    pagination: Pagination;
  } | null;

  personal: {
    resumen: ResumenPersonalObra;
    data: PersonalReporte[];
    pagination: Pagination;
  } | null;

  controles: {
    data: ControlDiarioReporte[];
    pagination: Pagination;
  } | null;

  finanzas: {
    resumen: ResumenFinanzasObra;
    data: TransaccionReporte[];
    pagination: Pagination;
  } | null;
}

export interface FiltrosReporteObra {
  fecha_desde?: string;
  fecha_hasta?: string;

  incluir_gastos?: boolean;
  incluir_personal?: boolean;
  incluir_controles?: boolean;
  incluir_finanzas?: boolean;
}

export interface ReporteObraResponse {
  success: boolean;
  message: string;
  data: ReporteObraCompleto;
}

/* =====================================================
   HELPERS
===================================================== */

const limpiarParams = <T extends object>(params: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ) as Partial<T>;
};

/* =====================================================
   SERVICE
===================================================== */

const reporteObraService = {
  /* =================================================
       RESUMEN GENERAL
    ================================================= */

  obtenerResumenGeneral: async (
    filtros: FiltrosResumenGeneral = {},
  ): Promise<ResumenGeneralResponse> => {
    const response = await api.get<ResumenGeneralResponse>(
      "/reportes-obras/resumen",
      {
        params: limpiarParams(filtros),
      },
    );

    return response.data;
  },

  /* =================================================
       REPORTE COMPLETO POR OBRA
    ================================================= */

  obtenerReporteObra: async (
    obraId: string,
    filtros: FiltrosReporteObra = {},
  ): Promise<ReporteObraResponse> => {
    const response = await api.get<ReporteObraResponse>(
      `/reportes-obras/obra/${obraId}`,
      {
        params: limpiarParams(filtros),
      },
    );

    return response.data;
  },

  /* =================================================
       GASTOS POR OBRA
    ================================================= */

  obtenerGastosPorObra: async (
    obraId: string,
    filtros: FiltrosGastosObra = {},
  ): Promise<GastosObraResponse> => {
    const response = await api.get<GastosObraResponse>(
      `/reportes-obras/obra/${obraId}/gastos`,
      {
        params: limpiarParams(filtros),
      },
    );

    return response.data;
  },

  /* =================================================
       PERSONAL POR OBRA
    ================================================= */

  obtenerPersonalPorObra: async (
    obraId: string,
    filtros: FiltrosPersonalObra = {},
  ): Promise<PersonalObraResponse> => {
    const response = await api.get<PersonalObraResponse>(
      `/reportes-obras/obra/${obraId}/personal`,
      {
        params: limpiarParams(filtros),
      },
    );

    return response.data;
  },

  /* =================================================
       CONTROLES DIARIOS POR OBRA
    ================================================= */

  obtenerControlesPorObra: async (
    obraId: string,
    filtros: FiltrosControlesObra = {},
  ): Promise<ControlesObraResponse> => {
    const response = await api.get<ControlesObraResponse>(
      `/reportes-obras/obra/${obraId}/controles`,
      {
        params: limpiarParams(filtros),
      },
    );

    return response.data;
  },

  /* =================================================
       FINANZAS POR OBRA
    ================================================= */

  obtenerFinanzasPorObra: async (
    obraId: string,
    filtros: FiltrosFinanzasObra = {},
  ): Promise<FinanzasObraResponse> => {
    const response = await api.get<FinanzasObraResponse>(
      `/reportes-obras/obra/${obraId}/finanzas`,
      {
        params: limpiarParams(filtros),
      },
    );

    return response.data;
  },

  /* =================================================
       EVOLUCIÓN DE COSTOS
    ================================================= */

  obtenerEvolucionCostos: async (
    obraId: string,
    filtros: FiltrosEvolucionCostos = {},
  ): Promise<EvolucionCostosResponse> => {
    const response = await api.get<EvolucionCostosResponse>(
      `/reportes-obras/obra/${obraId}/evolucion-costos`,
      {
        params: limpiarParams(filtros),
      },
    );

    return response.data;
  },

  /* =================================================
       PRESUPUESTO VS EJECUTADO
    ================================================= */

  obtenerPresupuestoObra: async (
    obraId: string,
    filtros: FiltrosPresupuestoObra = {},
  ): Promise<PresupuestoObraResponse> => {
    const response = await api.get<PresupuestoObraResponse>(
      `/reportes-obras/obra/${obraId}/presupuesto`,
      {
        params: limpiarParams(filtros),
      },
    );

    return response.data;
  },
};

/* =====================================================
   EXPORT DEFAULT
===================================================== */

export default reporteObraService;

/* =====================================================
   EXPORTS INDIVIDUALES
===================================================== */

export const {
  obtenerResumenGeneral,
  obtenerReporteObra,
  obtenerGastosPorObra,
  obtenerPersonalPorObra,
  obtenerControlesPorObra,
  obtenerFinanzasPorObra,
  obtenerEvolucionCostos,
  obtenerPresupuestoObra,
} = reporteObraService;
