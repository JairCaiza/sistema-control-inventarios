import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import {
  updateObra,
  type EstadoObra,
  type Obra,
} from "../../services/obrasService";

import api from "../../../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

interface ClienteOption {
  id: string;

  nombre?: string | null;

  apellido?: string | null;

  razon_social?: string | null;

  tipo?: string | null;

  activo?: boolean;
}

interface Props {
  open: boolean;

  onClose: () => void;

  onUpdated: () => void | Promise<void>;

  obra: Obra | null;
}

interface FormState {
  codigo: string;

  nombre: string;

  cliente_id: string;

  ubicacion: string;

  fecha_inicio: string;

  fecha_fin: string;

  presupuesto: string;

  estado: EstadoObra;

  descripcion: string;
}

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADOS: {
  value: EstadoObra;
  label: string;
}[] = [
  {
    value: "planificada",
    label: "Planificada",
  },
  {
    value: "en_proceso",
    label: "En proceso",
  },
  {
    value: "pausada",
    label: "Pausada",
  },
  {
    value: "finalizada",
    label: "Finalizada",
  },
  {
    value: "cancelada",
    label: "Cancelada",
  },
];

const FORM_INICIAL: FormState = {
  codigo: "",
  nombre: "",
  cliente_id: "",
  ubicacion: "",
  fecha_inicio: "",
  fecha_fin: "",
  presupuesto: "",
  estado: "planificada",
  descripcion: "",
};

/* =====================================================
   HELPERS
===================================================== */

const normalizarFechaInput = (fecha?: string | null) => {
  if (!fecha) {
    return "";
  }

  return fecha.includes("T") ? fecha.split("T")[0] : fecha;
};

const obtenerNombreCliente = (cliente: ClienteOption) => {
  if (cliente.tipo === "empresa" && cliente.razon_social) {
    return cliente.razon_social;
  }

  const nombreCompleto = [cliente.nombre, cliente.apellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombreCompleto || cliente.razon_social || "Cliente";
};

const obtenerMensajeError = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
          errors?: {
            mensaje?: string;
          }[];
        };
      };
    };

    const backendError = axiosError.response?.data;

    if (backendError?.errors && backendError.errors.length > 0) {
      return backendError.errors
        .map((item) => item.mensaje)
        .filter(Boolean)
        .join("\n");
    }

    return backendError?.message || "No se pudo actualizar la obra.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo actualizar la obra.";
};

/* =====================================================
   COMPONENTE
===================================================== */

