import { api } from "../../../../services/api";

export interface Movimiento {
  id: string;
  activo: string;
  tipo_movimiento: "entrada" | "salida" | "ajuste";
  cantidad: number;
  motivo: string;
  referencia: string | null;
  fecha_creacion: string;
}

export const getMovimientos = async (): Promise<Movimiento[]> => {
  const res = await api.get("/movimientos");
  return res.data.data;
};

export const createMovimiento = async (data: {
  activo_id: string;
  tipo_movimiento: string;
  cantidad: number;
  motivo: string;
  referencia: string;
}) => {
  const res = await api.post("/movimientos", data);
  return res.data;
};
