import { api } from "../../../../services/api";

/* =====================================================
   TIPOS BASE
===================================================== */

export type EstadoAsistencia =
  | "presente"
  | "atraso"
  | "ausente"
  | "permiso"
  | "justificado";

export type TipoMarcacion = "entrada" | "salida";

export type OrigenRegistro = "manual" | "biometrico" | "sistema";

/* =====================================================
   EMPLEADO
===================================================== */

export interface EmpleadoAsistencia {
  id?: string;
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  cargo?: string;
  telefono?: string;
  correo?: string;
  activo?: boolean;
}

/* =====================================================
   OBRA
===================================================== */

export interface ObraAsistencia {
  id?: string;
  codigo?: string;
  nombre?: string;
  ubicacion?: string;
  estado?: string;
}

/* =====================================================
   ASIGNACIÓN
===================================================== */

export interface AsignacionAsistencia {
  id?: string;
  empleado_id?: string;
  obra_id?: string;
  fecha_asignacion?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  cargo_obra?: string | null;
  salario_acordado?: number | string | null;
  activo?: boolean;
}

/* =====================================================
   TIEMPO TRABAJADO
===================================================== */

export interface TiempoTrabajado {
  minutos: number;
  horas_decimal: number;
  texto: string;
}

/* =====================================================
   MARCACIÓN
===================================================== */

export interface MarcacionAsistencia {
  id: string;

  asistencia_id: string;

  empleado_id: string;

  obra_id: string;

  asignacion_id: string;

  fecha_hora: string;

  tipo: TipoMarcacion;

  origen_registro: OrigenRegistro;

  dispositivo_id?: string | null;

  referencia_externa?: string | null;

  observaciones?: string | null;

  usuario_registro_id?: string | null;

  fecha_creacion?: string;

  fecha_actualizacion?: string;
}

/* =====================================================
   ASISTENCIA
===================================================== */

export interface Asistencia {
  id: string;

  empleado_id: string;

  obra_id: string;

  asignacion_id: string;

  fecha: string;

  estado: EstadoAsistencia;

  observaciones?: string | null;

  usuario_registro_id?: string | null;

  fecha_creacion?: string;

  fecha_actualizacion?: string;

  nombres?: string;

  apellidos?: string;

  cedula?: string;

  cargo?: string;

  obra_codigo?: string;

  obra_nombre?: string;

  obra_ubicacion?: string;

  cargo_obra?: string;

  primera_entrada?: string | null;

  ultima_salida?: string | null;

  total_marcaciones?: number;

  minutos_trabajados?: number;

  tiempo_trabajado?: TiempoTrabajado;

  marcaciones?: MarcacionAsistencia[];
}

/* =====================================================
   FILTROS
===================================================== */

export interface FiltrosAsistencia {
  empleado_id?: string;

  obra_id?: string;

  asignacion_id?: string;

  fecha?: string;

  fecha_desde?: string;

  fecha_hasta?: string;

  estado?: EstadoAsistencia | "";

  buscar?: string;
}

/* =====================================================
   REGISTRAR ENTRADA
===================================================== */

export interface RegistrarEntradaPayload {
  empleado_id: string;

  obra_id: string;

  fecha_hora: string;

  observaciones?: string | null;
}

/* =====================================================
   REGISTRAR SALIDA
===================================================== */

export interface RegistrarSalidaPayload {
  empleado_id: string;

  obra_id: string;

  fecha_hora: string;

  observaciones?: string | null;
}

/* =====================================================
   REGISTRAR NOVEDAD
===================================================== */

export interface RegistrarNovedadPayload {
  empleado_id: string;

  obra_id: string;

  fecha: string;

  estado: EstadoAsistencia;

  observaciones?: string | null;
}

/* =====================================================
   ACTUALIZAR ASISTENCIA
===================================================== */

export interface ActualizarAsistenciaPayload {
  estado?: EstadoAsistencia;

  observaciones?: string | null;

  motivo: string;
}

/* =====================================================
   CORREGIR MARCACIÓN
===================================================== */

export interface CorregirMarcacionPayload {
  fecha_hora?: string;

  tipo?: TipoMarcacion;

  motivo: string;
}

/* =====================================================
   REPORTES
===================================================== */

export interface ReporteAsistenciaResumen {
  total_registros: number;

  dias_presentes: number;

  dias_atraso: number;

  ausencias: number;

  permisos: number;

  justificados: number;

  minutos_trabajados: number;

  tiempo_trabajado: TiempoTrabajado;
}

export interface ReporteAsistenciaPeriodo {
  fecha_desde: string;

  fecha_hasta: string;
}

export interface ReporteAsistencia {
  tipo?: string;

  periodo: ReporteAsistenciaPeriodo;

  resumen: ReporteAsistenciaResumen;

  detalle: Asistencia[];
}

/* =====================================================
   RESPUESTAS BACKEND
===================================================== */

interface ListarAsistenciasResponse {
  ok: boolean;

  total: number;

  asistencias: Asistencia[];
}

interface ObtenerAsistenciaResponse {
  ok: boolean;

  asistencia: Asistencia;
}

interface RegistrarEntradaResponse {
  ok: boolean;

  message: string;

  asistencia: Asistencia;

  marcacion: MarcacionAsistencia;

