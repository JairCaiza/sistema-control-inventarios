import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import {
  updateEmpleado,
  type ActualizarEmpleadoPayload,
  type Empleado,
  type TipoPagoEmpleado,
} from "../services/empleadosService";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
  empleado: Empleado | null;
}

/* =====================================================
   FORM
===================================================== */

interface EmpleadoForm {
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
  direccion: string;
  fecha_nacimiento: string;
  cargo: string;
  tipo_pago: TipoPagoEmpleado;
  salario_base: string;
  fecha_ingreso: string;
  observaciones: string;
}

/* =====================================================
   FECHA LOCAL
===================================================== */

const obtenerFechaLocal = () => {
  const fecha = new Date();

  const year = fecha.getFullYear();

  const month = String(fecha.getMonth() + 1).padStart(2, "0");

  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   NORMALIZAR FECHA PARA INPUT DATE
===================================================== */

const normalizarFechaInput = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value.includes("T") ? value.split("T")[0] : value;
};

/* =====================================================
   ERROR API
===================================================== */

const obtenerMensajeError = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
          detail?: string;
        };
      };
    };

    return (
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

/* =====================================================
   CREAR FORM DESDE EMPLEADO
===================================================== */

const crearFormDesdeEmpleado = (empleado: Empleado): EmpleadoForm => ({
  nombres: empleado.nombres ?? "",

  apellidos: empleado.apellidos ?? "",

  cedula: empleado.cedula ?? "",

  telefono: empleado.telefono ?? "",

  correo: empleado.correo ?? "",

  direccion: empleado.direccion ?? "",

  fecha_nacimiento: normalizarFechaInput(empleado.fecha_nacimiento),

  cargo: empleado.cargo ?? "",

  tipo_pago: empleado.tipo_pago ?? "mensual",

  salario_base:
    empleado.salario_base !== null && empleado.salario_base !== undefined
      ? String(empleado.salario_base)
      : "",

  fecha_ingreso: normalizarFechaInput(empleado.fecha_ingreso),

  observaciones: empleado.observaciones ?? "",
});

/* =====================================================
   COMPONENTE
===================================================== */

function EditEmpleadoModal({ open, onClose, onUpdated, empleado }: Props) {
  const [form, setForm] = useState<EmpleadoForm | null>(null);

  const [loading, setLoading] = useState(false);

  /* =================================================
     CARGAR DATOS
  ================================================= */

  useEffect(() => {
    if (!open || !empleado) {
      return;
    }

    setForm(crearFormDesdeEmpleado(empleado));
  }, [open, empleado]);

  /* =================================================
     BLOQUEAR SCROLL + ESC
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;

      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, loading, onClose]);

  /* =================================================
     CHANGE
  ================================================= */

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    if (!form) {
      return;
    }

    const { name, value } = event.target;

    if (name === "cedula" || name === "telefono") {
      const soloNumeros = value.replace(/\D/g, "");

      setForm((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          [name]:
            name === "cedula"
              ? soloNumeros.slice(0, 10)
              : soloNumeros.slice(0, 15),
        };
      });

      return;
    }

    setForm((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [name]: value,
      };
    });
  };

  /* =================================================
     VALIDAR
  ================================================= */

  const validarFormulario = () => {
    if (!form) {
      return "No se encontraron datos del empleado.";
    }

    const nombres = form.nombres.trim();

    const apellidos = form.apellidos.trim();

    const cedula = form.cedula.trim();

    const telefono = form.telefono.trim();

    const correo = form.correo.trim();

    if (!nombres) {
      return "Ingrese los nombres del empleado.";
    }

    if (nombres.length < 2) {
      return "Los nombres deben contener al menos 2 caracteres.";
    }

    if (!apellidos) {
      return "Ingrese los apellidos del empleado.";
    }

    if (apellidos.length < 2) {
      return "Los apellidos deben contener al menos 2 caracteres.";
    }

    if (!cedula) {
      return "Ingrese la cédula del empleado.";
    }

    if (!/^[0-9]{10}$/.test(cedula)) {
      return "La cédula debe contener exactamente 10 dígitos.";
    }

    if (telefono && !/^[0-9]{7,15}$/.test(telefono)) {
      return "El teléfono debe contener entre 7 y 15 dígitos.";
    }

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return "Ingrese un correo electrónico válido.";
    }

    if (form.salario_base !== "") {
      const salario = Number(form.salario_base);

      if (!Number.isFinite(salario) || salario < 0) {
        return "El salario base debe ser mayor o igual a 0.";
      }
    }

    if (form.fecha_nacimiento && form.fecha_nacimiento > obtenerFechaLocal()) {
      return "La fecha de nacimiento no puede ser futura.";
    }

    return null;
  };

  /* =================================================
     CERRAR
  ================================================= */

  const handleClose = () => {
    if (loading) {
      return;
    }

    onClose();
  };

  /* =================================================
     SUBMIT
  ================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading || !empleado || !form) {
      return;
    }

    const mensajeValidacion = validarFormulario();

    if (mensajeValidacion) {
      await Swal.fire({
        icon: "warning",
        title: "Revise la información",
        text: mensajeValidacion,
        confirmButtonText: "Aceptar",
      });

      return;
    }

    const payload: ActualizarEmpleadoPayload = {
      nombres: form.nombres.trim(),

      apellidos: form.apellidos.trim(),

      cedula: form.cedula.trim(),

      telefono: form.telefono.trim() || null,

      correo: form.correo.trim() ? form.correo.trim().toLowerCase() : null,

      direccion: form.direccion.trim() || null,

      fecha_nacimiento: form.fecha_nacimiento || null,

      cargo: form.cargo.trim() || null,

      tipo_pago: form.tipo_pago,

      salario_base: form.salario_base === "" ? null : Number(form.salario_base),

      fecha_ingreso: form.fecha_ingreso || null,

      observaciones: form.observaciones.trim() || null,
    };

    try {
      setLoading(true);

      await updateEmpleado(empleado.id, payload);

      await Swal.fire({
        icon: "success",
        title: "Empleado actualizado",
        text: "La información del empleado fue actualizada correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });

      await onUpdated();

      onClose();
    } catch (error) {
      console.error("Error actualizando empleado:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: obtenerMensajeError(
          error,
          "Ocurrió un error al actualizar el empleado.",
        ),
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =================================================
     NO RENDER
  ================================================= */

  if (!open || !empleado || !form) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[var(--color-primary)]">
              <UserRound size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Editar Empleado
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Actualice la información personal y laboral del empleado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(94vh-90px)] overflow-y-auto"
        >
          <div className="space-y-7 p-6">
            {/* =================================================
                DATOS PERSONALES
            ================================================= */}

            <section>
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Datos personales
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Información de identificación y contacto.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* NOMBRES */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nombres <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="nombres"
                      value={form.nombres}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={100}
                      placeholder="Ingrese nombres"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* APELLIDOS */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Apellidos <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="apellidos"
                      value={form.apellidos}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={100}
                      placeholder="Ingrese apellidos"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* CÉDULA */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Cédula <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <IdCard
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="cedula"
                      inputMode="numeric"
                      value={form.cedula}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={10}
                      placeholder="Ej. 0601234567"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* TELÉFONO */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Teléfono
                  </label>

                  <div className="relative">
                    <Phone
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="telefono"
                      inputMode="numeric"
                      value={form.telefono}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={15}
                      placeholder="Ej. 0999999999"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* CORREO */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      name="correo"
                      value={form.correo}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={150}
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* FECHA NACIMIENTO */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Fecha de nacimiento
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={form.fecha_nacimiento}
                      onChange={handleChange}
                      disabled={loading}
                      max={obtenerFechaLocal()}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* DIRECCIÓN */}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Dirección
                  </label>

                  <div className="relative">
                    <MapPin
                      size={17}
                      className="absolute left-3 top-3 text-slate-400"
                    />

                    <textarea
                      name="direccion"
                      value={form.direccion}
                      onChange={handleChange}
                      disabled={loading}
                      rows={2}
                      maxLength={500}
                      placeholder="Dirección domiciliaria"
                      className="w-full resize-none rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                DIVISOR
            ================================================= */}

            <div className="border-t border-slate-200" />

            {/* =================================================
                INFORMACIÓN LABORAL
            ================================================= */}

            <section>
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Información laboral
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Cargo, modalidad de pago y datos de ingreso.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* CARGO */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Cargo
                  </label>

                  <div className="relative">
                    <BriefcaseBusiness
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="cargo"
                      value={form.cargo}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={100}
                      placeholder="Ej. Maestro de obra"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* TIPO PAGO */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Tipo de pago <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="tipo_pago"
                    value={form.tipo_pago}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                  >
                    <option value="diario">Diario</option>

                    <option value="semanal">Semanal</option>

                    <option value="quincenal">Quincenal</option>

                    <option value="mensual">Mensual</option>
                  </select>
                </div>

                {/* SALARIO */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Salario base
                  </label>

                  <div className="relative">
                    <CircleDollarSign
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      name="salario_base"
                      min="0"
                      step="0.01"
                      value={form.salario_base}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* FECHA INGRESO */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Fecha de ingreso
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      name="fecha_ingreso"
                      value={form.fecha_ingreso}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                DIVISOR
            ================================================= */}

            <div className="border-t border-slate-200" />

            {/* =================================================
                OBSERVACIONES
            ================================================= */}

            <section>
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Observaciones
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Información adicional relevante del empleado.
                </p>
              </div>

              <div className="relative">
                <FileText
                  size={17}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  disabled={loading}
                  rows={3}
                  maxLength={1000}
                  placeholder="Ingrese observaciones..."
                  className="w-full resize-none rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                />
              </div>

              <div className="mt-1 flex justify-end">
                <span className="text-xs text-slate-400">
                  {form.observaciones.length}
                  /1000
                </span>
              </div>
            </section>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Actualizando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEmpleadoModal;
