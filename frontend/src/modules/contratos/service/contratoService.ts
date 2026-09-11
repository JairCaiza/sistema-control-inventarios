import { api } from "../../../services/api";

export interface ActivoContrato {
  id: string;
  activo_id?: string;
  nombre: string;
  cantidad: number | string;
  precio_dia: number | string;
  dias?: number | string;
  subtotal?: number | string;
}

export interface Contrato {
  id: string;
  numero_contrato?: string;
  cliente_id: string;
  cliente?: string;
  fecha_inicio: string;
  fecha_fin: string;
  observacion?: string | null;
  estado?: string;
  total?: number | string;
  pagado?: number | string;
  saldo_pendiente?: number | string;
  penalidad_total?: number | string;
  activos?: ActivoContrato[];
}

export interface CreateContratoDTO {
  cliente_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  observacion?: string;
}

export interface AgregarActivoDTO {
  activo_id: string;
  cantidad: number;
  precio_diario: number;
}
export const getContratos = async (): Promise<Contrato[]> => {
  const res = await api.get("/contratos");
  return res.data.data || [];
};

export const createContrato = async (
  data: CreateContratoDTO,
): Promise<Contrato> => {
  const res = await api.post("/contratos", data);
  return res.data.data;
};

export const agregarActivoContrato = async (
  contratoId: string,
  data: AgregarActivoDTO,
) => {
  const res = await api.post(`/contratos/${contratoId}/activos`, data);
  return res.data.data || res.data;
};

export const getContratoById = async (id: string): Promise<Contrato> => {
  const res = await api.get(`/contratos/${id}`);
  return res.data.data;
};
