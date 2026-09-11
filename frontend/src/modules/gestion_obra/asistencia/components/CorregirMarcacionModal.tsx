import { useEffect, useMemo, useState } from "react";

import type { FormEvent } from "react";

import {
  X,
  Pencil,
  LogIn,
  LogOut,
  CalendarClock,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Fingerprint,
  MonitorCog,
  Hand,
  UserRound,
  Building2,
} from "lucide-react";

import Swal from "sweetalert2";
import axios from "axios";

import {
  asistenciaService,
  type Asistencia,
  type MarcacionAsistencia,
  type TipoMarcacion,
  type CorregirMarcacionPayload,
} from "../services/asistenciaService";

/* =====================================================
   PROPS
===================================================== */

interface CorregirMarcacionModalProps {
  isOpen: boolean;

  marcacion: MarcacionAsistencia | null;

  asistencia: Asistencia | null;

  onClose: () => void;

  onSuccess?: (marcacion: MarcacionAsistencia) => void | Promise<void>;
}

/* =====================================================
   FORMULARIO
===================================================== */

interface FormState {
  tipo: TipoMarcacion;

  fecha_hora: string;

  motivo: string;
}

interface FormErrors {
  tipo?: string;

  fecha_hora?: string;

  motivo?: string;
}

/* =====================================================
   CONVERTIR TIMESTAMP A DATETIME-LOCAL
===================================================== */

