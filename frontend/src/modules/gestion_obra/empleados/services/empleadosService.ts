import { api } from "../../../../services/api";

export interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  cargo?: string;
  tipo_pago: "diario" | "semanal" | "mensual";
  salario_base?: number;
  fecha_ingreso?: string;
  activo: boolean;
  observaciones?: string;
}

/* =========================
   GET EMPLEADOS
========================= */
export const getEmpleados = async (): Promise<Empleado[]> => {
  const response = await api.get("/empleados");

  return response.data.data;
};

/* =========================
   GET EMPLEADO BY ID
========================= */
export const getEmpleadoById = async (id: string): Promise<Empleado> => {
  const response = await api.get(`/empleados/${id}`);

  return response.data.data;
};

/* =========================
   CREATE EMPLEADO
========================= */
export const createEmpleado = async (
  data: Partial<Empleado>,
): Promise<Empleado> => {
  const response = await api.post("/empleados", data);

  return response.data.data;
};

/* =========================
   UPDATE EMPLEADO
========================= */
export const updateEmpleado = async (
  id: string,
  data: Partial<Empleado>,
): Promise<Empleado> => {
  const response = await api.put(`/empleados/${id}`, data);

  return response.data.data;
};

/* =========================
   TOGGLE STATUS
========================= */
export const toggleEmpleadoStatus = async (
  id: string,
  activo: boolean,
): Promise<Empleado> => {
  const response = await api.put(`/empleados/${id}/status`, {
    activo,
  });

  return response.data.data;
};

/* =========================
   DELETE EMPLEADO
========================= */
export const deleteEmpleado = async (id: string): Promise<void> => {
  await api.delete(`/empleados/${id}`);
};
