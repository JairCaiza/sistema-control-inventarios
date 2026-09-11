import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export type TipoCliente = "persona" | "empresa";

export type TipoIdentificacion = "cedula" | "ruc" | "pasaporte";

export interface Cliente {
  id: string;

  tipo_cliente: TipoCliente;

  tipo_identificacion: TipoIdentificacion;

  identificacion: string;

  nombre: string;

  apellido?: string | null;

  telefono?: string | null;

  direccion?: string | null;

  correo?: string | null;

  fecha_creacion?: string;
}

/* =====================================================
   CREAR CLIENTE
===================================================== */

export interface CreateClienteDTO {
  tipo_cliente: TipoCliente;

  tipo_identificacion: TipoIdentificacion;

  identificacion: string;

  nombre: string;

  apellido?: string | null;

  telefono?: string | null;

  direccion?: string | null;

  correo?: string | null;
}

/* =====================================================
   ACTUALIZAR CLIENTE
===================================================== */

/*
 * Como tu backend actualmente utiliza
 * el schema completo al actualizar,
 * enviamos todos los campos.
 */
export type UpdateClienteDTO = CreateClienteDTO;

/* =====================================================
   RESPUESTAS
===================================================== */

interface ListaClientesResponse {
  success: boolean;

  data: Cliente[];
}

interface ClienteResponse {
  success: boolean;

  message?: string;

  data: Cliente;
}

interface DeleteClienteResponse {
  success: boolean;

  message: string;

  data?: {
    id: string;

    nombre: string;

    apellido?: string | null;

    identificacion: string;
  };
}

/* =====================================================
   LISTAR
===================================================== */

export const getClientes = async (): Promise<Cliente[]> => {
  const response = await api.get<ListaClientesResponse>("/clientes");

  return response.data.data || [];
};

/* =====================================================
   OBTENER POR ID
===================================================== */

export const getClienteById = async (id: string): Promise<Cliente> => {
  const response = await api.get<ClienteResponse>(`/clientes/${id}`);

  return response.data.data;
};

/* =====================================================
   CREAR
===================================================== */

export const createCliente = async (
  data: CreateClienteDTO,
): Promise<Cliente> => {
  const payload: CreateClienteDTO = {
    tipo_cliente: data.tipo_cliente,

    tipo_identificacion: data.tipo_identificacion,

    identificacion: data.identificacion.trim(),

    nombre: data.nombre.trim(),

    apellido:
      data.tipo_cliente === "persona" ? data.apellido?.trim() || null : null,

    telefono: data.telefono?.trim() || null,

    direccion: data.direccion?.trim() || null,

    correo: data.correo?.trim().toLowerCase() || null,
  };

  const response = await api.post<ClienteResponse>("/clientes", payload);

  return response.data.data;
};

/* =====================================================
   ACTUALIZAR
===================================================== */

export const updateCliente = async (
  id: string,
  data: UpdateClienteDTO,
): Promise<Cliente> => {
  const payload: UpdateClienteDTO = {
    tipo_cliente: data.tipo_cliente,

    tipo_identificacion: data.tipo_identificacion,

    identificacion: data.identificacion.trim(),

    nombre: data.nombre.trim(),

    apellido:
      data.tipo_cliente === "persona" ? data.apellido?.trim() || null : null,

    telefono: data.telefono?.trim() || null,

    direccion: data.direccion?.trim() || null,

    correo: data.correo?.trim().toLowerCase() || null,
  };

  const response = await api.put<ClienteResponse>(`/clientes/${id}`, payload);

  return response.data.data;
};

/* =====================================================
   ELIMINAR
===================================================== */

export const deleteCliente = async (
  id: string,
): Promise<DeleteClienteResponse> => {
  const response = await api.delete<DeleteClienteResponse>(`/clientes/${id}`);

  return response.data;
};

/* =====================================================
   EXPORTACIÓN AGRUPADA
===================================================== */

export const clienteService = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
};