const convertirADatetimeLocal = (fecha?: string | null): string => {
  if (!fecha) {
    return "";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "";
  }

  const year = valor.getFullYear();

  const month = String(valor.getMonth() + 1).padStart(2, "0");

  const day = String(valor.getDate()).padStart(2, "0");

  const hours = String(valor.getHours()).padStart(2, "0");

  const minutes = String(valor.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/* =====================================================
   FECHA LOCAL MÁXIMA
===================================================== */

const obtenerFechaHoraLocal = (): string => {
  const ahora = new Date();

  const year = ahora.getFullYear();

  const month = String(ahora.getMonth() + 1).padStart(2, "0");

  const day = String(ahora.getDate()).padStart(2, "0");

  const hours = String(ahora.getHours()).padStart(2, "0");

  const minutes = String(ahora.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/* =====================================================
   FORMATEAR FECHA / HORA
===================================================== */

const formatearFechaHora = (fecha?: string | null): string => {
  if (!fecha) {
    return "—";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",

    timeStyle: "short",
  }).format(valor);
};

/* =====================================================
   ERROR BACKEND
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
      return "No tiene permisos para corregir marcaciones.";
    }

    if (error.response?.status === 404) {
      return "No se encontró la marcación que intenta corregir.";
    }

    if (error.response?.status === 409) {
      return "La corrección genera una secuencia inválida de entradas y salidas.";
    }

    if (error.code === "ERR_NETWORK") {
      return "No se pudo establecer conexión con el servidor.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado al corregir la marcación.";
};

/* =====================================================
   ICONO ORIGEN
===================================================== */

const obtenerIconoOrigen = (origen?: string) => {
  switch (origen) {
    case "biometrico":
      return <Fingerprint size={15} />;

    case "sistema":
      return <MonitorCog size={15} />;

    case "manual":
    default:
      return <Hand size={15} />;
  }
};

/* =====================================================
   TEXTO ORIGEN
===================================================== */

const obtenerTextoOrigen = (origen?: string): string => {
  switch (origen) {
    case "biometrico":
      return "Biométrico";

    case "sistema":
      return "Sistema";

    case "manual":
      return "Manual";

    default:
      return "No especificado";
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

const CorregirMarcacionModal = ({
  isOpen,
  marcacion,
  asistencia,
  onClose,
  onSuccess,
}: CorregirMarcacionModalProps) => {
  /* =================================================
     ESTADOS
  ================================================= */

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormState>({
    tipo: "entrada",

    fecha_hora: "",

    motivo: "",
  });

  /* =================================================
     CARGAR MARCACIÓN
  ================================================= */

  useEffect(() => {
    if (!isOpen || !marcacion) {
      return;
    }

    setForm({
      tipo: marcacion.tipo,

      fecha_hora: convertirADatetimeLocal(marcacion.fecha_hora),

      motivo: "",
    });

    setErrors({});
  }, [isOpen, marcacion]);

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

    if (form.tipo !== "entrada" && form.tipo !== "salida") {
      nuevosErrores.tipo = "Debe seleccionar un tipo válido.";
    }

    if (!form.fecha_hora) {
      nuevosErrores.fecha_hora = "Debe indicar la fecha y hora.";
    } else {
      const fechaNueva = new Date(form.fecha_hora);

      if (Number.isNaN(fechaNueva.getTime())) {
        nuevosErrores.fecha_hora = "La fecha y hora no son válidas.";
      } else {
        const ahora = new Date();

        const tolerancia = 60 * 1000;

        if (fechaNueva.getTime() > ahora.getTime() + tolerancia) {
          nuevosErrores.fecha_hora = "No puede registrar una marcación futura.";
        }

        if (asistencia?.fecha) {
          const fechaAsistencia = asistencia.fecha.substring(0, 10);

          const fechaMarcacion = form.fecha_hora.substring(0, 10);

          if (fechaAsistencia !== fechaMarcacion) {
            nuevosErrores.fecha_hora =
              "La marcación debe permanecer dentro de la fecha de esta asistencia.";
          }
        }
      }
    }

    if (!form.motivo.trim()) {
      nuevosErrores.motivo = "Debe indicar el motivo de la corrección.";
    } else if (form.motivo.trim().length < 5) {
      nuevosErrores.motivo = "El motivo debe tener al menos 5 caracteres.";
    } else if (form.motivo.length > 500) {
      nuevosErrores.motivo = "El motivo no puede superar los 500 caracteres.";
    }

    if (marcacion) {
      const fechaOriginal = convertirADatetimeLocal(marcacion.fecha_hora);

      const mismoTipo = form.tipo === marcacion.tipo;

      const mismaFecha = form.fecha_hora === fechaOriginal;

      if (mismoTipo && mismaFecha) {
        nuevosErrores.fecha_hora =
          "Debe modificar la fecha/hora o el tipo antes de guardar.";
      }
    }

    setErrors(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  /* =================================================
     GUARDAR
  ================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading || !marcacion) {
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    const confirmacion = await Swal.fire({
      icon: "warning",

      title: "¿Confirmar corrección?",

      html: `
            <div style="text-align:left">
              <p>
                Está por modificar una marcación de asistencia existente.
              </p>

              <p style="margin-top:10px">
                El sistema volverá a validar la secuencia completa de entradas y salidas.
              </p>

              <p style="margin-top:10px">
                La operación quedará registrada en auditoría.
              </p>
            </div>
          `,

      showCancelButton: true,

      confirmButtonText: "Sí, corregir",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#f28c00",

      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      setLoading(true);

      const payload: CorregirMarcacionPayload = {
        tipo: form.tipo,

        fecha_hora: form.fecha_hora,

        motivo: form.motivo.trim(),
      };

      const respuesta = await asistenciaService.corregirMarcacion(
        marcacion.id,
        payload,
      );

      await Swal.fire({
        icon: "success",

        title: "Marcación corregida",

        text: respuesta.message || "La marcación fue corregida correctamente.",

        confirmButtonText: "Aceptar",

        confirmButtonColor: "#f28c00",
      });

      if (onSuccess) {
        await onSuccess(respuesta.marcacion);
      }

      onClose();
    } catch (error) {
      console.error("Error corrigiendo marcación:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo corregir la marcación",

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

  if (!isOpen || !marcacion) {
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
        z-[120]
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
          max-w-2xl
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
                Corregir marcación
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                Corrige la hora o el tipo de una entrada o salida.
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
            id="corregir-marcacion-form"
            onSubmit={handleSubmit}
            className="
              space-y-6
            "
          >
            {/* =================================
                CONTEXTO
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
                sm:grid-cols-2
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
                    {asistencia?.obra_codigo
                      ? `${asistencia.obra_codigo} - `
                      : ""}

                    {asistencia?.obra_nombre || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                MARCACIÓN ORIGINAL
            ================================== */}

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
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
                Marcación original
              </p>

              <div
                className="
                  mt-4
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className={`
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl

                      ${
                        marcacion.tipo === "entrada"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      }
                    `}
                  >
                    {marcacion.tipo === "entrada" ? (
                      <LogIn size={19} />
                    ) : (
                      <LogOut size={19} />
                    )}
                  </div>

                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-slate-800
                      "
                    >
                      {marcacion.tipo === "entrada" ? "Entrada" : "Salida"}
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-slate-500
                      "
                    >
                      {formatearFechaHora(marcacion.fecha_hora)}
                    </p>
                  </div>
                </div>

                <span
                  className="
                    inline-flex
                    w-fit
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    border-slate-200
                    bg-slate-50
                    px-3
                    py-1.5
                    text-xs
                    text-slate-600
                  "
                >
                  {obtenerIconoOrigen(marcacion.origen_registro)}

                  {obtenerTextoOrigen(marcacion.origen_registro)}
                </span>
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
                  Corrección controlada
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-600
                  "
                >
                  El backend validará nuevamente todas las marcaciones de la
                  jornada. No permitirá secuencias inválidas como dos entradas
                  consecutivas o una salida sin entrada previa.
                </p>
              </div>
            </div>

            {/* =================================
                TIPO
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
                Tipo de marcación
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
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => actualizarCampo("tipo", "entrada")}
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    p-4
                    text-left
                    transition

                    ${
                      form.tipo === "entrada"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >
                  <LogIn size={20} />

                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      Entrada
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        opacity-75
                      "
                    >
                      Inicio de un período de trabajo.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => actualizarCampo("tipo", "salida")}
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    p-4
                    text-left
                    transition

                    ${
                      form.tipo === "salida"
                        ? "border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >
                  <LogOut size={20} />

                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      Salida
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        opacity-75
                      "
                    >
                      Finalización de un período de trabajo.
                    </p>
                  </div>
                </button>
              </div>

              {errors.tipo && (
                <p
                  className="
                    mt-2
                    text-xs
                    text-red-500
                  "
                >
                  {errors.tipo}
                </p>
              )}
            </div>

            {/* =================================
                FECHA/HORA
            ================================== */}

            <div>
              <label
                htmlFor="corregir-marcacion-fecha-hora"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Fecha y hora
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
                  relative
                "
              >
                <CalendarClock
                  size={18}
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  id="corregir-marcacion-fecha-hora"
                  type="datetime-local"
                  value={form.fecha_hora}
                  max={obtenerFechaHoraLocal()}
                  onChange={(event) =>
                    actualizarCampo("fecha_hora", event.target.value)
                  }
                  disabled={loading}
                  className={`
                    w-full
                    rounded-xl
                    border
                    bg-white
                    py-3
                    pl-10
                    pr-4
                    text-sm
                    text-slate-800
                    outline-none
                    transition
                    focus:ring-2
                    focus:ring-orange-100
                    disabled:bg-slate-50
                    disabled:text-slate-400

                    ${
                      errors.fecha_hora
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-orange-400"
                    }
                  `}
                />
              </div>

              {errors.fecha_hora ? (
                <p
                  className="
                    mt-1.5
                    text-xs
                    text-red-500
                  "
                >
                  {errors.fecha_hora}
                </p>
              ) : (
                <p
                  className="
                    mt-1.5
                    text-xs
                    text-slate-500
                  "
                >
                  La marcación debe permanecer dentro de la misma fecha de
                  asistencia.
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
                  htmlFor="corregir-marcacion-motivo"
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
                  id="corregir-marcacion-motivo"
                  rows={4}
                  value={form.motivo}
                  onChange={(event) =>
                    actualizarCampo("motivo", event.target.value)
                  }
                  disabled={loading}
                  placeholder="Ej.: El empleado registró la salida con una hora incorrecta y se verificó el horario real..."
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
                  El motivo será almacenado junto con los datos anteriores y
                  nuevos en auditoría.
                </p>
              )}
            </div>

            {/* =================================
                RESUMEN
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
                Resumen de la corrección
              </p>

              <div
                className="
                  mt-4
                  grid
                  gap-4
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
                    Marcación original
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                      text-slate-700
                    "
                  >
                    {marcacion.tipo === "entrada" ? "Entrada" : "Salida"}

                    {" · "}

                    {formatearFechaHora(marcacion.fecha_hora)}
                  </p>
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      text-slate-500
                    "
                  >
                    Nueva marcación
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-orange-600
                    "
                  >
                    {form.tipo === "entrada" ? "Entrada" : "Salida"}

                    {" · "}

                    {form.fecha_hora
                      ? formatearFechaHora(form.fecha_hora)
                      : "—"}
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
            form="corregir-marcacion-form"
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

export default CorregirMarcacionModal;
