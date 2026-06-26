import { api } from "../../../../services/api";

export interface Movimiento {
  id: string;

  activo?: string;

  tipo_movimiento: "entrada" | "salida" | "ajuste";

  cantidad: number;

  motivo: string;

  referencia: string | null;

  fecha_creacion: string;
}

export interface KardexMovimiento {
  fecha: string;

  tipo: string;

  entrada: number;

  salida: number;

  stock: number;
}

export interface CreateMovimientoData {
  activo_id: string;

  tipo_movimiento: "entrada" | "salida" | "ajuste";

  cantidad: number;

  motivo: string;

  referencia: string;
}

/* =========================
   LISTAR MOVIMIENTOS
========================= */

export const getMovimientos = async (): Promise<Movimiento[]> => {
  const res = await api.get("/movimientos");

  return res.data.data;
};

/* =========================
   CREAR MOVIMIENTO
========================= */

export const createMovimiento = async (data: CreateMovimientoData) => {
  const res = await api.post("/movimientos", data);

  return res.data.data;
};

/* =========================
   HISTORIAL POR ACTIVO
========================= */

export const getHistorialActivo = async (
  activo_id: string,
): Promise<Movimiento[]> => {
  const res = await api.get(`/movimientos/activo/${activo_id}`);

  return res.data.data;
};

/* =========================
   KARDEX
========================= */

export const getKardexActivo = async (
  activo_id: string,
): Promise<KardexMovimiento[]> => {
  const res = await api.get(`/movimientos/kardex/${activo_id}`);

  return res.data.data;
};
