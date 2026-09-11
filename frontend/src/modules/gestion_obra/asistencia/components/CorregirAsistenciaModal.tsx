import { useEffect, useMemo, useState } from "react";

import type { FormEvent } from "react";

import {
  X,
  Pencil,
  UserRound,
  Building2,
  CalendarDays,
  FileText,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  Clock3,
  UserX,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";

import Swal from "sweetalert2";
import axios from "axios";

import {
  asistenciaService,
  type Asistencia,
  type EstadoAsistencia,
  type ActualizarAsistenciaPayload,
} from "../services/asistenciaService";

/* =====================================================
   PROPS
===================================================== */

interface CorregirAsistenciaModalProps {
  isOpen: boolean;

  asistencia: Asistencia | null;

  onClose: () => void;

  onSuccess?: (asistencia: Asistencia) => void | Promise<void>;
}

/* =====================================================
   FORMULARIO
===================================================== */

interface FormState {
  estado: EstadoAsistencia;

  observaciones: string;

  motivo: string;
}

interface FormErrors {
  estado?: string;

  observaciones?: string;

  motivo?: string;
}

/* =====================================================
   ESTADOS DISPONIBLES
===================================================== */

const estadosDisponibles: Array<{
  value: EstadoAsistencia;
  label: string;
  descripcion: string;
}> = [
  {
    value: "presente",
    label: "Presente",
    descripcion: "El empleado asistió normalmente a la jornada.",
  },
  {
    value: "atraso",
    label: "Atraso",
    descripcion: "El empleado asistió, pero registró llegada tardía.",
  },
  {
    value: "ausente",
    label: "Ausente",
    descripcion: "El empleado no asistió a la jornada.",
  },
  {
    value: "permiso",
    label: "Permiso",
    descripcion: "El empleado cuenta con un permiso autorizado.",
  },
  {
    value: "justificado",
    label: "Justificado",
    descripcion: "La ausencia o novedad se encuentra justificada.",
  },
];

/* =====================================================
   FECHA
===================================================== */

const formatearFecha = (fecha?: string | null): string => {
  if (!fecha) {
    return "—";
  }

  const soloFecha = fecha.substring(0, 10);

  const partes = soloFecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const year = Number(partes[0]);

  const month = Number(partes[1]);

  const day = Number(partes[2]);

  const valor = new Date(year, month - 1, day);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "long",
  }).format(valor);
};

/* =====================================================
   MENSAJE DE ERROR
===================================================== */

const obtenerMensajeError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;

          errores?: Array<{
            mensaje?: string;
          }>;
        }
      | undefined;

    if (Array.isArray(data?.errores) && data.errores.length > 0) {
      return data.errores
        .map((item) => item.mensaje)
        .filter(Boolean)
        .join("\n");
    }

    if (data?.message) {
      return data.message;
    }

    if (error.response?.status === 401) {
      return "La sesión ha expirado o no está autenticado.";
    }

    if (error.response?.status === 403) {
      return "No tiene permisos para corregir registros de asistencia.";
    }

    if (error.response?.status === 404) {
      return "No se encontró la asistencia que intenta corregir.";
    }

    if (error.response?.status === 409) {
      return "La corrección genera una inconsistencia con las marcaciones registradas.";
    }

    if (error.code === "ERR_NETWORK") {
      return "No se pudo establecer conexión con el servidor.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado al corregir la asistencia.";
};

/* =====================================================
   ICONO ESTADO
===================================================== */

const obtenerIconoEstado = (estado: EstadoAsistencia) => {
  switch (estado) {
    case "presente":
      return <BadgeCheck size={18} />;

    case "atraso":
      return <Clock3 size={18} />;

    case "ausente":
      return <UserX size={18} />;

    case "permiso":
      return <ShieldCheck size={18} />;

    case "justificado":
      return <CheckCircle2 size={18} />;
  }
};

/* =====================================================
   CLASE ESTADO - TEMA CLARO
===================================================== */