function EditObraModal({ open, onClose, onUpdated, obra }: Props) {
  const [loading, setLoading] = useState(false);

  const [cargandoClientes, setCargandoClientes] = useState(false);

  const [clientes, setClientes] = useState<ClienteOption[]>([]);

  const [form, setForm] = useState<FormState>(FORM_INICIAL);

  /* =================================================
     CARGAR OBRA EN FORM
  ================================================= */

  useEffect(() => {
    if (!obra) {
      return;
    }

    setForm({
      codigo: obra.codigo || "",

      nombre: obra.nombre || "",

      cliente_id: obra.cliente_id || "",

      ubicacion: obra.ubicacion || "",

      fecha_inicio: normalizarFechaInput(obra.fecha_inicio),

      fecha_fin: normalizarFechaInput(obra.fecha_fin),

      presupuesto:
        obra.presupuesto !== undefined && obra.presupuesto !== null
          ? String(obra.presupuesto)
          : "",

      estado: obra.estado || "planificada",

      descripcion: obra.descripcion || "",
    });
  }, [obra]);

  /* =================================================
     CARGAR CLIENTES
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;

    const cargarClientes = async () => {
      try {
        setCargandoClientes(true);

        const response = await api.get("/clientes");

        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        if (mounted) {
          setClientes(
            data.filter((cliente: ClienteOption) => cliente.activo !== false),
          );
        }
      } catch (error) {
        console.error("Error cargando clientes:", error);

        if (mounted) {
          setClientes([]);
        }
      } finally {
        if (mounted) {
          setCargandoClientes(false);
        }
      }
    };

    void cargarClientes();

    return () => {
      mounted = false;
    };
  }, [open]);

  /* =================================================
     BLOQUEAR SCROLL
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [open]);

  /* =================================================
     CERRAR CON ESCAPE
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onClose]);

  /* =================================================
     VALIDACIÓN
  ================================================= */

  const errores = useMemo(() => {
    const mensajes: string[] = [];

    if (!form.codigo.trim()) {
      mensajes.push("El código de la obra es obligatorio.");
    }

    if (!form.nombre.trim()) {
      mensajes.push("El nombre de la obra es obligatorio.");
    }

    if (form.nombre.trim().length < 3) {
      mensajes.push("El nombre debe tener al menos 3 caracteres.");
    }

    if (form.presupuesto !== "") {
      const presupuesto = Number(form.presupuesto);

      if (!Number.isFinite(presupuesto) || presupuesto < 0) {
        mensajes.push(
          "El presupuesto debe ser un valor válido mayor o igual a 0.",
        );
      }
    }

    if (
      form.fecha_inicio &&
      form.fecha_fin &&
      form.fecha_fin < form.fecha_inicio
    ) {
      mensajes.push(
        "La fecha de finalización no puede ser anterior a la fecha de inicio.",
      );
    }

    return mensajes;
  }, [form]);

  /* =================================================
     CHANGE
  ================================================= */

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =================================================
     SUBMIT
  ================================================= */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!obra) {
      return;
    }

    if (errores.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Revisa la información",
        html: `
          <div style="text-align:left">
            ${errores
              .map(
                (mensaje) =>
                  `<div style="margin-bottom:6px">• ${mensaje}</div>`,
              )
              .join("")}
          </div>
        `,
        confirmButtonText: "Entendido",
      });

      return;
    }

    try {
      setLoading(true);

      await updateObra(obra.id, {
        codigo: form.codigo.trim(),

        nombre: form.nombre.trim(),

        cliente_id: form.cliente_id || null,

        ubicacion: form.ubicacion.trim() || null,

        fecha_inicio: form.fecha_inicio || null,

        fecha_fin: form.fecha_fin || null,

        presupuesto: form.presupuesto === "" ? 0 : Number(form.presupuesto),

        estado: form.estado,

        descripcion: form.descripcion.trim() || null,
      });

      await Swal.fire({
        icon: "success",
        title: "Obra actualizada",
        text: "La información de la obra fue actualizada correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });

      await onUpdated();

      onClose();
    } catch (error) {
      console.error("Error actualizando obra:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: obtenerMensajeError(error),
        confirmButtonText: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =================================================
     RENDER
  ================================================= */

  if (!open || !obra) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="my-6 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Gestión de Obras
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Editar obra
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Actualiza los datos generales de la obra.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            {/* CÓDIGO */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Código
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <input
                type="text"
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                maxLength={30}
                disabled={loading}
                placeholder="Ej. OB-001"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
            </div>

            {/* NOMBRE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Nombre de la obra
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                maxLength={150}
                disabled={loading}
                placeholder="Nombre de la obra"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
            </div>

            {/* CLIENTE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Cliente
              </label>

              <select
                name="cliente_id"
                value={form.cliente_id}
                onChange={handleChange}
                disabled={loading || cargandoClientes}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              >
                <option value="">
                  {cargandoClientes
                    ? "Cargando clientes..."
                    : "Sin cliente asignado"}
                </option>

                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {obtenerNombreCliente(cliente)}
                  </option>
                ))}
              </select>
            </div>

            {/* UBICACIÓN */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Ubicación
              </label>

              <input
                type="text"
                name="ubicacion"
                value={form.ubicacion}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ej. Riobamba, Chimborazo"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
            </div>

            {/* FECHA INICIO */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Fecha de inicio
              </label>

              <input
                type="date"
                name="fecha_inicio"
                value={form.fecha_inicio}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
            </div>

            {/* FECHA FIN */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Fecha de finalización
              </label>

              <input
                type="date"
                name="fecha_fin"
                value={form.fecha_fin}
                min={form.fecha_inicio || undefined}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />
            </div>

            {/* PRESUPUESTO */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Presupuesto
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                  $
                </span>

                <input
                  type="number"
                  name="presupuesto"
                  value={form.presupuesto}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* ESTADO */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Estado
              </label>

              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              >
                {ESTADOS.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            {/* DESCRIPCIÓN */}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Descripción
              </label>

              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                maxLength={2000}
                rows={4}
                disabled={loading}
                placeholder="Descripción general, alcance u observaciones de la obra..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
              />

              <div className="mt-1 flex justify-end">
                <span className="text-xs text-slate-400">
                  {form.descripcion.length}
                  /2000
                </span>
              </div>
            </div>
          </div>

          {/* INFORMACIÓN */}

          <div className="mx-6 mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-900">
              Información importante
            </p>

            <p className="mt-1 text-sm leading-6 text-sky-800">
              Si la obra ya tiene gastos, pagos, controles diarios o movimientos
              financieros, el historial se conserva. Para una obra que ya no
              debe continuar, utiliza el estado <strong>Cancelada</strong> en
              lugar de eliminar su información histórica.
            </p>
          </div>

          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {loading ? "Actualizando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditObraModal;
