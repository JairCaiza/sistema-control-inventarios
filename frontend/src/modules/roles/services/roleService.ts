import { api } from "../../../services/api";

/* =========================
   OBTENER ROLES
========================= */
export const getRoles = async () => {
  const res = await api.get("/roles");
  return res.data.data;
};

/* =========================
   CREAR ROL
========================= */
export const createRole = async (data: unknown) => {
  const res = await api.post("/roles", data);
  return res.data;
};

/* =========================
   ACTUALIZAR ROL
========================= */
export const updateRole = async (id: string, data: unknown) => {
  const res = await api.put(`/roles/${id}`, data);
  return res.data;
};

/* =========================
   ACTIVAR / DESACTIVAR ROL
========================= */
export const toggleRoleStatus = async (id: string, activo: boolean) => {
  const res = await api.put(`/roles/${id}/status`, {
    activo,
  });

  return res.data;
};

/* =========================
   ELIMINAR ROL
========================= */
export const deleteRole = async (id: string) => {
  const res = await api.delete(`/roles/${id}`);
  return res.data;
};
