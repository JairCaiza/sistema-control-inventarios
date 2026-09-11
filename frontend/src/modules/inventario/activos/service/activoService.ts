import { api } from "../../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export type TipoControlActivo = "unidad" | "cantidad";

export type EstadoInventario =
  | "disponible"
  | "alquilado"
  | "mantenimiento"
  | "danado"
  | "perdido"
  | "dado_baja";

export interface ExistenciaActivo {
  id: string;

  ubicacion_id: string;

  ubicacion: string;

  estado: EstadoInventario;

  cantidad: number;
}
interface DeleteActivoResponse {
  success: boolean;

  message: string;

  data: {
    id: string;
    codigo: string;
    nombre: string;
  };
}

/* =====================================================
   ACTIVO
===================================================== */

export interface Activo {
  id: string;

  codigo: string;

  nombre: string;

  descripcion?: string | null;

  categoria_id: string;

  categoria: string;

  categoria_tipo?: string;

  tipo_control: TipoControlActivo;

  valor_reposicion?: number | null;

  marca?: string | null;

  color?: string | null;

  responsable?: string | null;

  observaciones?: string | null;

  activo?: boolean;

  fecha_creacion?: string;

  fecha_actualizacion?: string;

  /* =================================================
     DATOS CALCULADOS DESDE EXISTENCIAS
  ================================================= */

  cantidad_total: number;

  cantidad_disponible: number;

  cantidad_alquilada: number;

  cantidad_mantenimiento: number;

  cantidad_danada: number;

  cantidad_perdida: number;

  cantidad_dado_baja: number;

  /*
   * Para unidad normalmente será:
   *
   * disponible
   * mantenimiento
   * etc.
   *
   * Para cantidad puede ser:
   *
   * mixto
   */
  estado: EstadoInventario | "mixto";

  /*
   * Texto simplificado generado por backend.
   *
   * Ejemplo:
   *
   * Bodega Central, Obra Norte
   */
  ubicacion?: string | null;

  existencias: ExistenciaActivo[];
}

/* =====================================================
   CREAR ACTIVO
===================================================== */

export interface CreateActivoData {
  nombre: string;

  descripcion?: string | null;

  categoria_id: string;

  ubicacion_id: string;

  /*
   * Estado inicial.
   *
   * NO permitimos alquilado manualmente.
   */
  estado: "disponible" | "mantenimiento" | "danado" | "perdido" | "dado_baja";

  tipo_control: TipoControlActivo;

  /*
   * unidad:
   *
   * cantidad_total = 5
   * => backend crea 5 activos independientes.
   *
   * cantidad:
   *
   * cantidad_total = 100
   * => backend crea un registro con stock 100.
   */
  cantidad_total: number;

  valor_reposicion?: number | null;

  marca?: string | null;

  color?: string | null;

  responsable?: string | null;

  observaciones?: string | null;
}

/* =====================================================
   RESPUESTA CREACIÓN
===================================================== */

export interface CreateActivoResponse {
  tipo_control: TipoControlActivo;

  cantidad_creada: number;

  unidades_fisicas: number;

  activos: Activo[];
}

/* =====================================================
   ACTUALIZAR INFORMACIÓN
===================================================== */

export interface UpdateActivoData {
  nombre?: string;

  descripcion?: string | null;

  categoria_id?: string;

  valor_reposicion?: number | null;

  marca?: string | null;

  color?: string | null;

  responsable?: string | null;

  observaciones?: string | null;

  activo?: boolean;
}

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

export interface CambiarEstadoActivoData {
  ubicacion_id: string;

  estado_origen:
    | "disponible"
    | "mantenimiento"
    | "danado"
    | "perdido"
    | "dado_baja";

  estado_destino:
    | "disponible"
    | "mantenimiento"
    | "danado"
    | "perdido"
    | "dado_baja";

  cantidad: number;

  motivo?: string | null;
}

