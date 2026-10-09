import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export type EstadoJornadaAlquiler =
  | "trabajado"
  | "no_laborable"
  | "suspendido"
  | "cancelado";

/* =====================================================
   JORNADA
===================================================== */

export interface JornadaAlquiler {
  id: string;
  detalle_contrato_id: string;

  contrato_id?: string;
  numero_contrato?: string;

  activo_id?: string;
  activo_codigo?: string;
  activo_nombre?: string;

  cantidad_contratada?: number;
  precio_contratado?: number;

  fecha: string;

  estado: EstadoJornadaAlquiler;

  cantidad_efectiva: number;

  precio_diario: number;

  cobrable: boolean;

  total_dia: number;

  motivo: string | null;

  observaciones: string | null;

  usuario_registro_id: string | null;

  fecha_creacion: string;

  fecha_actualizacion: string;
}

/* =====================================================
   ACTIVO DEVUELTO AL REGISTRAR
===================================================== */

export interface ActivoJornada {
  id: string;
  codigo: string | null;
  nombre: string;
}

/* =====================================================
   CONTRATO DEVUELTO AL REGISTRAR
===================================================== */

export interface ContratoJornada {
  id: string;
  numero_contrato: string;
}

/* =====================================================
   RESPUESTA DE REGISTRO
===================================================== */

export interface JornadaRegistrada extends JornadaAlquiler {
  activo?: ActivoJornada;
  contrato?: ContratoJornada;
}

/* =====================================================
   DATOS PARA REGISTRAR JORNADA
===================================================== */

export interface RegistrarJornadaPayload {
  detalle_contrato_id: string;

  fecha: string;

  estado: EstadoJornadaAlquiler;

  cantidad_efectiva: number;

  cobrable?: boolean;

  motivo?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   DATOS PARA ACTUALIZAR JORNADA
===================================================== */

export interface ActualizarJornadaPayload {
  fecha?: string;

  estado?: EstadoJornadaAlquiler;

  cantidad_efectiva?: number;

  cobrable?: boolean;

  motivo?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   INFORMACIÓN DEL CONTRATO
===================================================== */

export interface ContratoResumenJornadas {
  id: string;

  numero_contrato: string;

  fecha_inicio: string;

  fecha_fin: string;

  estado: string;

  total_previsto: number;

  pagado: number;

  saldo_pendiente_actual: number;
}

/* =====================================================
   RESUMEN DE JORNADAS
===================================================== */

export interface ResumenJornadas {
  jornadas_registradas: number;

  jornadas_trabajadas: number;

  jornadas_no_laborables: number;

  jornadas_suspendidas: number;

  jornadas_canceladas: number;

  jornadas_cobrables: number;

  total_previsto: number;

  total_efectivo: number;

  pagado: number;

  diferencia_pago: number;

  saldo_efectivo_pendiente: number;

  saldo_a_favor_cliente: number;
}

/* =====================================================
   RESPUESTA LISTADO POR CONTRATO
===================================================== */

export interface JornadasContratoResponse {
  contrato: ContratoResumenJornadas;

  resumen: ResumenJornadas;

  jornadas: JornadaAlquiler[];
}

/* =====================================================
   DETALLE DEL ACTIVO DEL CONTRATO
===================================================== */

export interface DetalleContratoJornadas {
  id: string;

  contrato_id: string;

  numero_contrato: string;

  activo_id: string;

  activo_codigo: string | null;

  activo_nombre: string;

  cantidad_contratada: number;

  precio_diario: number;

  subtotal_previsto: number;
}

/* =====================================================
   RESPUESTA LISTADO POR DETALLE
===================================================== */

export interface JornadasDetalleResponse {
  detalle: DetalleContratoJornadas;

  total_efectivo: number;

  jornadas: JornadaAlquiler[];
}

/* =====================================================
   RESPUESTAS GENERALES DE LA API
===================================================== */

interface ApiResponse<T> {
  success: boolean;

  message?: string;

  data: T;
}

/* =====================================================
   REGISTRAR JORNADA
===================================================== */

export const registrarJornada = async (
  payload: RegistrarJornadaPayload,
): Promise<JornadaRegistrada> => {
  const response = await api.post<ApiResponse<JornadaRegistrada>>(
    "/jornadas-alquiler",
    payload,
  );

  return response.data.data;
};

/* =====================================================
   LISTAR JORNADAS POR CONTRATO
===================================================== */

export const listarJornadasPorContrato = async (
  contratoId: string,
): Promise<JornadasContratoResponse> => {
  const response = await api.get<ApiResponse<JornadasContratoResponse>>(
    `/jornadas-alquiler/contrato/${contratoId}`,
  );

  return response.data.data;
};

/* =====================================================
   OBTENER RESUMEN EFECTIVO DEL CONTRATO
===================================================== */

export const obtenerResumenContrato = async (
  contratoId: string,
): Promise<{
  contrato: ContratoResumenJornadas;
  resumen: ResumenJornadas;
}> => {
  const response = await api.get<
    ApiResponse<{
      contrato: ContratoResumenJornadas;
      resumen: ResumenJornadas;
    }>
  >(`/jornadas-alquiler/contrato/${contratoId}/resumen`);

  return response.data.data;
};

/* =====================================================
   LISTAR JORNADAS POR DETALLE
===================================================== */

export const listarJornadasPorDetalle = async (
  detalleContratoId: string,
): Promise<JornadasDetalleResponse> => {
  const response = await api.get<ApiResponse<JornadasDetalleResponse>>(
    `/jornadas-alquiler/detalle/${detalleContratoId}`,
  );

  return response.data.data;
};

/* =====================================================
   OBTENER JORNADA POR ID
===================================================== */

export const obtenerJornadaPorId = async (
  id: string,
): Promise<JornadaAlquiler> => {
  const response = await api.get<ApiResponse<JornadaAlquiler>>(
    `/jornadas-alquiler/${id}`,
  );

  return response.data.data;
};

/* =====================================================
   ACTUALIZAR JORNADA
===================================================== */

export const actualizarJornada = async (
  id: string,
  payload: ActualizarJornadaPayload,
): Promise<JornadaAlquiler> => {
  const response = await api.put<ApiResponse<JornadaAlquiler>>(
    `/jornadas-alquiler/${id}`,
    payload,
  );

  return response.data.data;
};

/* =====================================================
   ELIMINAR JORNADA
===================================================== */

export const eliminarJornada = async (
  id: string,
): Promise<{
  id: string;
  contrato_id: string;
  detalle_contrato_id: string;
  fecha: string;
  eliminado: boolean;
}> => {
  const response = await api.delete<
    ApiResponse<{
      id: string;
      contrato_id: string;
      detalle_contrato_id: string;
      fecha: string;
      eliminado: boolean;
    }>
  >(`/jornadas-alquiler/${id}`);

  return response.data.data;
};

/* =====================================================
   UTILIDADES DE PRESENTACIÓN
===================================================== */

export const obtenerTextoEstadoJornada = (
  estado: EstadoJornadaAlquiler,
): string => {
  switch (estado) {
    case "trabajado":
      return "Trabajado";

    case "no_laborable":
      return "No laborable";

    case "suspendido":
      return "Suspendido";

    case "cancelado":
      return "Cancelado";

    default:
      return estado;
  }
};

export const obtenerClaseEstadoJornada = (
  estado: EstadoJornadaAlquiler,
): string => {
  switch (estado) {
    case "trabajado":
      return "bg-green-100 text-green-700";

    case "no_laborable":
      return "bg-slate-100 text-slate-700";

    case "suspendido":
      return "bg-amber-100 text-amber-700";

    case "cancelado":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};
