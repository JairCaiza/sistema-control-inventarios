import { api } from "../../../services/api";

/* 📌 Tipos */
export interface Contrato {
  id: string;
  cliente_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  observacion: string;
}

export interface CreateContratoDTO {
  cliente_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  observacion?: string;
}

/* 📌 Obtener contratos */
export const getContratos = async (): Promise<Contrato[]> => {
  const res = await api.get("/contratos");
  return res.data.data;
};

/* 📌 Crear contrato */
export const createContrato = async (
  data: CreateContratoDTO,
): Promise<Contrato> => {
  const res = await api.post("/contratos", data);
  return res.data.data; // 👈 importante
};

/* 📌 Agregar activos */
export interface AgregarActivoDTO {
  activo_id: string;
  cantidad: number;
}

export const agregarActivoContrato = async (
  contratoId: string,
  data: AgregarActivoDTO,
) => {
  const res = await api.post(`/contratos/${contratoId}/activos`, data);
  return res.data;
};

/* 📌 Obtener contrato por ID */
export const getContratoById = async (id: string): Promise<Contrato> => {
  const res = await api.get(`/contratos/${id}`);
  return res.data.data;
};
