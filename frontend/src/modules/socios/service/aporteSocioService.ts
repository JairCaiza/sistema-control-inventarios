import { api } from "../../../services/api";

/* =====================================================
   TIPOS GENERALES
===================================================== */

export type TipoAporteSocio = "aporte" | "retiro";

export type EstadoAporteSocio = "pendiente" | "confirmado" | "anulado";

/* =====================================================
   APORTE O RETIRO
===================================================== */

export interface AporteSocio {
  id: string;

  socio_id: string;
  socio_nombre: string;
  socio_identificacion?: string | null;

  cuenta_id: string;
  cuenta_nombre?: string | null;
  cuenta_tipo?: string | null;
  cuenta_saldo_actual?: number | string;

  tipo: TipoAporteSocio;

  monto: number | string;

  fecha: string;

  metodo_pago?: string | null;

  referencia?: string | null;

  estado: EstadoAporteSocio;

  observaciones?: string | null;

  transaccion_id?: string | null;

  fecha_creacion?: string;

  fecha_actualizacion?: string;
}

/* =====================================================
   DATOS PARA CREAR
===================================================== */

export interface CrearAporteSocioData {
  socio_id: string;

  cuenta_id: string;

  tipo: TipoAporteSocio;

  monto: number;

  fecha: string;

  metodo_pago?: string | null;

  referencia?: string | null;

  estado?: "pendiente" | "confirmado";

  observaciones?: string | null;
}

/* =====================================================
   DATOS PARA ACTUALIZAR
===================================================== */

export interface ActualizarAporteSocioData {
  socio_id?: string;

  cuenta_id?: string;

  tipo?: TipoAporteSocio;

  monto?: number;

  fecha?: string;

  metodo_pago?: string | null;

  referencia?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   FILTROS
===================================================== */

export interface FiltrosAportes {
  buscar?: string;

  socio_id?: string;

  cuenta_id?: string;

  tipo?: TipoAporteSocio | "";

  estado?: EstadoAporteSocio | "";

  fecha_desde?: string;

  fecha_hasta?: string;
}

/* =====================================================
   RESUMEN
===================================================== */

export interface ResumenAportes {
  totalAportes: number;

  totalRetiros: number;

  capitalNeto: number;

  cantidadAportes: number;

  cantidadRetiros: number;
}

/* =====================================================
   RESPUESTAS DEL BACKEND
===================================================== */

interface ListaAportesResponse {
  success: boolean;

  message?: string;

  total: number;

  data: AporteSocio[];
}

interface AporteResponse {
  success: boolean;

  message?: string;

  data: AporteSocio;
}

interface ResumenBackend {
  total_aportes: number | string;

  total_retiros: number | string;

  capital_neto: number | string;

  cantidad_aportes: number | string;

  cantidad_retiros: number | string;
}

interface ResumenAportesResponse {
  success: boolean;

  message?: string;

  data: ResumenBackend;
}

interface EliminarAporteResponse {
  success: boolean;

