import { api } from "../../../../services/api";

/* =====================================================
   TIPOS BASE
===================================================== */

export type TipoPagoEmpleado = "diario" | "semanal" | "quincenal" | "mensual";

export interface Empleado {
  id: string;

  nombres: string;
  apellidos: string;

  nombre_completo?: string;

  cedula: string;

  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;

  fecha_nacimiento?: string | null;

  cargo?: string | null;

  tipo_pago: TipoPagoEmpleado;

  salario_base?: number | string | null;

  fecha_ingreso?: string | null;

  activo: boolean;

  observaciones?: string | null;

  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;

  obras_activas?: number;
}

/* =====================================================
   PAYLOAD CREAR EMPLEADO
===================================================== */

export interface CrearEmpleadoPayload {
  nombres: string;

  apellidos: string;

  cedula: string;

  telefono?: string;

  correo?: string;

  direccion?: string;

  fecha_nacimiento?: string;

  cargo?: string;

  tipo_pago: TipoPagoEmpleado;

  salario_base?: number;

  fecha_ingreso?: string;

  activo?: boolean;

  observaciones?: string;
}

/* =====================================================
   PAYLOAD ACTUALIZAR EMPLEADO
===================================================== */

export interface ActualizarEmpleadoPayload {
  nombres?: string;

  apellidos?: string;

  cedula?: string;

  telefono?: string | null;

  correo?: string | null;

  direccion?: string | null;

  fecha_nacimiento?: string | null;

  cargo?: string | null;

  tipo_pago?: TipoPagoEmpleado;

  salario_base?: number | null;

  fecha_ingreso?: string | null;

  activo?: boolean;

  observaciones?: string | null;
}

/* =====================================================
   RESUMEN DEL EMPLEADO
===================================================== */

export interface EmpleadoResumen {
  obras_activas: number;

  total_asignaciones: number;

  pagos_realizados: number;

  total_pagado: number | string;

  total_pendiente: number | string;
}

/* =====================================================
   OBRAS DEL EMPLEADO
===================================================== */

export interface EmpleadoObra {
  asignacion_id: string;

  empleado_id: string;

  obra_id: string;

  obra_codigo?: string | null;

  obra_nombre?: string | null;

  obra_estado?: string | null;

  obra_ubicacion?: string | null;

  fecha_asignacion?: string | null;

  fecha_inicio?: string | null;

  fecha_fin?: string | null;

  cargo_obra?: string | null;

  salario_acordado?: number | string | null;

  activo: boolean;

  observaciones?: string | null;
}

/* =====================================================
   PAGOS DEL EMPLEADO
===================================================== */

export type EstadoPagoEmpleado = "pendiente" | "pagado" | "anulado";

export type MetodoPagoEmpleado =
  | "efectivo"
  | "transferencia"
  | "deposito"
  | "cheque";

export interface EmpleadoPago {
  id: string;

  empleado_id: string;

  obra_id?: string | null;

  asignacion_id?: string | null;

  cuenta_id?: string | null;

  transaccion_id?: string | null;

  tipo_pago: string;

  periodo_descripcion: string;

  fecha_inicio_periodo?: string | null;

  fecha_fin_periodo?: string | null;

  monto: number | string;

  fecha_pago?: string | null;

  metodo_pago?: MetodoPagoEmpleado | null;

  estado: EstadoPagoEmpleado;

  referencia?: string | null;

  observaciones?: string | null;

  fecha_creacion?: string | null;

  fecha_actualizacion?: string | null;

  obra_codigo?: string | null;

  obra_nombre?: string | null;

  cuenta_nombre?: string | null;
}

/* =====================================================
   ACTIVIDAD DEL EMPLEADO
===================================================== */

export type TipoActividadEmpleado = "asignacion" | "fin_asignacion" | "pago";

export interface EmpleadoActividad {
  id: string;

  tipo: TipoActividadEmpleado;

  titulo: string;

  descripcion?: string | null;

  fecha: string;

  obra_id?: string | null;

  obra_codigo?: string | null;

  obra_nombre?: string | null;

  monto?: number | null;

  estado?: string | null;
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
   GET EMPLEADOS
===================================================== */

export const getEmpleados = async (): Promise<Empleado[]> => {
  const response = await api.get<ApiResponse<Empleado[]>>("/empleados");

  return Array.isArray(response.data.data) ? response.data.data : [];
};

/* =====================================================
   GET EMPLEADO BY ID
===================================================== */

export const getEmpleadoById = async (id: string): Promise<Empleado> => {
  const response = await api.get<ApiResponse<Empleado>>(`/empleados/${id}`);

  return response.data.data;
};

/* =====================================================
   GET RESUMEN EMPLEADO
===================================================== */

export const getEmpleadoResumen = async (
  id: string,
): Promise<EmpleadoResumen> => {
  const response = await api.get<ApiResponse<EmpleadoResumen>>(
    `/empleados/${id}/resumen`,
  );

  return response.data.data;
};

/* =====================================================
   GET OBRAS EMPLEADO
===================================================== */

export const getEmpleadoObras = async (id: string): Promise<EmpleadoObra[]> => {
  const response = await api.get<ApiResponse<EmpleadoObra[]>>(
    `/empleados/${id}/obras`,
  );

  return Array.isArray(response.data.data) ? response.data.data : [];
};

/* =====================================================
   GET PAGOS EMPLEADO
===================================================== */

export const getEmpleadoPagos = async (id: string): Promise<EmpleadoPago[]> => {
  const response = await api.get<ApiResponse<EmpleadoPago[]>>(
    `/empleados/${id}/pagos`,
  );

  return Array.isArray(response.data.data) ? response.data.data : [];
};

/* =====================================================
   GET ACTIVIDAD EMPLEADO
===================================================== */

export const getEmpleadoActividad = async (
  id: string,
): Promise<EmpleadoActividad[]> => {
  const response = await api.get<ApiResponse<EmpleadoActividad[]>>(
    `/empleados/${id}/actividad`,
  );

  return Array.isArray(response.data.data) ? response.data.data : [];
};

/* =====================================================
   CREATE EMPLEADO
===================================================== */

export const createEmpleado = async (
  data: CrearEmpleadoPayload,
): Promise<Empleado> => {
  const response = await api.post<ApiResponse<Empleado>>("/empleados", data);

  return response.data.data;
};

/* =====================================================
   UPDATE EMPLEADO
===================================================== */

export const updateEmpleado = async (
  id: string,
  data: ActualizarEmpleadoPayload,
): Promise<Empleado> => {
  const response = await api.put<ApiResponse<Empleado>>(
    `/empleados/${id}`,
    data,
  );

  return response.data.data;
};

/* =====================================================
   TOGGLE STATUS
===================================================== */

export const toggleEmpleadoStatus = async (
  id: string,
  activo: boolean,
): Promise<Empleado> => {
  const response = await api.put<ApiResponse<Empleado>>(
    `/empleados/${id}/status`,
    {
      activo,
    },
  );

  return response.data.data;
};

/* =====================================================
   DELETE EMPLEADO
===================================================== */

export const deleteEmpleado = async (id: string): Promise<void> => {
  await api.delete(`/empleados/${id}`);
};

/* =====================================================
   EXPORT DEFAULT
===================================================== */

const empleadosService = {
  getEmpleados,

  getEmpleadoById,

  getEmpleadoResumen,

  getEmpleadoObras,

  getEmpleadoPagos,

  getEmpleadoActividad,

  createEmpleado,

  updateEmpleado,

  toggleEmpleadoStatus,

  deleteEmpleado,
};

export default empleadosService;
