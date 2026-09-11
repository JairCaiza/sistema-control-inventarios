import { api } from "../../../../services/api";

/* =====================================================
   TIPOS BASE
===================================================== */

export type TipoPagoEmpleado =
  | "diario"
  | "semanal"
  | "quincenal"
  | "mensual"
  | "otro";

export type EstadoPagoEmpleado = "pendiente" | "pagado" | "anulado";

export type MetodoPagoEmpleado =
  | "efectivo"
  | "transferencia"
  | "deposito"
  | "cheque";

/* =====================================================
   PAGO EMPLEADO
===================================================== */

export interface PagoEmpleado {
  id: string;

  empleado_id: string;

  empleado_nombre?: string;
  empleado_nombres?: string;
  empleado_apellidos?: string;
  empleado_cedula?: string;
  empleado_cargo?: string;
  empleado_tipo_pago?: string;

  obra_id?: string | null;
  obra_codigo?: string | null;
  obra_nombre?: string | null;

  asignacion_id?: string | null;

  cargo_obra?: string | null;

  salario_acordado?: number | string | null;

  cuenta_id?: string | null;

  cuenta_nombre?: string | null;

  cuenta_tipo?: string | null;

  cuenta_saldo_actual?: number | string | null;

  transaccion_id?: string | null;

  transaccion_tipo?: string | null;

  transaccion_monto?: number | string | null;

  transaccion_fecha?: string | null;

  transaccion_descripcion?: string | null;

  tipo_pago: TipoPagoEmpleado;

  periodo_descripcion: string;

  fecha_inicio_periodo?: string | null;

  fecha_fin_periodo?: string | null;

  monto: number | string;

  fecha_pago?: string | null;

  metodo_pago?: MetodoPagoEmpleado | null;

  estado: EstadoPagoEmpleado;

  referencia?: string | null;

  observaciones?: string | null;

  fecha_creacion: string;

  fecha_actualizacion: string;
}

/* =====================================================
   ASIGNACIÓN ACTIVA EMPLEADO - OBRA
===================================================== */

export interface AsignacionPagoEmpleado {
  id: string;

  empleado_id: string;

  obra_id: string;

  fecha_asignacion?: string | null;

  fecha_inicio?: string | null;

  fecha_fin?: string | null;

  cargo_obra?: string | null;

  salario_acordado?: number | string | null;

  activo: boolean;

  observaciones?: string | null;

  empleado_nombres?: string;

  empleado_apellidos?: string;

  empleado_cedula?: string;

  empleado_cargo?: string | null;

  obra_codigo?: string;

  obra_nombre?: string;
}

/* =====================================================
   CREAR PAGO
===================================================== */

export interface CrearPagoEmpleadoPayload {
  empleado_id: string;

  obra_id?: string | null;

  asignacion_id?: string | null;

  tipo_pago: TipoPagoEmpleado;

  periodo_descripcion: string;

  fecha_inicio_periodo?: string | null;

  fecha_fin_periodo?: string | null;

  monto: number;

  referencia?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   ACTUALIZAR PAGO
===================================================== */

export interface ActualizarPagoEmpleadoPayload {
  empleado_id?: string;

  obra_id?: string | null;

  asignacion_id?: string | null;

  tipo_pago?: TipoPagoEmpleado;

  periodo_descripcion?: string;

  fecha_inicio_periodo?: string | null;

  fecha_fin_periodo?: string | null;

  monto?: number;

  referencia?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   CONFIRMAR PAGO
===================================================== */

export interface ConfirmarPagoEmpleadoPayload {
  cuenta_id: string;

  fecha_pago: string;

  metodo_pago: MetodoPagoEmpleado;

  referencia?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   ANULAR PAGO
===================================================== */

export interface AnularPagoEmpleadoPayload {
  motivo: string;
}

/* =====================================================
   FILTROS DE PAGOS
===================================================== */

export interface FiltrosPagosEmpleado {
  empleado_id?: string;

