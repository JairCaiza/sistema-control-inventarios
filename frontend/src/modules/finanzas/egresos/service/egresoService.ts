import { api } from "../../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export interface Egreso {
  id: string;
  cuenta_id: string;
  tipo: "egreso";
  monto: number | string;
  descripcion: string;
  fecha: string;

  referencia_id: string | null;
  obra_id: string | null;
  control_diario_id: string | null;

  origen_modulo: string | null;
  origen_id: string | null;

  fecha_creacion: string;

  /* Campos obtenidos mediante JOIN */
  cuenta_nombre: string;
  cuenta_tipo: string;
}

export interface RegistrarEgresoDTO {
  cuenta_id: string;
  monto: number;
  descripcion: string;
  fecha: string;

  referencia_id?: string | null;
  obra_id?: string | null;
  control_diario_id?: string | null;

  origen_modulo?: string;
  origen_id?: string | null;
}

export interface CuentaActualizadaEgreso {
  id: string;
  nombre: string;
  tipo: string;
  saldo_actual: number | string;
  activo: boolean;
}

export interface RegistrarEgresoResponse {
  transaccion: Egreso;
  cuenta: CuentaActualizadaEgreso;
}

export interface FiltrosEgresos {
  cuenta_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

/* =====================================================
   REGISTRAR EGRESO
===================================================== */

export const registrarEgreso = async (
  datos: RegistrarEgresoDTO,
): Promise<RegistrarEgresoResponse> => {
  const response = await api.post("/transacciones/egresos", datos);

  return response.data.data;
};

/* =====================================================
   LISTAR EGRESOS
===================================================== */

export const getEgresos = async (
  filtros: FiltrosEgresos = {},
): Promise<Egreso[]> => {
  const params: Record<string, string> = {};

  if (filtros.cuenta_id) {
    params.cuenta_id = filtros.cuenta_id;
  }

  if (filtros.fecha_inicio) {
    params.fecha_inicio = filtros.fecha_inicio;
  }

  if (filtros.fecha_fin) {
    params.fecha_fin = filtros.fecha_fin;
  }

  const response = await api.get("/transacciones/egresos", {
    params,
  });

  return response.data.data ?? [];
};
