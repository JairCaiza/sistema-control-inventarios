import { api } from "../../../services/api";

/* =========================
   TIPOS
========================= */

export interface RegistrarPagoContratoData {
  cuenta_id: string;
  monto: number;
  metodo_pago: string;
  concepto: string;
  observaciones?: string;
  fecha?: string;
}

export interface CuentaFinanciera {
  id: string;
  nombre: string;
  tipo: string;
  saldo_actual: number | string;
  activa?: boolean;
}

export interface PagoContrato {
  id: string;
  contrato_id: string;
  cuenta_id: string;
  cuenta?: string;
  monto: number | string;
  fecha: string;
  metodo_pago: string;
  concepto: string;
  observaciones?: string | null;
  fecha_creacion: string;
}

export interface ResultadoPagoContrato {
  contrato_id: string;
  numero_contrato: string;
  total: number;
  pagado: number;
  saldo_pendiente: number;
  estado: string;
  pago: PagoContrato;
  transaccion: {
    id: string;
    cuenta_id: string;
    tipo: string;
    monto: number | string;
    descripcion: string;
    fecha: string;
    origen_modulo: string;
    origen_id: string;
  };
  mensaje: string;
}

/* =========================
   REGISTRAR PAGO
========================= */

export const registrarPagoContrato = async (
  contratoId: string,
  data: RegistrarPagoContratoData,
): Promise<ResultadoPagoContrato> => {
  const response = await api.post(`/contratos/${contratoId}/pagos`, data);

  /*
   * El backend devuelve:
   * {
   *   success: true,
   *   message: "...",
   *   data: {...}
   * }
   */
  return response.data.data;
};

/* =========================
   LISTAR PAGOS
========================= */

export const listarPagosContrato = async (
  contratoId: string,
): Promise<PagoContrato[]> => {
  const response = await api.get(`/contratos/${contratoId}/pagos`);

  return response.data.data || response.data;
};

/* =========================
   LISTAR CUENTAS FINANCIERAS
========================= */

export const listarCuentasFinancieras = async (): Promise<
  CuentaFinanciera[]
> => {
  const response = await api.get("/cuentas-financieras");

  return response.data.data || response.data;
};