  obra_id?: string;

  cuenta_id?: string;

  estado?: EstadoPagoEmpleado;

  tipo_pago?: TipoPagoEmpleado;

  fecha_desde?: string;

  fecha_hasta?: string;

  buscar?: string;

  page?: number;

  limit?: number;
}

/* =====================================================
   FILTROS REPORTE
===================================================== */

export interface FiltrosReportePago {
  fecha_desde?: string;

  fecha_hasta?: string;

  estado?: EstadoPagoEmpleado;
}

/* =====================================================
   PAGINACIÓN
===================================================== */

export interface PaginationPagosEmpleado {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
}

/* =====================================================
   RESPUESTA LISTADO
===================================================== */

export interface ListarPagosEmpleadoResponse {
  data: PagoEmpleado[];

  pagination: PaginationPagosEmpleado;
}

/* =====================================================
   RESUMEN GENERAL DE PAGOS
===================================================== */

export interface ResumenPagosEmpleado {
  total_registros: number | string;

  empleados_con_pagos: number | string;

  pagos_confirmados: number | string;

  pagos_pendientes: number | string;

  pagos_anulados: number | string;

  total_pagado: number | string;

  total_pendiente: number | string;

  pagos_vinculados_obra: number | string;
}

/* =====================================================
   TRANSACCIÓN FINANCIERA
===================================================== */

export interface TransaccionPagoEmpleado {
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

export interface CuentaPagoEmpleado {
  id: string;

  nombre: string;

  tipo: string;

  saldo_actual: number | string;
}

/* =====================================================
   RESPUESTA CONFIRMAR
===================================================== */

export interface ConfirmarPagoEmpleadoResponse {
  pago: PagoEmpleado;

  transaccion: TransaccionPagoEmpleado;

  cuenta: CuentaPagoEmpleado;
}

/* =====================================================
   RESPUESTA ANULAR
===================================================== */

export interface AnularPagoEmpleadoResponse {
  pago: PagoEmpleado;

  reversion: TransaccionPagoEmpleado | null;

  cuenta?: CuentaPagoEmpleado;
}

/* =====================================================
   EMPLEADO EN REPORTE INDIVIDUAL
===================================================== */

export interface EmpleadoReportePago {
  id: string;

  nombres: string;

  apellidos: string;

  cedula: string;

  cargo?: string | null;

  tipo_pago: string;

  salario_base?: number | string | null;

  activo: boolean;
}

/* =====================================================
   RESUMEN REPORTE EMPLEADO
===================================================== */

export interface ResumenReporteEmpleado {
  total_registros: number | string;

  total_pendientes: number | string;

  total_pagados: number | string;

  total_anulados: number | string;

  monto_pagado: number | string;

  monto_pendiente: number | string;
}

/* =====================================================
   REPORTE POR EMPLEADO
===================================================== */

export interface ReportePagoEmpleado {
  empleado: EmpleadoReportePago;

  resumen: ResumenReporteEmpleado;

  pagos: PagoEmpleado[];
}

/* =====================================================
   OBRA EN REPORTE
===================================================== */

export interface ObraReportePago {
  id: string;

  codigo?: string | null;

  nombre: string;

  ubicacion?: string | null;

  estado?: string | null;

  presupuesto?: number | string | null;
}

/* =====================================================
   RESUMEN REPORTE OBRA
===================================================== */

export interface ResumenReporteObra {
  total_pagos: number | string;

  empleados_pagados: number | string;

  total_pagado: number | string;

  total_pendiente: number | string;

  total_anulado: number | string;
}

/* =====================================================
   REPORTE POR OBRA
===================================================== */

export interface ReportePagoObra {
  obra: ObraReportePago;

  resumen: ResumenReporteObra;

  pagos: PagoEmpleado[];
}

/* =====================================================
   NUEVO: EMPLEADO REPORTE GENERAL PERSONAL
===================================================== */

export interface EmpleadoReportePersonal {
  id: string;

