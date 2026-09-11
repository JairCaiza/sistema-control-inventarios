import { api } from "../../../../services/api";

export interface RegistrarIngresoDTO {
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

export interface Transaccion {
  id: string;
  cuenta_id: string;
  tipo: "ingreso" | "egreso" | "transferencia";
  monto: number | string;
  descripcion?: string | null;
  fecha: string;
  cuenta_nombre?: string;
  cuenta_tipo?: string;
  origen_modulo?: string | null;
  fecha_creacion?: string;
}

export const registrarIngreso = async (data: RegistrarIngresoDTO) => {
  const response = await api.post("/transacciones/ingresos", data);

  return response.data.data;
};

export const getIngresos = async (): Promise<Transaccion[]> => {
  const response = await api.get("/transacciones/ingresos");

  return response.data.data ?? [];
};