/* =====================================================
   REPORTE
===================================================== */

export interface ReporteInventario {
  codigo: string;

  activo: string;

  categoria: string;

  ubicacion?: string | null;

  tipo_control: TipoControlActivo;

  stock_total: number;

  disponible: number;

  alquilado: number;

  mantenimiento: number;

  danado: number;

  perdido: number;
}

/* =====================================================
   RESPUESTAS API
===================================================== */

interface ListaActivosResponse {
  success: boolean;

  total: number;

  data: Activo[];
}

interface ActivoResponse {
  success: boolean;

  message?: string;

  data: Activo;
}

interface CrearActivoResponseAPI {
  success: boolean;

  message: string;

  data: CreateActivoResponse;
}

interface ReporteResponse {
  success: boolean;

  total: number;

  data: ReporteInventario[];
}

/* =====================================================
   NORMALIZAR EXISTENCIA
===================================================== */

const normalizarExistencia = (
  existencia: ExistenciaActivo,
): ExistenciaActivo => ({
  ...existencia,

  cantidad: Number(existencia.cantidad || 0),
});

/* =====================================================
   NORMALIZAR ACTIVO
===================================================== */

const normalizarActivo = (activo: Activo): Activo => ({
  ...activo,

  valor_reposicion:
    activo.valor_reposicion !== null && activo.valor_reposicion !== undefined
      ? Number(activo.valor_reposicion)
      : null,

  cantidad_total: Number(activo.cantidad_total || 0),

  cantidad_disponible: Number(activo.cantidad_disponible || 0),

  cantidad_alquilada: Number(activo.cantidad_alquilada || 0),

  cantidad_mantenimiento: Number(activo.cantidad_mantenimiento || 0),

  cantidad_danada: Number(activo.cantidad_danada || 0),

  cantidad_perdida: Number(activo.cantidad_perdida || 0),

  cantidad_dado_baja: Number(activo.cantidad_dado_baja || 0),

  existencias: (activo.existencias || []).map(normalizarExistencia),
});

/* =====================================================
   LISTAR ACTIVOS
===================================================== */

export const getActivos = async (): Promise<Activo[]> => {
  const response = await api.get<ListaActivosResponse>("/activos");

  return (response.data.data || []).map(normalizarActivo);
};

/* =====================================================
   OBTENER ACTIVO POR ID
===================================================== */

export const getActivoById = async (id: string): Promise<Activo> => {
  const response = await api.get<ActivoResponse>(`/activos/${id}`);

  return normalizarActivo(response.data.data);
};

/* =====================================================
   CREAR ACTIVO
===================================================== */

export const createActivo = async (
  data: CreateActivoData,
): Promise<CreateActivoResponse> => {
  const response = await api.post<CrearActivoResponseAPI>("/activos", {
    nombre: data.nombre.trim(),

    descripcion: data.descripcion?.trim() || null,

    categoria_id: data.categoria_id,

    ubicacion_id: data.ubicacion_id,

    estado: data.estado,

    tipo_control: data.tipo_control,

    cantidad_total: Number(data.cantidad_total),

    valor_reposicion:
      data.valor_reposicion !== undefined && data.valor_reposicion !== null
        ? Number(data.valor_reposicion)
        : null,

    marca: data.marca?.trim() || null,

    color: data.color?.trim() || null,

    responsable: data.responsable?.trim() || null,

    observaciones: data.observaciones?.trim() || null,
  });

  return {
    ...response.data.data,

    activos: (response.data.data.activos || []).map(normalizarActivo),
  };
};

/* =====================================================
   ACTUALIZAR ACTIVO
===================================================== */