  nombres: string;

  apellidos: string;

  empleado_nombre: string;

  cedula: string;

  cargo?: string | null;

  tipo_pago: TipoPagoEmpleado;

  salario_base?: number | string | null;

  fecha_ingreso?: string | null;

  activo: boolean;

  /* =============================================
     OBRA ACTUAL
  ============================================= */

  obra_id?: string | null;

  obra_codigo?: string | null;

  obra_nombre?: string | null;

  cargo_obra?: string | null;

  fecha_asignacion?: string | null;

  fecha_inicio?: string | null;

  /* =============================================
     ASIGNACIONES
  ============================================= */

  total_asignaciones: number;

  obras_activas: number;

  /* =============================================
     PAGOS
  ============================================= */

  total_pagado: number;

  pagos_pendientes: number;

  pagos_realizados: number;

  pagos_pendientes_cantidad: number;

  pagos_anulados: number;
}

/* =====================================================
   NUEVO: RESUMEN REPORTE GENERAL PERSONAL
===================================================== */

export interface ResumenReportePersonal {
  total_personal: number;

  activos: number;

  inactivos: number;

  empleados_en_obra: number;

  total_pagado: number;

  total_pendiente: number;

  pagos_realizados: number;

  pagos_pendientes: number;
}

/* =====================================================
   NUEVO: REPORTE GENERAL PERSONAL
===================================================== */

export interface ReporteGeneralPersonal {
  resumen: ResumenReportePersonal;

  empleados: EmpleadoReportePersonal[];
}

/* =====================================================
   HELPER - LIMPIAR PARAMS
===================================================== */

const limpiarParams = <T extends object>(
  params: T,
): Record<string, unknown> => {
  const resultado: Record<string, unknown> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      resultado[key] = value;
    }
  });

  return resultado;
};

/* =====================================================
   GET ASIGNACIONES ACTIVAS EMPLEADO - OBRA
===================================================== */

/*
 * Endpoint:
 *
 * GET /api/pagos-empleados/asignaciones
 *
 * Query:
 *
 * empleado_id
 * obra_id
 */

export const getAsignacionesPagoEmpleado = async (
  empleadoId: string,
  obraId: string,
): Promise<AsignacionPagoEmpleado[]> => {
  const response = await api.get("/pagos-empleados/asignaciones", {
    params: {
      empleado_id: empleadoId,

      obra_id: obraId,
    },
  });

  return Array.isArray(response.data?.data) ? response.data.data : [];
};

/* =====================================================
   GET PAGOS
===================================================== */

export const getPagosEmpleados = async (
  filtros: FiltrosPagosEmpleado = {},
): Promise<ListarPagosEmpleadoResponse> => {
  const response = await api.get("/pagos-empleados", {
    params: limpiarParams(filtros),
  });

  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],

    pagination: response.data?.pagination ?? {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  };
};

/* =====================================================
   GET PAGO BY ID
===================================================== */

export const getPagoEmpleadoById = async (
  id: string,
): Promise<PagoEmpleado> => {
  const response = await api.get(`/pagos-empleados/${id}`);

  return response.data.data;
};

/* =====================================================
   CREATE PAGO
===================================================== */

export const createPagoEmpleado = async (
  data: CrearPagoEmpleadoPayload,
): Promise<PagoEmpleado> => {
  const response = await api.post("/pagos-empleados", data);

  return response.data.data;
};

/* =====================================================
   UPDATE PAGO
===================================================== */

export const updatePagoEmpleado = async (
  id: string,

  data: ActualizarPagoEmpleadoPayload,
): Promise<PagoEmpleado> => {
  const response = await api.put(`/pagos-empleados/${id}`, data);

  return response.data.data;
};

/* =====================================================
   CONFIRMAR PAGO
===================================================== */

