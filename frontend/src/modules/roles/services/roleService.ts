import { api } from "../../../services/api";

export const getRoles = async () => {
  const res = await api.get("/roles");
  return res.data.data;
};
export const createRole = async (data: unknown) => {
  const res = await api.post("/roles", data);
  return res.data;
};
