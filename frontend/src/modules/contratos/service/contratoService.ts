import { api } from "../../../services/api";

export const getContratos = async () => {
  const res = await api.get("/contratos");
  return res.data.data;
};

export const createContrato = async (data: unknown) => {
  const res = await api.post("/contratos", data);
  return res.data;
};
export const agregarActivoContrato = async (
  contratoId: string,
  data: unknown,
) => {
  const res = await api.post(`/contratos/${contratoId}/activos`, data);
  return res.data;
};
export const getContratoById = async (id: string) => {
  const res = await api.get(`/contratos/${id}`);
  return res.data.data;
};