  message: string;
}

/* =====================================================
   NORMALIZAR APORTE
===================================================== */

const normalizarAporte = (aporte: AporteSocio): AporteSocio => {
  return {
    ...aporte,

    monto: Number(aporte.monto || 0),

    cuenta_saldo_actual:
      aporte.cuenta_saldo_actual !== undefined
        ? Number(aporte.cuenta_saldo_actual || 0)
        : undefined,
  };
};

/* =====================================================
   PREPARAR FILTROS
===================================================== */

const prepararFiltros = (filtros: FiltrosAportes): Record<string, string> => {
  const params: Record<string, string> = {};

  if (filtros.buscar?.trim()) {
    params.buscar = filtros.buscar.trim();
  }

  if (filtros.socio_id) {
    params.socio_id = filtros.socio_id;
  }

  if (filtros.cuenta_id) {
    params.cuenta_id = filtros.cuenta_id;
  }

  if (filtros.tipo) {
    params.tipo = filtros.tipo;
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

  return params;
};

/* =====================================================
   LISTAR APORTES Y RETIROS
===================================================== */

export const getAportesSocios = async (
  filtros: FiltrosAportes = {},
): Promise<AporteSocio[]> => {
  const response = await api.get<ListaAportesResponse>("/aportes-socios", {
    params: prepararFiltros(filtros),
  });

  const movimientos = response.data.data ?? [];

  return movimientos.map(normalizarAporte);
};

/* =====================================================
   OBTENER RESUMEN
===================================================== */

export const getResumenAportes = async (
  filtros: Pick<
    FiltrosAportes,
    "socio_id" | "fecha_desde" | "fecha_hasta"
  > = {},
): Promise<ResumenAportes> => {
  const params: Record<string, string> = {};

  if (filtros.socio_id) {
    params.socio_id = filtros.socio_id;
  }

  if (filtros.fecha_desde) {
    params.fecha_desde = filtros.fecha_desde;
  }

  if (filtros.fecha_hasta) {
    params.fecha_hasta = filtros.fecha_hasta;
  }

  const response = await api.get<ResumenAportesResponse>(
    "/aportes-socios/resumen",
    {
      params,
    },
  );

  const resumen = response.data.data;

  return {
    totalAportes: Number(resumen?.total_aportes || 0),

    totalRetiros: Number(resumen?.total_retiros || 0),

    capitalNeto: Number(resumen?.capital_neto || 0),

    cantidadAportes: Number(resumen?.cantidad_aportes || 0),

    cantidadRetiros: Number(resumen?.cantidad_retiros || 0),
  };
};

/* =====================================================
   OBTENER APORTE O RETIRO POR ID
===================================================== */

export const getAporteById = async (id: string): Promise<AporteSocio> => {
  const response = await api.get<AporteResponse>(`/aportes-socios/${id}`);

  return normalizarAporte(response.data.data);
};

/* =====================================================
   CREAR APORTE O RETIRO
===================================================== */

export const createAporteSocio = async (
  data: CrearAporteSocioData,
): Promise<AporteSocio> => {
  const payload: CrearAporteSocioData = {
    socio_id: data.socio_id,

    cuenta_id: data.cuenta_id,

    tipo: data.tipo,

    monto: Number(data.monto),

    fecha: data.fecha,

    metodo_pago: data.metodo_pago?.trim() || null,

    referencia: data.referencia?.trim() || null,

    estado: data.estado || "confirmado",

    observaciones: data.observaciones?.trim() || null,
  };

  const response = await api.post<AporteResponse>("/aportes-socios", payload);

  return normalizarAporte(response.data.data);
};

/* =====================================================
   ALIAS OPCIONAL PARA COMPATIBILIDAD
===================================================== */

export const createAporte = createAporteSocio;

/* =====================================================
   ACTUALIZAR APORTE O RETIRO PENDIENTE
===================================================== */

export const updateAporteSocio = async (
  id: string,
  data: ActualizarAporteSocioData,
): Promise<AporteSocio> => {
  const payload: ActualizarAporteSocioData = {};

  if (data.socio_id !== undefined) {
    payload.socio_id = data.socio_id;
  }

  if (data.cuenta_id !== undefined) {
    payload.cuenta_id = data.cuenta_id;
  }

  if (data.tipo !== undefined) {
    payload.tipo = data.tipo;
  }

  if (data.monto !== undefined) {
    payload.monto = Number(data.monto);
  }

  if (data.fecha !== undefined) {
    payload.fecha = data.fecha;
  }

  if (data.metodo_pago !== undefined) {
    payload.metodo_pago = data.metodo_pago?.trim() || null;
  }

  if (data.referencia !== undefined) {
    payload.referencia = data.referencia?.trim() || null;
  }

  if (data.observaciones !== undefined) {
    payload.observaciones = data.observaciones?.trim() || null;
  }

  const response = await api.put<AporteResponse>(
    `/aportes-socios/${id}`,
    payload,
  );

  return normalizarAporte(response.data.data);
};

/* =====================================================
   ALIAS OPCIONAL PARA COMPATIBILIDAD
===================================================== */

export const updateAporte = updateAporteSocio;

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

export const changeEstadoAporte = async (
  id: string,
  estado: EstadoAporteSocio,
): Promise<AporteSocio> => {
  const response = await api.patch<AporteResponse>(
    `/aportes-socios/${id}/estado`,
    {
      estado,
    },
  );

  return normalizarAporte(response.data.data);
};

/* =====================================================
   ELIMINAR MOVIMIENTO PENDIENTE
===================================================== */

export const deleteAporte = async (
  id: string,
): Promise<EliminarAporteResponse> => {
  const response = await api.delete<EliminarAporteResponse>(
    `/aportes-socios/${id}`,
  );

  return response.data;
};

/* =====================================================
   EXPORTACIÓN AGRUPADA
===================================================== */

export const aporteSocioService = {
  getAportesSocios,
  getResumenAportes,
  getAporteById,
  createAporteSocio,
  createAporte,
  updateAporteSocio,
  updateAporte,
  changeEstadoAporte,
  deleteAporte,
};