const obtenerClaseEstado = (
  estado: EstadoAsistencia,
  activo: boolean,
): string => {
  const base =
    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition";

  if (!activo) {
    return `${base} border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50`;
  }

  switch (estado) {
    case "presente":
      return `${base} border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100`;

    case "atraso":
      return `${base} border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-100`;

    case "ausente":
      return `${base} border-red-300 bg-red-50 text-red-700 ring-1 ring-red-100`;

    case "permiso":
      return `${base} border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-100`;

    case "justificado":
      return `${base} border-violet-300 bg-violet-50 text-violet-700 ring-1 ring-violet-100`;
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

const CorregirAsistenciaModal = ({
  isOpen,
  asistencia,
  onClose,
  onSuccess,
}: CorregirAsistenciaModalProps) => {
  /* =================================================
     ESTADOS
  ================================================= */

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormState>({
    estado: "presente",

    observaciones: "",

    motivo: "",
  });

  /* =================================================
     CARGAR DATOS
  ================================================= */

  useEffect(() => {
    if (!isOpen || !asistencia) {
      return;
    }

    setForm({
      estado: asistencia.estado,

      observaciones: asistencia.observaciones || "",

      motivo: "",
    });

    setErrors({});
  }, [isOpen, asistencia]);

  /* =================================================
     BLOQUEAR SCROLL
  ================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [isOpen]);

  /* =================================================
     ESCAPE
  ================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [isOpen, loading, onClose]);

  /* =================================================
     NOMBRE EMPLEADO
  ================================================= */

  const nombreEmpleado = useMemo(() => {
    if (!asistencia) {
      return "—";
    }

    return (
      `${asistencia.nombres || ""} ${asistencia.apellidos || ""}`.trim() ||
      "Empleado"
    );
  }, [asistencia]);

  /* =================================================
     CAMBIAR CAMPO
  ================================================= */

  const actualizarCampo = <K extends keyof FormState>(
    campo: K,
    valor: FormState[K],
  ) => {
    setForm((prev) => ({
      ...prev,

      [campo]: valor,
    }));

    setErrors((prev) => ({
      ...prev,

      [campo]: undefined,
    }));
  };

  /* =================================================
     VALIDACIÓN
  ================================================= */

  const validarFormulario = (): boolean => {
    const nuevosErrores: FormErrors = {};

    if (!form.estado) {
      nuevosErrores.estado = "Debe seleccionar un estado.";
    }

    if (form.observaciones.length > 500) {
      nuevosErrores.observaciones =
        "Las observaciones no pueden superar los 500 caracteres.";
    }

    if (!form.motivo.trim()) {
      nuevosErrores.motivo = "Debe indicar el motivo de la corrección.";
    } else if (form.motivo.trim().length < 5) {
      nuevosErrores.motivo = "El motivo debe tener al menos 5 caracteres.";
    } else if (form.motivo.length > 500) {
      nuevosErrores.motivo = "El motivo no puede superar los 500 caracteres.";
    }

    const cambioEstado = asistencia && form.estado !== asistencia.estado;

    const observacionOriginal = asistencia?.observaciones?.trim() || "";

    const cambioObservacion = form.observaciones.trim() !== observacionOriginal;

    if (!cambioEstado && !cambioObservacion) {
      nuevosErrores.estado =
        "Debe modificar el estado o las observaciones antes de guardar.";
    }

    setErrors(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  /* =================================================
     GUARDAR
  ================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading || !asistencia) {
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    const confirmar = await Swal.fire({
      icon: "warning",

      title: "¿Confirmar corrección?",

      html: `
            <div style="text-align:left">
              <p>
                Está por modificar un registro oficial de asistencia.
              </p>

              <p style="margin-top:10px">
                Esta acción quedará registrada en el historial de auditoría.
              </p>
            </div>
          `,

      showCancelButton: true,

      confirmButtonText: "Sí, corregir",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#f28c00",

      reverseButtons: true,
    });

    if (!confirmar.isConfirmed) {
      return;
    }

    try {
      setLoading(true);

      const payload: ActualizarAsistenciaPayload = {
        estado: form.estado,

        observaciones: form.observaciones.trim()
          ? form.observaciones.trim()
          : undefined,

        motivo: form.motivo.trim(),
      };

      const respuesta = await asistenciaService.actualizarAsistencia(
        asistencia.id,
        payload,
      );

      await Swal.fire({
        icon: "success",

        title: "Asistencia corregida",

        text: respuesta.message || "El registro fue actualizado correctamente.",

        confirmButtonText: "Aceptar",

        confirmButtonColor: "#f28c00",
      });

      if (onSuccess) {
        await onSuccess(respuesta.asistencia);
      }

      onClose();
    } catch (error) {
      console.error("Error corrigiendo asistencia:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo corregir la asistencia",

        text: obtenerMensajeError(error),

        confirmButtonText: "Aceptar",

        confirmButtonColor: "#f28c00",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =================================================
     CERRAR
  ================================================= */

  const handleCerrar = () => {
    if (loading) {
      return;
    }

    onClose();
  };

  /* =================================================
     NO RENDERIZAR
  ================================================= */

  if (!isOpen || !asistencia) {
    return null;
  }

  /* =================================================
     RENDER
  ================================================= */

  return (
    <div
      className="
        fixed
        inset-0
        z-[110]
        flex
        items-center
        justify-center
        bg-black/45
        px-4
        py-6
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          handleCerrar();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[94vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >
        {/* =====================================
            HEADER
        ====================================== */}

        <div
          className="
            flex
            items-start
            justify-between
            border-b
            border-slate-200
            bg-white
            px-6
            py-5
          "
        >
          <div
            className="
              flex
              items-start
              gap-4
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-orange-50
                text-orange-500
              "
            >
              <Pencil size={21} />
            </div>

            <div>
              <h2
                className="
                  text-xl
                  font-semibold
                  text-slate-900
                "
              >
                Corregir asistencia
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                Modifica el estado u observaciones del registro.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCerrar}
            disabled={loading}
            className="
              rounded-lg
              p-2
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* =====================================
            BODY
        ====================================== */}

        <div
          className="
            overflow-y-auto
            bg-white
            px-6
            py-5
          "
        >
          <form
            id="corregir-asistencia-form"
            onSubmit={handleSubmit}
            className="
              space-y-6
            "
          >
            {/* =================================
                INFORMACIÓN DEL REGISTRO
            ================================== */}

            <div
              className="
                grid
                gap-4
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-5
                md:grid-cols-3
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <UserRound
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                    text-slate-400
                  "
                />

                <div>
                  <p
                    className="
                      text-xs
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Empleado
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                      text-slate-800
                    "
                  >
                    {nombreEmpleado}
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <Building2
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                    text-slate-400
                  "
                />

                <div>
                  <p
                    className="
                      text-xs
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Obra
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                      text-slate-800
                    "
                  >
                    {asistencia.obra_codigo
                      ? `${asistencia.obra_codigo} - `
                      : ""}

                    {asistencia.obra_nombre || "—"}
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <CalendarDays
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                    text-slate-400
                  "
                />

                <div>
                  <p
                    className="
                      text-xs
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Fecha
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                      text-slate-800
                    "
                  >
                    {formatearFecha(asistencia.fecha)}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                ADVERTENCIA
            ================================== */}

            <div
              className="
                flex
                gap-3
                rounded-xl
                border
                border-amber-200
                bg-amber-50
                p-4
              "
            >
              <ShieldAlert
                size={20}
                className="
                  mt-0.5
                  shrink-0
                  text-amber-600
                "
              />

              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-amber-700
                  "
                >
                  Corrección auditada
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-600
                  "
                >
                  Esta operación modifica un registro existente. El estado
                  anterior, el nuevo estado y el motivo quedarán registrados
                  para auditoría.
                </p>
              </div>
            </div>

            {/* =================================
                ESTADO
            ================================== */}

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Estado de asistencia
                <span
                  className="
                    ml-1
                    text-red-500
                  "
                >
                  *
                </span>
              </label>

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                {estadosDisponibles.map((estado) => {
                  const activo = form.estado === estado.value;

                  return (
                    <button
                      key={estado.value}
                      type="button"
                      disabled={loading}
                      onClick={() => actualizarCampo("estado", estado.value)}
                      className={obtenerClaseEstado(estado.value, activo)}
                    >
                      <div
                        className="
                            mt-0.5
                            shrink-0
                          "
                      >
                        {obtenerIconoEstado(estado.value)}
                      </div>

                      <div>
                        <p
                          className="
                              text-sm
                              font-semibold
                            "
                        >
                          {estado.label}
                        </p>

                        <p
                          className="
                              mt-1
                              text-xs
                              leading-5
                              opacity-80
                            "
                        >
                          {estado.descripcion}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {errors.estado && (
                <p
                  className="
                    mt-2
                    text-xs
                    text-red-500
                  "
                >
                  {errors.estado}
                </p>
              )}
            </div>

            {/* =================================
                OBSERVACIONES
            ================================== */}

            <div>
              <div
                className="
                  mb-2
                  flex
                  items-center
                  justify-between
                "
              >
                <label
                  htmlFor="corregir-asistencia-observaciones"
                  className="
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Observaciones
                </label>

                <span
                  className={`
                    text-xs

                    ${
                      form.observaciones.length > 500
                        ? "text-red-500"
                        : "text-slate-400"
                    }
                  `}
                >
                  {form.observaciones.length}
                  /500
                </span>
              </div>

              <div
                className="
                  relative
                "
              >
                <FileText
                  size={18}
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-3.5
                    text-slate-400
                  "
                />

                <textarea
                  id="corregir-asistencia-observaciones"
                  rows={4}
                  value={form.observaciones}
                  onChange={(event) =>
                    actualizarCampo("observaciones", event.target.value)
                  }
                  disabled={loading}
                  placeholder="Observaciones relacionadas con la asistencia..."
                  className={`
                    w-full
                    resize-none
                    rounded-xl
                    border
                    bg-white
                    py-3
                    pl-10
                    pr-4
                    text-sm
                    text-slate-800
                    placeholder:text-slate-400
                    outline-none
                    transition
                    focus:ring-2
                    focus:ring-orange-100
                    disabled:bg-slate-50

                    ${
                      errors.observaciones
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-orange-400"
                    }
                  `}
                />
              </div>

              {errors.observaciones && (
                <p
                  className="
                    mt-1.5
                    text-xs
                    text-red-500
                  "
                >
                  {errors.observaciones}
                </p>
              )}
            </div>

            {/* =================================
                MOTIVO
            ================================== */}

            <div>
              <div
                className="
                  mb-2
                  flex
                  items-center
                  justify-between
                "
              >
                <label
                  htmlFor="corregir-asistencia-motivo"
                  className="
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Motivo de la corrección
                  <span
                    className="
                      ml-1
                      text-red-500
                    "
                  >
                    *
                  </span>
                </label>

                <span
                  className={`
                    text-xs

                    ${
                      form.motivo.length > 500
                        ? "text-red-500"
                        : "text-slate-400"
                    }
                  `}
                >
                  {form.motivo.length}
                  /500
                </span>
              </div>

              <div
                className="
                  relative
                "
              >
                <AlertTriangle
                  size={18}
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-3.5
                    text-slate-400
                  "
                />

                <textarea
                  id="corregir-asistencia-motivo"
                  rows={3}
                  value={form.motivo}
                  onChange={(event) =>
                    actualizarCampo("motivo", event.target.value)
                  }
                  disabled={loading}
                  placeholder="Ej.: Registro incorrecto realizado por error administrativo..."
                  className={`
                    w-full
                    resize-none
                    rounded-xl
                    border
                    bg-white
                    py-3
                    pl-10
                    pr-4
                    text-sm
                    text-slate-800
                    placeholder:text-slate-400
                    outline-none
                    transition
                    focus:ring-2
                    focus:ring-orange-100
                    disabled:bg-slate-50

                    ${
                      errors.motivo
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-orange-400"
                    }
                  `}
                />
              </div>

              {errors.motivo ? (
                <p
                  className="
                    mt-1.5
                    text-xs
                    text-red-500
                  "
                >
                  {errors.motivo}
                </p>
              ) : (
                <p
                  className="
                    mt-1.5
                    text-xs
                    text-slate-500
                  "
                >
                  El motivo es obligatorio y será guardado en el registro de
                  auditoría.
                </p>
              )}
            </div>

            {/* =================================
                RESUMEN CAMBIO
            ================================== */}

            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-4
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >
                Resumen de corrección
              </p>

              <div
                className="
                  mt-3
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      text-slate-500
                    "
                  >
                    Estado actual
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    {
                      estadosDisponibles.find(
                        (item) => item.value === asistencia.estado,
                      )?.label
                    }
                  </p>
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      text-slate-500
                    "
                  >
                    Nuevo estado
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-orange-600
                    "
                  >
                    {
                      estadosDisponibles.find(
                        (item) => item.value === form.estado,
                      )?.label
                    }
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* =====================================
            FOOTER
        ====================================== */}

        <div
          className="
            flex
            flex-col-reverse
            gap-3
            border-t
            border-slate-200
            bg-slate-50
            px-6
            py-4
            sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="button"
            onClick={handleCerrar}
            disabled={loading}
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              py-2.5
              text-sm
              font-medium
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="corregir-asistencia-form"
            disabled={loading}
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-orange-500
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-orange-600
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="
                    animate-spin
                  "
                />
                Guardando...
              </>
            ) : (
              <>
                <Pencil size={17} />
                Guardar corrección
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorregirAsistenciaModal;