export const confirmarPagoEmpleado = async (
  id: string,

  data: ConfirmarPagoEmpleadoPayload,
): Promise<ConfirmarPagoEmpleadoResponse> => {
  const response = await api.patch(`/pagos-empleados/${id}/confirmar`, data);

  return response.data.data;
};

/* =====================================================
   ANULAR PAGO
===================================================== */

export const anularPagoEmpleado = async (
  id: string,
  motivo: string,
): Promise<AnularPagoEmpleadoResponse> => {
  const payload: AnularPagoEmpleadoPayload = {
    motivo,
  };

  const response = await api.patch(`/pagos-empleados/${id}/anular`, payload);

  return response.data.data;
};

/* =====================================================
   GET RESUMEN GENERAL PAGOS
===================================================== */

export const getResumenPagosEmpleados =
  async (): Promise<ResumenPagosEmpleado> => {
    const response = await api.get("/pagos-empleados/resumen");

    return response.data.data;
  };

/* =====================================================
   GET REPORTE POR EMPLEADO
===================================================== */

export const getReportePagosEmpleado = async (
  empleadoId: string,

  filtros: FiltrosReportePago = {},
): Promise<ReportePagoEmpleado> => {
  const response = await api.get(
    `/pagos-empleados/reportes/empleado/${empleadoId}`,
    {
      params: limpiarParams(filtros),
    },
  );

  return response.data.data;
};

/* =====================================================
   GET REPORTE POR OBRA
===================================================== */

export const getReportePagosObra = async (
  obraId: string,

  filtros: FiltrosReportePago = {},
): Promise<ReportePagoObra> => {
  const response = await api.get(`/pagos-empleados/reportes/obra/${obraId}`, {
    params: limpiarParams(filtros),
  });

  return response.data.data;
};

/* =====================================================
   NUEVO: GET REPORTE GENERAL DE PERSONAL
===================================================== */

export const getReporteGeneralPersonal =
  async (): Promise<ReporteGeneralPersonal> => {
    const response = await api.get("/pagos-empleados/reportes/personal");

    const data = response.data?.data;

    return {
      resumen: {
        total_personal: Number(data?.resumen?.total_personal ?? 0),

        activos: Number(data?.resumen?.activos ?? 0),

        inactivos: Number(data?.resumen?.inactivos ?? 0),

        empleados_en_obra: Number(data?.resumen?.empleados_en_obra ?? 0),

        total_pagado: Number(data?.resumen?.total_pagado ?? 0),

        total_pendiente: Number(data?.resumen?.total_pendiente ?? 0),

        pagos_realizados: Number(data?.resumen?.pagos_realizados ?? 0),

        pagos_pendientes: Number(data?.resumen?.pagos_pendientes ?? 0),
      },

      empleados: Array.isArray(data?.empleados)
        ? (data.empleados.map((empleado: Record<string, unknown>) => ({
            ...empleado,

            total_asignaciones: Number(empleado.total_asignaciones ?? 0),

            obras_activas: Number(empleado.obras_activas ?? 0),

            total_pagado: Number(empleado.total_pagado ?? 0),

            pagos_pendientes: Number(empleado.pagos_pendientes ?? 0),

            pagos_realizados: Number(empleado.pagos_realizados ?? 0),

            pagos_pendientes_cantidad: Number(
              empleado.pagos_pendientes_cantidad ?? 0,
            ),

            pagos_anulados: Number(empleado.pagos_anulados ?? 0),
          })) as EmpleadoReportePersonal[])
        : [],
    };
  };

/* =====================================================
   DEFAULT SERVICE
===================================================== */

const pagoEmpleadoService = {
  getAsignacionesPagoEmpleado,

  getPagosEmpleados,

  getPagoEmpleadoById,

  createPagoEmpleado,

  updatePagoEmpleado,

  confirmarPagoEmpleado,

  anularPagoEmpleado,

  getResumenPagosEmpleados,

  getReportePagosEmpleado,

  getReportePagosObra,

  getReporteGeneralPersonal,
};

export default pagoEmpleadoService;