  empleado?: EmpleadoAsistencia;

  obra?: ObraAsistencia;

  asignacion?: AsignacionAsistencia;
}

interface RegistrarSalidaResponse {
  ok: boolean;

  message: string;

  asistencia: Asistencia;

  marcacion: MarcacionAsistencia;

  empleado?: EmpleadoAsistencia;

  obra?: ObraAsistencia;

  asignacion?: AsignacionAsistencia;

  tiempo_trabajado?: TiempoTrabajado;
}

interface RegistrarNovedadResponse {
  ok: boolean;

  message: string;

  asistencia: Asistencia;

  empleado?: EmpleadoAsistencia;

  obra?: ObraAsistencia;

  asignacion?: AsignacionAsistencia;
}

interface ActualizarAsistenciaResponse {
  ok: boolean;

  message: string;

  asistencia: Asistencia;
}

interface CorregirMarcacionResponse {
  ok: boolean;

  message: string;

  marcacion: MarcacionAsistencia;
}

interface ReporteResponse {
  ok: boolean;

  reporte: ReporteAsistencia;
}

/* =====================================================
   LIMPIAR PARÁMETROS
===================================================== */

const limpiarParametros = (parametros: Record<string, unknown>) => {
  const resultado: Record<string, unknown> = {};

  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      resultado[clave] = valor;
    }
  });

  return resultado;
};

/* =====================================================
   LISTAR ASISTENCIAS
===================================================== */

export const listarAsistencias = async (
  filtros: FiltrosAsistencia = {},
): Promise<Asistencia[]> => {
  const response = await api.get<ListarAsistenciasResponse>("/asistencias", {
    params: limpiarParametros(filtros as Record<string, unknown>),
  });

  return response.data.asistencias;
};

/* =====================================================
   OBTENER ASISTENCIA POR ID
===================================================== */

export const obtenerAsistenciaPorId = async (
  id: string,
): Promise<Asistencia> => {
  const response = await api.get<ObtenerAsistenciaResponse>(
    `/asistencias/${id}`,
  );

  return response.data.asistencia;
};

/* =====================================================
   REGISTRAR ENTRADA
===================================================== */

export const registrarEntrada = async (
  data: RegistrarEntradaPayload,
): Promise<RegistrarEntradaResponse> => {
  const response = await api.post<RegistrarEntradaResponse>(
    "/asistencias/entrada",
    data,
  );

  return response.data;
};

/* =====================================================
   REGISTRAR SALIDA
===================================================== */

export const registrarSalida = async (
  data: RegistrarSalidaPayload,
): Promise<RegistrarSalidaResponse> => {
  const response = await api.post<RegistrarSalidaResponse>(
    "/asistencias/salida",
    data,
  );

  return response.data;
};

/* =====================================================
   REGISTRAR NOVEDAD
===================================================== */

export const registrarNovedad = async (
  data: RegistrarNovedadPayload,
): Promise<RegistrarNovedadResponse> => {
  const response = await api.post<RegistrarNovedadResponse>(
    "/asistencias/novedad",
    data,
  );

  return response.data;
};

/* =====================================================
   ACTUALIZAR ASISTENCIA
===================================================== */

export const actualizarAsistencia = async (
  id: string,
  data: ActualizarAsistenciaPayload,
): Promise<ActualizarAsistenciaResponse> => {
  const response = await api.patch<ActualizarAsistenciaResponse>(
    `/asistencias/${id}`,
    data,
  );

  return response.data;
};

/* =====================================================
   CORREGIR MARCACIÓN
===================================================== */

export const corregirMarcacion = async (
  id: string,
  data: CorregirMarcacionPayload,
): Promise<CorregirMarcacionResponse> => {
  const response = await api.patch<CorregirMarcacionResponse>(
    `/asistencias/marcaciones/${id}`,
    data,
  );

  return response.data;
};

/* =====================================================
   REPORTE SEMANAL
===================================================== */

export const obtenerReporteSemanal = async (filtros: {
  empleado_id?: string;

  obra_id?: string;

  fecha_inicio: string;

  fecha_fin: string;
}): Promise<ReporteAsistencia> => {
  const response = await api.get<ReporteResponse>(
    "/asistencias/reportes/semanal",
    {
      params: limpiarParametros(filtros as Record<string, unknown>),
    },
  );

  return response.data.reporte;
};

/* =====================================================
   REPORTE POR PERÍODO
===================================================== */

export const obtenerReportePeriodo = async (filtros: {
  empleado_id?: string;

  obra_id?: string;

  fecha_desde: string;

  fecha_hasta: string;

  estado?: EstadoAsistencia | "";
}): Promise<ReporteAsistencia> => {
  const response = await api.get<ReporteResponse>(
    "/asistencias/reportes/periodo",
    {
      params: limpiarParametros(filtros as Record<string, unknown>),
    },
  );

  return response.data.reporte;
};

/* =====================================================
   SERVICIO AGRUPADO
===================================================== */

export const asistenciaService = {
  listarAsistencias,

  obtenerAsistenciaPorId,

  registrarEntrada,

  registrarSalida,

  registrarNovedad,

  actualizarAsistencia,

  corregirMarcacion,

  obtenerReporteSemanal,

  obtenerReportePeriodo,
};

export default asistenciaService;
