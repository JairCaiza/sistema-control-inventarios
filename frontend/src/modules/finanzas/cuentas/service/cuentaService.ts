import { api } from "../../../../services/api";

export type TipoCuenta = "caja" | "banco" | "efectivo";

export interface CuentaFinanciera {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  saldo_actual: number | string;
  movimientos: number;
  activo: boolean;
  observaciones?: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CrearCuentaDTO {
  nombre: string;
  tipo: TipoCuenta;
  saldo_inicial: number;
  observaciones?: string | null;
}

export interface ActualizarCuentaDTO {
  nombre: string;
  tipo: TipoCuenta;
  observaciones?: string | null;
  activo: boolean;
}

export interface ResumenCuentas {
  total_cuentas: number;
  saldo_cajas: number | string;
  saldo_total: number | string;
}

/* =====================================================
   LISTAR CUENTAS
===================================================== */
export const getCuentas = async (): Promise<CuentaFinanciera[]> => {
  const response = await api.get("/cuentas-financieras");

  return response.data.data ?? [];
};

/* =====================================================
   OBTENER CUENTA
===================================================== */
export const getCuentaById = async (id: string): Promise<CuentaFinanciera> => {
  const response = await api.get(`/cuentas-financieras/${id}`);

  return response.data.data;
};

/* =====================================================
   CREAR CUENTA
===================================================== */
export const createCuenta = async (
  data: CrearCuentaDTO,
): Promise<CuentaFinanciera> => {
  const response = await api.post("/cuentas-financieras", data);

  return response.data.data;
};

/* =====================================================
   ACTUALIZAR CUENTA
===================================================== */
export const updateCuenta = async (
  id: string,
  data: ActualizarCuentaDTO,
): Promise<CuentaFinanciera> => {
  const response = await api.put(`/cuentas-financieras/${id}`, data);

  return response.data.data;
};

/* =====================================================
   CAMBIAR ESTADO
===================================================== */
export const changeCuentaStatus = async (
  id: string,
  activo: boolean,
): Promise<CuentaFinanciera> => {
  const response = await api.patch(`/cuentas-financieras/${id}/estado`, {
    activo,
  });

  return response.data.data;
};

/* =====================================================
   ELIMINAR CUENTA
===================================================== */
export const deleteCuenta = async (id: string): Promise<void> => {
  await api.delete(`/cuentas-financieras/${id}`);
};

/* =====================================================
   OBTENER RESUMEN
===================================================== */
export const getResumenCuentas = async (): Promise<ResumenCuentas> => {
  const response = await api.get("/cuentas-financieras/resumen");

  return response.data.data;
};
