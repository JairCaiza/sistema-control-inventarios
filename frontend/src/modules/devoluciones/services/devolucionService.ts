// service/devolucionService.ts
import { api } from "../../../services/api";

export const getDevoluciones = async () => {
  const res = await api.get("/devoluciones");
  return res.data.data;
};

export const registrarDevolucion = async (data: {
  contrato_id: string;
  fecha_devolucion: string;
  metodo_pago: string;
}) => {
  const res = await api.post("/devoluciones", data);
  return res.data.data;
};
export const descargarNotaPDF = async (id: string) => {
  const res = await api.get(`/notas/${id}/pdf`, {
    responseType: "blob", // 🔥 importante para PDF
  });

  return res.data;
};
