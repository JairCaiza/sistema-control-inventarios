import { api } from "../../../../services/api";

export interface EmpleadoObra {
  id: string;

  obra_id: string;

  empleado_id: string;

  cargo_obra?: string;

  fecha_inicio?: string;

  fecha_fin?: string;

  salario_acordado?: number;

  observaciones?: string;

  activo?: boolean;

  fecha_asignacion?: string;

  nombres?: string;
  apellidos?: string;
  cedula?: string;
}

/* =========================
   ASIGNAR EMPLEADO
========================= */
export const asignarEmpleadoObra = async (
  data: Partial<EmpleadoObra>,
): Promise<EmpleadoObra> => {
  console.log("ENVIANDO:", data);
  const response = await api.post("/obras/asignar-empleado", data);
  console.log("RESPUESTA:", response.data);
  return response.data.data;
};

/* =========================
   EMPLEADOS DE UNA OBRA
========================= */
export const getEmpleadosObra = async (
  obraId: string,
): Promise<EmpleadoObra[]> => {
  const response = await api.get(`/obras/ver_empleados/${obraId}`);

  return response.data.data;
};

/* =========================
   DESASIGNAR EMPLEADO
========================= */
export const desasignarEmpleadoObra = async (
  id: string,
  motivo_salida: string,
  observaciones: string,
): Promise<EmpleadoObra> => {
  const response = await api.patch(`/obras/${id}/desasignar`, {
    motivo_salida,
    observaciones,
  });

  return response.data.data;
};
