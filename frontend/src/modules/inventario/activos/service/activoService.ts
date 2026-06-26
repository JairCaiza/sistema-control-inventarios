import { api } from "../../../../services/api";

export interface Activo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;

  categoria: string;
  ubicacion: string;

  categoria_id: string;
  ubicacion_id: string;

  estado: string;
  tipo_control: string;

  cantidad_total: number;
  valor_reposicion?: number;
}

export interface CreateActivoData {
  nombre: string;
  descripcion?: string;

  categoria_id: string;
  ubicacion_id: string;

  estado: string;
  tipo_control: string;

  cantidad_total: number;
  valor_reposicion?: number;
}

export const getActivos = async (): Promise<Activo[]> => {
  const res = await api.get("/activos");
  return res.data.data;
};

export const createActivo = async (data: CreateActivoData) => {
  const res = await api.post("/activos", data);
  return res.data.data;
};

export const getReporteInventario = async () => {
  const res = await api.get("/activos/reporte");
  return res.data.data;
};

export const exportarInventarioPDF = async () => {
  window.open(`${import.meta.env.VITE_API_URL}/activos/reporte/pdf`, "_blank");
};

export const exportarInventarioExcel = async () => {
  window.open(
    `${import.meta.env.VITE_API_URL}/activos/reporte/excel`,
    "_blank",
  );
};
export const updateEstadoActivo = async (id: string, estado: string) => {
  const res = await api.patch(`/activos/${id}/estado`, { estado });

  return res.data.data;
};
