import { api } from "../../../../services/api";

/* =====================================================
   INTERFACES
===================================================== */

export interface Transferencia {
  id: string;
  cuenta_id: string;
  cuenta_destino_id: string;
  tipo: "transferencia";
  monto: number | string;
  descripcion: string;
  fecha: string;
  referencia_id: string | null;
  origen_modulo: string | null;
  origen_id: string | null;
  fecha_creacion: string;

  cuenta_origen_nombre: string;
  cuenta_origen_tipo: string;

  cuenta_destino_nombre: string;
  cuenta_destino_tipo: string;
}

export interface RegistrarTransferenciaDTO {
  cuenta_id: string;
  cuenta_destino_id: string;
  monto: number;
  descripcion: string;
  fecha: string;
  referencia_id?: string | null;
  origen_modulo?: string;
  origen_id?: string | null;
}

export interface CuentaTransferenciaActualizada {
  id: string;
  nombre: string;
  tipo: string;
  saldo_actual: number | string;
  activo: boolean;
}

export interface RegistrarTransferenciaResponse {
  success: boolean;
  message: string;
  data: {
    transaccion: Transferencia;
    cuenta_origen: CuentaTransferenciaActualizada;
    cuenta_destino: CuentaTransferenciaActualizada;
  };
}

export interface ListarTransferenciasResponse {
  success: boolean;
  data: Transferencia[];
}

export interface FiltrosTransferencias {
  cuenta_id?: string;
  cuenta_origen_id?: string;
  cuenta_destino_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

/* =====================================================
   REGISTRAR TRANSFERENCIA
===================================================== */

export const registrarTransferencia = async (
  datos: RegistrarTransferenciaDTO,
): Promise<RegistrarTransferenciaResponse> => {
  const response = await api.post<RegistrarTransferenciaResponse>(
    "/transacciones/transferencias",
    datos,
  );

  return response.data;
};

/* =====================================================
   LISTAR TRANSFERENCIAS
===================================================== */

export const getTransferencias = async (
  filtros: FiltrosTransferencias = {},
): Promise<Transferencia[]> => {
  const params = Object.fromEntries(
    Object.entries(filtros).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

  const response = await api.get<ListarTransferenciasResponse>(
    "/transacciones/transferencias",
    {
      params,
    },
  );

  return response.data.data ?? [];
};
