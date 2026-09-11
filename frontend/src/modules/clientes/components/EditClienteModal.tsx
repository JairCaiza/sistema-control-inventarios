import { useEffect, useState } from "react";

import axios from "axios";

import Swal from "sweetalert2";

import {
  updateCliente,
  type Cliente,
  type TipoCliente,
  type TipoIdentificacion,
  type UpdateClienteDTO,
} from "../service/clienteService";

import {
  validarIdentificacionCliente,
  validarTelefono,
  validarCorreo,
} from "../service/clienteValidation";

import {
  Pencil,
  X,
  Loader2,
  User,
  Building2,
  IdCard,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;

  cliente: Cliente | null;

  onClose: () => void;

  onUpdated: () => void;
}

/* =====================================================
   FORM
===================================================== */

interface FormState {
  tipo_cliente: TipoCliente;

  tipo_identificacion: TipoIdentificacion;

  identificacion: string;

  nombre: string;

  apellido: string;

  telefono: string;

  correo: string;

  direccion: string;
}

/* =====================================================
   COMPONENTE
===================================================== */

function EditClienteModal({ open, cliente, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<FormState>({
    tipo_cliente: "persona",

    tipo_identificacion: "cedula",

    identificacion: "",

    nombre: "",

    apellido: "",

    telefono: "",

    correo: "",

    direccion: "",
  });

  const [loading, setLoading] = useState(false);

  /* =====================================================
     CARGAR CLIENTE
  ===================================================== */

  useEffect(() => {
    if (!open || !cliente) {
      return;
    }

    setForm({
      tipo_cliente: cliente.tipo_cliente,

      tipo_identificacion: cliente.tipo_identificacion,

      identificacion: cliente.identificacion || "",

      nombre: cliente.nombre || "",

      apellido: cliente.apellido || "",

      telefono: cliente.telefono || "",

      correo: cliente.correo || "",

      direccion: cliente.direccion || "",
    });
  }, [open, cliente]);

  /* =====================================================
     NO RENDER
  ===================================================== */

  if (!open || !cliente) {
    return null;
  }

  /* =====================================================
     CAMBIOS
  ===================================================== */

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    if (name === "tipo_cliente") {
      const tipoCliente = value as TipoCliente;

      setForm((prev) => ({
        ...prev,

        tipo_cliente: tipoCliente,

        tipo_identificacion: tipoCliente === "empresa" ? "ruc" : "cedula",

        apellido: tipoCliente === "empresa" ? "" : prev.apellido,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,

      [name]: value,
    }));
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    /* IDENTIFICACIÓN */

    const errorIdentificacion = validarIdentificacionCliente(
      form.tipo_cliente,
      form.tipo_identificacion,
      form.identificacion,
    );

    if (errorIdentificacion) {
      await Swal.fire({
        icon: "warning",

        title: "Identificación inválida",

        text: errorIdentificacion,
      });

      return;
    }

    /* NOMBRE */

    if (form.nombre.trim().length < 2) {
      await Swal.fire({
        icon: "warning",

        title: "Nombre inválido",

        text: "El nombre o razón social debe tener al menos 2 caracteres.",
      });

      return;
    }

    /* APELLIDO */

    if (form.tipo_cliente === "persona" && form.apellido.trim().length < 2) {
      await Swal.fire({
        icon: "warning",

        title: "Apellido inválido",

        text: "Ingrese un apellido válido.",
      });

      return;
    }

    /* TELÉFONO */

    if (!validarTelefono(form.telefono)) {
      await Swal.fire({
        icon: "warning",

        title: "Teléfono inválido",

        text: "Ingrese un número de teléfono válido.",
      });

      return;
    }

    /* CORREO */

    if (!validarCorreo(form.correo)) {
      await Swal.fire({
        icon: "warning",

        title: "Correo inválido",

        text: "Ingrese un correo electrónico válido.",
      });

      return;
    }

    const payload: UpdateClienteDTO = {
      tipo_cliente: form.tipo_cliente,

      tipo_identificacion: form.tipo_identificacion,

      identificacion: form.identificacion.trim(),

      nombre: form.nombre.trim(),

      apellido: form.tipo_cliente === "persona" ? form.apellido.trim() : null,

      telefono: form.telefono.trim() || null,

      correo: form.correo.trim().toLowerCase() || null,

      direccion: form.direccion.trim() || null,
    };

    try {
      setLoading(true);

      await updateCliente(cliente.id, payload);

      await Swal.fire({
        icon: "success",

        title: "Cliente actualizado",

        text: "Los datos se actualizaron correctamente.",

        timer: 1800,

        showConfirmButton: false,
      });

      await onUpdated();

      onClose();
    } catch (error: unknown) {
      console.error("Error actualizando cliente:", error);

      let mensaje = "No se pudo actualizar el cliente.";

      if (axios.isAxiosError(error)) {
        mensaje = error.response?.data?.message ?? mensaje;

        const errores = error.response?.data?.errors;

        if (Array.isArray(errores) && errores.length > 0) {
          mensaje = errores.join("\n");
        }
      }

      await Swal.fire({
        icon: "error",

        title: "No se pudo actualizar",

        text: mensaje,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between border-b px-6 py-5">
          <div className="flex gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Pencil size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Editar cliente
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Actualice la información personal, empresarial y de contacto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={21} />
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {/* TIPO CLIENTE */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de cliente *
              </label>

              <select
                name="tipo_cliente"
                value={form.tipo_cliente}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5"
              >
                <option value="persona">Persona</option>

                <option value="empresa">Empresa</option>
              </select>
            </div>

            {/* TIPO DOCUMENTO */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de identificación *
              </label>

              <select
                name="tipo_identificacion"
                value={form.tipo_identificacion}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5"
              >
                {form.tipo_cliente === "persona" && (
                  <>
                    <option value="cedula">Cédula</option>

                    <option value="ruc">RUC</option>

                    <option value="pasaporte">Pasaporte</option>
                  </>
                )}

                {form.tipo_cliente === "empresa" && (
                  <option value="ruc">RUC</option>
                )}
              </select>
            </div>

            {/* IDENTIFICACIÓN */}

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <IdCard size={16} />
                Identificación *
              </label>

              <input
                name="identificacion"
                value={form.identificacion}
                onChange={handleChange}
                maxLength={20}
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5"
              />
            </div>

            {/* NOMBRE */}

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                {form.tipo_cliente === "empresa" ? (
                  <Building2 size={16} />
                ) : (
                  <User size={16} />
                )}

                {form.tipo_cliente === "empresa"
                  ? "Razón social *"
                  : "Nombre *"}
              </label>

              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5"
              />
            </div>

            {/* APELLIDO */}

            {form.tipo_cliente === "persona" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Apellido *
                </label>

                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-lg border px-3 py-2.5"
                />
              </div>
            )}

            {/* TELÉFONO */}

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone size={16} />
                Teléfono
              </label>

              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                maxLength={20}
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5"
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail size={16} />
                Correo electrónico
              </label>

              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                maxLength={150}
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5"
              />
            </div>

            {/* DIRECCIÓN */}

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin size={16} />
                Dirección
              </label>

              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                maxLength={300}
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5"
              />
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border bg-white px-5 py-2.5"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Pencil size={18} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditClienteModal;
