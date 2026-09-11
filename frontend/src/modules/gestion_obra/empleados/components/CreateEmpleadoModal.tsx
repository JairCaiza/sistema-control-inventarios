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
  createEmpleado,
  type CrearEmpleadoPayload,
  type TipoPagoEmpleado,
} from "../services/empleadosService";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}

/* =====================================================
   FORMULARIO
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
   ESTADO INICIAL
===================================================== */

const crearFormularioInicial = (): EmpleadoForm => ({
  nombres: "",
  apellidos: "",
  cedula: "",
  telefono: "",
  correo: "",
  direccion: "",
  fecha_nacimiento: "",
  cargo: "",
  tipo_pago: "mensual",
  salario_base: "",
  fecha_ingreso: "",
  observaciones: "",
});

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
   COMPONENTE
===================================================== */

function CreateEmpleadoModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<EmpleadoForm>(crearFormularioInicial());

  const [loading, setLoading] = useState(false);

  /* =================================================
     REINICIAR AL ABRIR
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(crearFormularioInicial());
  }, [open]);

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
    const { name, value } = event.target;

    /*
     * Cédula y teléfono:
     * únicamente permitimos dígitos.
     */
    if (name === "cedula" || name === "telefono") {
      const soloNumeros = value.replace(/\D/g, "");

      setForm((previous) => ({
        ...previous,
        [name]:
          name === "cedula"
            ? soloNumeros.slice(0, 10)
            : soloNumeros.slice(0, 15),
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =================================================
     VALIDACIÓN
  ================================================= */

  const validarFormulario = () => {
    const nombres = form.nombres.trim();

    const apellidos = form.apellidos.trim();

    const cedula = form.cedula.trim();

    const telefono = form.telefono.trim();

    const correo = form.correo.trim();

    const cargo = form.cargo.trim();

    /* NOMBRES */

    if (!nombres) {
      return "Ingrese los nombres del empleado.";
    }

    if (nombres.length < 2) {
      return "Los nombres deben contener al menos 2 caracteres.";
    }

    /* APELLIDOS */

    if (!apellidos) {
      return "Ingrese los apellidos del empleado.";
    }

    if (apellidos.length < 2) {
      return "Los apellidos deben contener al menos 2 caracteres.";
    }

    /* CÉDULA */

    if (!cedula) {
      return "Ingrese la cédula del empleado.";
    }

    if (!/^[0-9]{10}$/.test(cedula)) {
      return "La cédula debe contener exactamente 10 dígitos.";
    }

    /* TELÉFONO */

    if (telefono && !/^[0-9]{7,15}$/.test(telefono)) {
      return "El teléfono debe contener entre 7 y 15 dígitos.";
    }

    /* CORREO */

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return "Ingrese un correo electrónico válido.";
    }

    /* CARGO */

    if (cargo.length > 100) {
      return "El cargo no puede superar los 100 caracteres.";
    }

    /* SALARIO */

    if (form.salario_base !== "") {
      const salario = Number(form.salario_base);

      if (!Number.isFinite(salario) || salario < 0) {
        return "El salario base debe ser un valor mayor o igual a 0.";
      }
    }

    /* FECHA NACIMIENTO */

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

    if (loading) {
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

    /* =================================================
         PAYLOAD
      ================================================= */

    const payload: CrearEmpleadoPayload = {
      nombres: form.nombres.trim(),

      apellidos: form.apellidos.trim(),

      cedula: form.cedula.trim(),

      tipo_pago: form.tipo_pago,
    };

    /*
     * Los campos opcionales solamente
     * se agregan cuando contienen datos.
     */

    if (form.telefono.trim()) {
      payload.telefono = form.telefono.trim();
    }

    if (form.correo.trim()) {
      payload.correo = form.correo.trim().toLowerCase();
    }

    if (form.direccion.trim()) {
      payload.direccion = form.direccion.trim();
    }

    if (form.fecha_nacimiento) {
      payload.fecha_nacimiento = form.fecha_nacimiento;
    }

    if (form.cargo.trim()) {
      payload.cargo = form.cargo.trim();
    }

    if (form.salario_base !== "") {
      payload.salario_base = Number(form.salario_base);
    }

    if (form.fecha_ingreso) {
      payload.fecha_ingreso = form.fecha_ingreso;
    }

    if (form.observaciones.trim()) {
      payload.observaciones = form.observaciones.trim();
    }

    try {
      setLoading(true);

      await createEmpleado(payload);

      await Swal.fire({
        icon: "success",
        title: "Empleado registrado",
        text: "El empleado fue registrado correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });

      /*
       * Recargar tabla/listado
       */
      await onCreated();

      /*
       * Limpiar
       */
      setForm(crearFormularioInicial());

      /*
       * Cerrar modal
       */
      onClose();
    } catch (error) {
      console.error("Error creando empleado:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        text: obtenerMensajeError(
          error,
          "Ocurrió un error al registrar el empleado.",
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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]">
      {/* =================================================
          MODAL
      ================================================= */}

      <div className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[var(--color-primary)]">
                <UserRound size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Nuevo Empleado
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Registre la información personal y laboral del empleado.
                </p>
              </div>
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
            CONTENIDO
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
                      autoComplete="given-name"
                      placeholder="Ingrese nombres"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
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
                      autoComplete="family-name"
                      placeholder="Ingrese apellidos"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
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
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Debe contener exactamente 10 dígitos.
                  </p>
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
                      autoComplete="tel"
                      placeholder="Ej. 0999999999"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
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
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
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
                      maxLength={500}
                      rows={2}
                      placeholder="Dirección domiciliaria del empleado"
                      className="w-full resize-none rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* DIVISOR */}

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
                  Condiciones generales de contratación y pago.
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
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
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
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Valor referencial según el tipo de pago.
                  </p>
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

                  <p className="mt-1 text-xs text-slate-400">
                    Si no se especifica, el sistema utilizará la fecha actual.
                  </p>
                </div>
              </div>
            </section>

            {/* DIVISOR */}

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
                  Información adicional relevante sobre el empleado.
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
                  maxLength={1000}
                  rows={3}
                  placeholder="Ingrese observaciones, notas o información adicional..."
                  className="w-full resize-none rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
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
              className="inline-flex min-w-[150px] items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEmpleadoModal;
