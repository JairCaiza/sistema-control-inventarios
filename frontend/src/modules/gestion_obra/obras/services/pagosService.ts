import { api } from "../../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export type TipoPagoEmpleado =
  | "diario"
  | "semanal"
  | "quincenal"
  | "mensual"
  | "otro";

export type EstadoPagoEmpleado = "pendiente" | "pagado" | "anulado";

/* =====================================================
   ASIGNACIÓN EMPLEADO-OBRA
===================================================== */

export interface AsignacionPagoObra {
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

  empleado_nombres?: string | null;

  empleado_apellidos?: string | null;

  empleado_cedula?: string | null;

  empleado_cargo?: string | null;

  obra_codigo?: string | null;

  obra_nombre?: string | null;
}

/* =====================================================
   PAGO EMPLEADO
===================================================== */

export interface PagoEmpleadoObra {
  id: string;

  empleado_id: string;

  empleado_nombre?: string | null;

  empleado_nombres?: string | null;

  empleado_apellidos?: string | null;

  empleado_cedula?: string | null;

  empleado_cargo?: string | null;

  obra_id?: string | null;

  obra_codigo?: string | null;

  obra_nombre?: string | null;

  asignacion_id?: string | null;

  cargo_obra?: string | null;

  salario_acordado?: number | string | null;

  tipo_pago: TipoPagoEmpleado;

  periodo_descripcion: string;

  fecha_inicio_periodo?: string | null;

  fecha_fin_periodo?: string | null;

  monto: number | string;

  fecha_pago?: string | null;

  metodo_pago?: string | null;

  estado: EstadoPagoEmpleado;

  referencia?: string | null;

  observaciones?: string | null;

  fecha_creacion?: string | null;
}

/* =====================================================
   CREAR PAGO DESDE OBRA
===================================================== */

export interface CrearPagoObraPayload {
  empleado_id: string;

  obra_id: string;

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
   RESPUESTAS API
===================================================== */

interface ApiResponse<T> {
  success: boolean;

  message?: string;

  data: T;
}

interface ApiListaPagosResponse {
  success: boolean;

  data: PagoEmpleadoObra[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* =====================================================
   OBTENER ASIGNACIONES ACTIVAS DE UN EMPLEADO EN OBRA
===================================================== */

export const getAsignacionesPagoObra = async (
  empleadoId: string,
  obraId: string,
): Promise<AsignacionPagoObra[]> => {
  const response = await api.get<ApiResponse<AsignacionPagoObra[]>>(
    "/pagos-empleados/asignaciones",
    {
      params: {
        empleado_id: empleadoId,
        obra_id: obraId,
      },
    },
  );

  return response.data.data ?? [];
};

/* =====================================================
   LISTAR PAGOS DE UNA OBRA
===================================================== */

export const getPagosPorObra = async (
  obraId: string,
): Promise<PagoEmpleadoObra[]> => {
  const response = await api.get<ApiListaPagosResponse>("/pagos-empleados", {
    params: {
      obra_id: obraId,
      limit: 100,
    },
  });

  return response.data.data ?? [];
};

/* =====================================================
   LISTAR PAGOS DE EMPLEADO EN UNA OBRA
===================================================== */

export const getPagosEmpleadoObra = async (
  empleadoId: string,
  obraId: string,
): Promise<PagoEmpleadoObra[]> => {
  const response = await api.get<ApiListaPagosResponse>("/pagos-empleados", {
    params: {
      empleado_id: empleadoId,
      obra_id: obraId,
      limit: 100,
    },
  });

  return response.data.data ?? [];
};

/* =====================================================
   CREAR PAGO PENDIENTE
===================================================== */

export const crearPagoDesdeObra = async (
  data: CrearPagoObraPayload,
): Promise<PagoEmpleadoObra> => {
  const response = await api.post<ApiResponse<PagoEmpleadoObra>>(
    "/pagos-empleados",
    {
      empleado_id: data.empleado_id,

      obra_id: data.obra_id,

      asignacion_id: data.asignacion_id ?? null,

      tipo_pago: data.tipo_pago,

      periodo_descripcion: data.periodo_descripcion,

      fecha_inicio_periodo: data.fecha_inicio_periodo ?? null,

      fecha_fin_periodo: data.fecha_fin_periodo ?? null,

      monto: data.monto,

      referencia: data.referencia ?? null,

      observaciones: data.observaciones ?? null,
    },
  );

  return response.data.data;
};

/* =====================================================
   VERIFICAR SI EL PERÍODO YA ESTÁ CUBIERTO EN FRONTEND
===================================================== */

const normalizarFecha = (fecha?: string | null) => {
  if (!fecha) {
    return null;
  }

  return fecha.includes("T") ? fecha.split("T")[0] : fecha;
};

export const existePagoEnPeriodo = (
  pagos: PagoEmpleadoObra[],
  fechaInicio: string,
  fechaFin: string,
): PagoEmpleadoObra | null => {
  if (!fechaInicio || !fechaFin) {
    return null;
  }

  const inicioNuevo = new Date(fechaInicio);

  const finNuevo = new Date(fechaFin);

  const conflicto =
    pagos.find((pago) => {
      if (pago.estado === "anulado") {
        return false;
      }

      const inicioExistente = normalizarFecha(pago.fecha_inicio_periodo);

      const finExistente = normalizarFecha(pago.fecha_fin_periodo);

      if (!inicioExistente || !finExistente) {
        return false;
      }

      const inicioPago = new Date(inicioExistente);

      const finPago = new Date(finExistente);

      return inicioPago <= finNuevo && finPago >= inicioNuevo;
    }) ?? null;

  return conflicto;
};

/* =====================================================
   EXPORT DEFAULT
===================================================== */

const pagosService = {
  getAsignacionesPagoObra,
  getPagosPorObra,
  getPagosEmpleadoObra,
  crearPagoDesdeObra,
  existePagoEnPeriodo,
};

export default pagosService;
