import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export interface Socio {
  id: string;

  nombre: string;

  identificacion: string;

  contacto: string | null;

  fecha_ingreso: string;

  activo: boolean;

  usuario_id?: string | null;

  fecha_creacion?: string;

  fecha_actualizacion?: string;

  /* Datos calculados por el backend */

  total_aportes: number;

  total_retiros: number;

  capital_neto: number;

  porcentaje_participacion: number;
}

/* =====================================================
   USUARIO DISPONIBLE PARA SOCIO
===================================================== */

export interface UsuarioSocioDisponible {
  id: string;

  nombre: string;

  apellido: string | null;

  correo: string;

  activo: boolean;
}

/* =====================================================
   DATOS PARA CREAR SOCIO
===================================================== */

export interface CrearSocioData {
  usuario_id: string;

  identificacion: string;

  contacto?: string | null;

  fecha_ingreso?: string | null;

  activo?: boolean;
}

/* =====================================================
   DATOS PARA ACTUALIZAR SOCIO
===================================================== */

export interface ActualizarSocioData {
  nombre?: string;

  identificacion?: string;

  contacto?: string | null;

  fecha_ingreso?: string | null;

  activo?: boolean;
}

/* =====================================================
   FILTROS
===================================================== */

export interface FiltrosSocios {
  buscar?: string;

  activo?: boolean | "";

  fecha_ingreso?: string;
}

/* =====================================================
   RESPUESTAS DEL BACKEND
===================================================== */

interface ListaSociosResponse {
  ok: boolean;

  total: number;

  socios: Socio[];
}

interface SocioResponse {
  ok: boolean;

  message?: string;

  socio: Socio;
}

interface UsuariosDisponiblesResponse {
  ok: boolean;

  total: number;

  usuarios: UsuarioSocioDisponible[];
}

interface EliminarSocioResponse {
  ok: boolean;

  message: string;

  socio?: {
    id: string;
    nombre: string;
  };
}

/* =====================================================
   NORMALIZAR SOCIO
===================================================== */

const normalizarSocio = (socio: Socio): Socio => {
  return {
    ...socio,

    total_aportes: Number(socio.total_aportes || 0),

    total_retiros: Number(socio.total_retiros || 0),

    capital_neto: Number(socio.capital_neto || 0),

    porcentaje_participacion: Number(socio.porcentaje_participacion || 0),
  };
};

/* =====================================================
   LISTAR SOCIOS
===================================================== */

export const getSocios = async (
  filtros: FiltrosSocios = {},
): Promise<Socio[]> => {
  const params: Record<string, string | boolean> = {};

  if (filtros.buscar?.trim()) {
    params.buscar = filtros.buscar.trim();
  }

  if (filtros.activo !== undefined && filtros.activo !== "") {
    params.activo = filtros.activo;
  }

  if (filtros.fecha_ingreso) {
    params.fecha_ingreso = filtros.fecha_ingreso;
  }

  const response = await api.get<ListaSociosResponse>("/socios", {
    params,
  });

  return (response.data.socios ?? []).map(normalizarSocio);
};

/* =====================================================
   LISTAR USUARIOS DISPONIBLES PARA SOCIO
===================================================== */

export const getUsuariosSocioDisponibles = async (): Promise<
  UsuarioSocioDisponible[]
> => {
  const response = await api.get<UsuariosDisponiblesResponse>(
    "/socios/usuarios-disponibles",
  );

  return response.data.usuarios ?? [];
};

/* =====================================================
   OBTENER SOCIO POR ID
===================================================== */

export const getSocioById = async (id: string): Promise<Socio> => {
  const response = await api.get<SocioResponse>(`/socios/${id}`);

  return normalizarSocio(response.data.socio);
};

/* =====================================================
   CREAR SOCIO
===================================================== */

export const createSocio = async (data: CrearSocioData): Promise<Socio> => {
  const response = await api.post<SocioResponse>("/socios", {
    usuario_id: data.usuario_id,

    identificacion: data.identificacion.trim(),

    contacto: data.contacto?.trim() || null,

    fecha_ingreso: data.fecha_ingreso || null,

    activo: data.activo ?? true,
  });

  return normalizarSocio(response.data.socio);
};

/* =====================================================
   ACTUALIZAR SOCIO
===================================================== */

export const updateSocio = async (
  id: string,
  data: ActualizarSocioData,
): Promise<Socio> => {
  const payload: ActualizarSocioData = {};

  if (data.nombre !== undefined) {
    payload.nombre = data.nombre.trim();
  }

  if (data.identificacion !== undefined) {
    payload.identificacion = data.identificacion.trim();
  }

  if (data.contacto !== undefined) {
    payload.contacto = data.contacto?.trim() || null;
  }

  if (data.fecha_ingreso !== undefined) {
    payload.fecha_ingreso = data.fecha_ingreso || null;
  }

  if (data.activo !== undefined) {
    payload.activo = data.activo;
  }

  const response = await api.put<SocioResponse>(`/socios/${id}`, payload);

  return normalizarSocio(response.data.socio);
};

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

export const changeSocioStatus = async (
  id: string,
  activo: boolean,
): Promise<Socio> => {
  const response = await api.patch<SocioResponse>(`/socios/${id}/estado`, {
    activo,
  });

  return normalizarSocio(response.data.socio);
};

/* =====================================================
   ELIMINAR SOCIO
===================================================== */

export const deleteSocio = async (
  id: string,
): Promise<EliminarSocioResponse> => {
  const response = await api.delete<EliminarSocioResponse>(`/socios/${id}`);

  return response.data;
};

/* =====================================================
   EXPORTACIÓN AGRUPADA
===================================================== */

export const sociosService = {
  getSocios,

  getUsuariosSocioDisponibles,

  getSocioById,

  createSocio,

  updateSocio,

  changeSocioStatus,

  deleteSocio,
};
