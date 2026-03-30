import { api } from "../../../services/api";

export const getUsers = async () => {
  const res = await api.get("/users");
  return res.data.data;
};

export const createUser = async (data: unknown) => {
  const res = await api.post("/users", data);
  return res.data;
};
