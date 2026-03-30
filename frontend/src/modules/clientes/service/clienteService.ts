import { api } from "../../../services/api";

export const getClientes = async () => {
  const res = await api.get("/clientes");
  return res.data.data;
};

export const createCliente = async (data: unknown) => {
  const res = await api.post("/clientes", data);
  return res.data;
};
