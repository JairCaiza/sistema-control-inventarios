import { api } from "../../../../services/api";

export interface InventarioReporte {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  cantidad_total: number;
}

/* REPORTE INVENTARIO */
export const getInventarioReporte = async (): Promise<InventarioReporte[]> => {
  const res = await api.get("/activos");
  return res.data.data;
};

/* EXPORTAR PDF */
export const exportInventarioPDF = async () => {
  const res = await api.get("/activos/reporte/pdf", {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", "reporte_inventario.pdf");

  document.body.appendChild(link);
  link.click();
};

/* EXPORTAR EXCEL */
export const exportInventarioExcel = async () => {
  const res = await api.get("/activos/reporte/excel", {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", "reporte_inventario.xlsx");

  document.body.appendChild(link);
  link.click();
};
