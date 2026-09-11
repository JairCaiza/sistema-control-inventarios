import api from "../../../services/api";

/* =====================================================
   TIPOS BASE
===================================================== */

export interface SocioPerfil {
  id: string;
  nombre: string;
  identificacion: string;
  contacto?: string | null;
  fecha_ingreso?: string | null;
  activo: boolean;

  total_aportes: number;
  total_retiros: number;
  capital_neto: number;
  porcentaje_participacion: number;
}

export interface ResumenSocio {
  socio_id: string;
  nombre: string;

  total_aportes: number;
  total_retiros: number;
  capital_neto: number;
  porcentaje_participacion: number;
}

/* =====================================================
   APORTES / RETIROS
===================================================== */

export type TipoMovimientoSocio = "aporte" | "retiro";

export type EstadoMovimientoSocio =
  | "pendiente"
  | "confirmado"
  | "anulado"
  | string;

export interface MovimientoSocio {
  id: string;

  socio_id: string;
  socio_nombre: string;
  socio_identificacion?: string | null;

  cuenta_id?: string | null;
  cuenta_nombre?: string | null;
  cuenta_tipo?: string | null;

  tipo: TipoMovimientoSocio;

  monto: number;

  fecha: string;

  metodo_pago?: string | null;

  referencia?: string | null;

  estado: EstadoMovimientoSocio;

  observaciones?: string | null;

  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

/* =====================================================
   UTILIDADES
===================================================== */

export type EstadoUtilidadSocio = "pendiente" | "pagado" | "anulado" | string;

export interface UtilidadSocio {
  id: string;

  socio_id: string;
  socio_nombre: string;
  socio_identificacion?: string | null;

  periodo: string;

  utilidad_periodo: number;
  utilidad_base: number;

  porcentaje_aplicado: number;

  monto: number;

  estado: EstadoUtilidadSocio;

  cuenta_id?: string | null;
  cuenta_nombre?: string | null;
  cuenta_tipo?: string | null;

  metodo_pago?: string | null;

  referencia?: string | null;

  fecha_pago?: string | null;

  observaciones?: string | null;

  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

/* =====================================================
   RESPUESTAS BACKEND
===================================================== */

interface PerfilResponse {
  ok?: boolean;
  success?: boolean;

  message?: string;

  socio?: SocioPerfil;

  data?: SocioPerfil;
}

interface ResumenResponse {
  ok?: boolean;
  success?: boolean;

  message?: string;

  resumen?: ResumenSocio;

  data?: ResumenSocio;
}

interface AportesResponse {
  ok?: boolean;
  success?: boolean;

  message?: string;

  total?: number;

  data?: MovimientoSocio[];
}

interface UtilidadesResponse {
  ok?: boolean;
  success?: boolean;

  message?: string;

  total?: number;

  data?: UtilidadSocio[];
}

/* =====================================================
   ERROR PERSONALIZADO
===================================================== */

export interface PortalSocioError {
  message: string;
  status?: number;
  data?: unknown;
}

/* =====================================================
   HELPER PARA MANEJO DE ERRORES
===================================================== */

const manejarError = (error: any, mensajeDefault: string): PortalSocioError => {
  const mensaje =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    mensajeDefault;

  const status = error?.response?.status;

  return {
    message: mensaje,
    status,
    data: error?.response?.data,
  };
};

/* =====================================================
   OBTENER MI PERFIL
===================================================== */

export const getMiPerfilSocio = async (): Promise<SocioPerfil> => {
  try {
    const response = await api.get<PerfilResponse>("/socios/mi-perfil");

    const perfil = response.data.socio ?? response.data.data;

    if (!perfil) {
      throw {
        response: {
          status: 404,
          data: {
            message:
              "No se encontró información asociada al socio autenticado.",
          },
        },
      };
    }

    return perfil;
  } catch (error: any) {
    throw manejarError(error, "No se pudo obtener tu perfil de socio.");
  }
};

/* =====================================================
   OBTENER MI RESUMEN
===================================================== */

export const getMiResumenSocio = async (): Promise<ResumenSocio> => {
  try {
    const response = await api.get<ResumenResponse>("/socios/mi-resumen");

    const resumen = response.data.resumen ?? response.data.data;

    if (!resumen) {
      throw {
        response: {
          status: 404,
          data: {
            message:
              "No se encontró el resumen financiero del socio autenticado.",
          },
        },
      };
    }

    return resumen;
  } catch (error: any) {
    throw manejarError(error, "No se pudo obtener tu resumen de socio.");
  }
};

/* =====================================================
   OBTENER MIS APORTES Y RETIROS
===================================================== */

export const getMisAportes = async (): Promise<MovimientoSocio[]> => {
  try {
    const response = await api.get<AportesResponse>(
      "/aportes-socios/mis-aportes",
    );

    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error: any) {
    throw manejarError(error, "No se pudieron obtener tus aportes y retiros.");
  }
};

/* =====================================================
   OBTENER MIS UTILIDADES
===================================================== */

export const getMisUtilidades = async (): Promise<UtilidadSocio[]> => {
  try {
    const response = await api.get<UtilidadesResponse>(
      "/utilidades-socios/mis-utilidades",
    );

    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error: any) {
    throw manejarError(error, "No se pudieron obtener tus utilidades.");
  }
};

/* =====================================================
   CARGAR DASHBOARD COMPLETO
===================================================== */

export interface DashboardSocioData {
  resumen: ResumenSocio;
  aportes: MovimientoSocio[];
  utilidades: UtilidadSocio[];
}

export const getDashboardSocio = async (): Promise<DashboardSocioData> => {
  try {
    const [resumen, aportes, utilidades] = await Promise.all([
      getMiResumenSocio(),
      getMisAportes(),
      getMisUtilidades(),
    ]);

    return {
      resumen,
      aportes,
      utilidades,
    };
  } catch (error: any) {
    if (error?.message && typeof error.message === "string") {
      throw error;
    }

    throw manejarError(
      error,
      "No se pudo cargar la información del portal del socio.",
    );
  }
};

/* =====================================================
   EXPORTACIÓN AGRUPADA OPCIONAL
===================================================== */

const portalSocioService = {
  getMiPerfilSocio,
  getMiResumenSocio,
  getMisAportes,
  getMisUtilidades,
  getDashboardSocio,
};

export default portalSocioService;
