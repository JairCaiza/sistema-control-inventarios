import { api } from "../../../../services/api";

/* =========================
   TIPADO CONTROL DIARIO
========================= */
export interface ControlDiario {
  id?: string;

  obra_id: string;

  fecha: string;

  actividad: string;

  descripcion?: string;

  hora_inicio?: string;

  hora_fin?: string;

  avance?: number;

  observaciones?: string;

  clima?: string;
}

/* =========================
   REGISTRAR CONTROL DIARIO
========================= */
export const registrarControlDiario = async (
  data: ControlDiario,
): Promise<ControlDiario> => {
  console.log("ENVIANDO CONTROL DIARIO:", data);

  const response = await api.post("/obras/controles-diarios", data);

  console.log("RESPUESTA:", response.data);

  return response.data.data;
};

/* =========================
   LISTAR CONTROLES POR OBRA
========================= */
export const getControlesDiariosPorObra = async (
  obraId: string,
): Promise<ControlDiario[]> => {
  console.log("CARGANDO CONTROLES DE OBRA:", obraId);

  const response = await api.get(`/obras/controles-diarios/${obraId}`);

  console.log("CONTROLES:", response.data);

  return response.data.data;
};