export const updateActivo = async (
  id: string,
  data: UpdateActivoData,
): Promise<Activo> => {
  const payload: UpdateActivoData = {};

  if (data.nombre !== undefined) {
    payload.nombre = data.nombre.trim();
  }

  if (data.descripcion !== undefined) {
    payload.descripcion = data.descripcion?.trim() || null;
  }

  if (data.categoria_id !== undefined) {
    payload.categoria_id = data.categoria_id;
  }

  if (data.valor_reposicion !== undefined) {
    payload.valor_reposicion =
      data.valor_reposicion !== null ? Number(data.valor_reposicion) : null;
  }

  if (data.marca !== undefined) {
    payload.marca = data.marca?.trim() || null;
  }

  if (data.color !== undefined) {
    payload.color = data.color?.trim() || null;
  }

  if (data.responsable !== undefined) {
    payload.responsable = data.responsable?.trim() || null;
  }

  if (data.observaciones !== undefined) {
    payload.observaciones = data.observaciones?.trim() || null;
  }

  if (data.activo !== undefined) {
    payload.activo = data.activo;
  }

  const response = await api.put<ActivoResponse>(`/activos/${id}`, payload);

  return normalizarActivo(response.data.data);
};

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

/*
 * ANTES:
 *
 * PATCH /activos/:id/estado
 *
 * {
 *   estado: "mantenimiento"
 * }
 *
 *
 * AHORA:
 *
 * {
 *   ubicacion_id: "...",
 *   estado_origen: "disponible",
 *   estado_destino: "mantenimiento",
 *   cantidad: 2,
 *   motivo: "Mantenimiento preventivo"
 * }
 */
export const updateEstadoActivo = async (
  id: string,
  data: CambiarEstadoActivoData,
): Promise<Activo> => {
  const response = await api.patch<ActivoResponse>(`/activos/${id}/estado`, {
    ubicacion_id: data.ubicacion_id,

    estado_origen: data.estado_origen,

    estado_destino: data.estado_destino,

    cantidad: Number(data.cantidad),

    motivo: data.motivo?.trim() || null,
  });

  return normalizarActivo(response.data.data);
};

/* =====================================================
   REPORTE INVENTARIO
===================================================== */

export const getReporteInventario = async (): Promise<ReporteInventario[]> => {
  const response = await api.get<ReporteResponse>("/activos/reporte");

  return (response.data.data || []).map((item) => ({
    ...item,

    stock_total: Number(item.stock_total || 0),

    disponible: Number(item.disponible || 0),

    alquilado: Number(item.alquilado || 0),

    mantenimiento: Number(item.mantenimiento || 0),

    danado: Number(item.danado || 0),

    perdido: Number(item.perdido || 0),
  }));
};

/* =====================================================
   EXPORTAR PDF
===================================================== */

export const exportarInventarioPDF = async () => {
  const response = await api.get("/activos/reporte/pdf", {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(
    new Blob([response.data], {
      type: "application/pdf",
    }),
  );

  const enlace = document.createElement("a");

  enlace.href = url;

  enlace.download = "reporte_inventario.pdf";

  document.body.appendChild(enlace);

  enlace.click();

  enlace.remove();

  window.URL.revokeObjectURL(url);
};

/* =====================================================
   EXPORTAR EXCEL
===================================================== */

export const exportarInventarioExcel = async () => {
  const response = await api.get("/activos/reporte/excel", {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(
    new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );

  const enlace = document.createElement("a");

  enlace.href = url;

  enlace.download = "reporte_inventario.xlsx";

  document.body.appendChild(enlace);

  enlace.click();

  enlace.remove();

  window.URL.revokeObjectURL(url);
};

export const deleteActivo = async (
  id: string,
): Promise<DeleteActivoResponse> => {
  const response = await api.delete<DeleteActivoResponse>(`/activos/${id}`);

  return response.data;
};

/* =====================================================
   EXPORTACIÓN AGRUPADA
===================================================== */

export const activoService = {
  getActivos,

  getActivoById,

  createActivo,

  updateActivo,

  updateEstadoActivo,

  getReporteInventario,

  exportarInventarioPDF,

  exportarInventarioExcel,
  deleteActivo,
};
