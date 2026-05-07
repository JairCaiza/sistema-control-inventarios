import { api } from "../../../services/api";

export const getUsers = async () => {
  const res = await api.get("/users");
  return res.data.data;
};

export const createUser = async (data: unknown) => {
  const res = await api.post("/users", data);
  return res.data;
};
// Actualizar usuario
export const updateUser = async (id: string, data: unknown) => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

export const toggleUserStatus = async (id: string, activo: boolean) => {
  const res = await api.put(`/users/${id}/status`, {
    activo: activo,
  });

  return res.data;
};
