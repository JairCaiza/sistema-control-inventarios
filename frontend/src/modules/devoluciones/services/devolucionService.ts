// service/devolucionService.ts
import { api } from "../../../services/api";

export const getDevoluciones = async () => {
  const res = await api.get("/devoluciones");
  return res.data.data;
};

export const registrarDevolucion = async (data: {
  contrato_id: string;
  fecha_devolucion: string;
}) => {
  const res = await api.post("/devoluciones", data);
  return res.data.data;
};
