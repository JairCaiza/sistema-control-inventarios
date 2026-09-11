import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  X,
  LogIn,
  UserRound,
  Building2,
  CalendarClock,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import Swal from "sweetalert2";
import axios from "axios";

import { api } from "../../../../services/api";

import {
  asistenciaService,
  type RegistrarEntradaPayload,
} from "../services/asistenciaService";

/* =====================================================
   TIPOS
===================================================== */

interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  cedula?: string;
  cargo?: string | null;
  activo?: boolean;
}

interface Obra {
  id: string;
  codigo?: string;
  nombre: string;
  ubicacion?: string | null;
  estado?: string;
}

interface RegistrarEntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  empleadoInicialId?: string;
  obraInicialId?: string;
}

/* =====================================================
   FORMULARIO
===================================================== */

interface FormState {
  empleado_id: string;
  obra_id: string;
  fecha_hora: string;
  observaciones: string;
}

interface FormErrors {
  empleado_id?: string;
  obra_id?: string;
  fecha_hora?: string;
  observaciones?: string;
}

/* =====================================================
   UTILIDADES DE FECHA
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

const formatearFechaHora = (valor: string): string => {
  if (!valor) {
    return "";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(fecha);
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
      return "No tiene permisos para registrar asistencias.";
    }

    if (error.response?.status === 404) {
      return "No se encontró uno de los registros relacionados.";
    }

    if (error.response?.status === 409) {
      return "Existe un conflicto con la asistencia que intenta registrar.";
    }

    if (error.code === "ERR_NETWORK") {
      return "No se pudo establecer conexión con el servidor.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado al registrar la entrada.";
};

/* =====================================================
   NORMALIZAR EMPLEADOS
===================================================== */

const extraerEmpleados = (data: unknown): Empleado[] => {
  if (Array.isArray(data)) {
    return data as Empleado[];
  }

  if (data && typeof data === "object") {
    const respuesta = data as Record<string, unknown>;

    if (Array.isArray(respuesta.empleados)) {
      return respuesta.empleados as Empleado[];
    }

    if (Array.isArray(respuesta.data)) {
      return respuesta.data as Empleado[];
    }

    if (Array.isArray(respuesta.resultados)) {
      return respuesta.resultados as Empleado[];
    }
  }

  return [];
};

/* =====================================================
   NORMALIZAR OBRAS
===================================================== */

const extraerObras = (data: unknown): Obra[] => {
  if (Array.isArray(data)) {
    return data as Obra[];
  }

  if (data && typeof data === "object") {
    const respuesta = data as Record<string, unknown>;

    if (Array.isArray(respuesta.obras)) {
      return respuesta.obras as Obra[];
    }

    if (Array.isArray(respuesta.data)) {
      return respuesta.data as Obra[];
    }

    if (Array.isArray(respuesta.resultados)) {
      return respuesta.resultados as Obra[];
    }
  }

  return [];
};

/* =====================================================
   COMPONENTE
===================================================== */

const RegistrarEntradaModal = ({
  isOpen,
  onClose,
  onSuccess,
  empleadoInicialId = "",
  obraInicialId = "",
}: RegistrarEntradaModalProps) => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);

  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormState>({
    empleado_id: empleadoInicialId,
    obra_id: obraInicialId,
    fecha_hora: obtenerFechaHoraLocal(),
    observaciones: "",
  });

  /* =================================================
     RESET
  ================================================= */

  const resetFormulario = () => {
    setForm({
      empleado_id: empleadoInicialId,
      obra_id: obraInicialId,
      fecha_hora: obtenerFechaHoraLocal(),
      observaciones: "",
    });

    setErrors({});
  };

  /* =================================================
     CARGAR CATÁLOGOS
  ================================================= */

  const cargarCatalogos = async () => {
    try {
      setLoadingCatalogos(true);
      setErrorCatalogos(null);

      const [empleadosResponse, obrasResponse] = await Promise.all([
        api.get("/empleados"),
        api.get("/obras"),
      ]);

      const empleadosData = extraerEmpleados(empleadosResponse.data);
      const obrasData = extraerObras(obrasResponse.data);

      const empleadosActivos = empleadosData
        .filter((empleado) => empleado.activo !== false)
        .sort((a, b) => {
          const nombreA = `${a.apellidos || ""} ${a.nombres || ""}`;
          const nombreB = `${b.apellidos || ""} ${b.nombres || ""}`;

          return nombreA.localeCompare(nombreB, "es");
        });

      const obrasDisponibles = obrasData
        .filter((obra) => !obra.estado || obra.estado === "en_proceso")
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      setEmpleados(empleadosActivos);
      setObras(obrasDisponibles);
    } catch (error) {
      console.error("Error cargando catálogos de asistencia:", error);

      setEmpleados([]);
      setObras([]);

      setErrorCatalogos(obtenerMensajeError(error));
    } finally {
      setLoadingCatalogos(false);
    }
  };

  /* =================================================
     ABRIR MODAL
  ================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetFormulario();
    void cargarCatalogos();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, empleadoInicialId, obraInicialId]);

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
      if (event.key === "Escape" && !loadingSubmit) {
        onClose();
      }
    };

    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [isOpen, loadingSubmit, onClose]);

  /* =================================================
     SELECCIONADOS
  ================================================= */

  const empleadoSeleccionado = useMemo(
    () => empleados.find((empleado) => empleado.id === form.empleado_id),
    [empleados, form.empleado_id],
  );

  const obraSeleccionada = useMemo(
    () => obras.find((obra) => obra.id === form.obra_id),
    [obras, form.obra_id],
  );

  /* =================================================
     ACTUALIZAR CAMPO
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

    if (!form.empleado_id.trim()) {
      nuevosErrores.empleado_id = "Debe seleccionar un empleado.";
    }

    if (!form.obra_id.trim()) {
      nuevosErrores.obra_id = "Debe seleccionar una obra.";
    }

    if (!form.fecha_hora) {
      nuevosErrores.fecha_hora = "Debe indicar la fecha y hora de entrada.";
    } else {
      const fechaSeleccionada = new Date(form.fecha_hora);

      if (Number.isNaN(fechaSeleccionada.getTime())) {
        nuevosErrores.fecha_hora = "La fecha y hora no son válidas.";
      } else {
        const ahora = new Date();
        const tolerancia = 60 * 1000;

        if (fechaSeleccionada.getTime() > ahora.getTime() + tolerancia) {
          nuevosErrores.fecha_hora =
            "No puede registrar una entrada en una fecha futura.";
        }
      }
    }

    if (form.observaciones.length > 500) {
      nuevosErrores.observaciones =
        "Las observaciones no pueden superar los 500 caracteres.";
    }

    setErrors(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  /* =================================================
     ENVIAR
  ================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loadingSubmit || loadingCatalogos) {
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload: RegistrarEntradaPayload = {
        empleado_id: form.empleado_id,
        obra_id: form.obra_id,
        fecha_hora: form.fecha_hora,

        observaciones: form.observaciones.trim()
          ? form.observaciones.trim()
          : undefined,
      };

      const respuesta = await asistenciaService.registrarEntrada(payload);

      await Swal.fire({
        icon: "success",
        title: "Entrada registrada",
        text:
          respuesta.message ||
          "La entrada del empleado se registró correctamente.",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#f28c00",
      });

      resetFormulario();

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Error registrando entrada:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo registrar la entrada",
        text: obtenerMensajeError(error),
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#f28c00",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  /* =================================================
     CERRAR
  ================================================= */

  const handleCerrar = () => {
    if (loadingSubmit) {
      return;
    }

    resetFormulario();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  /* =================================================
     RENDER
  ================================================= */

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/45
        px-4 py-6
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loadingSubmit) {
          handleCerrar();
        }
      }}
    >
      <div
        className="
          flex max-h-[92vh]
          w-full max-w-2xl
          flex-col overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white
          shadow-2xl
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex items-start justify-between
            border-b border-slate-200
            bg-white
            px-6 py-5
          "
        >
          <div className="flex items-start gap-4">
            <div
              className="
                flex h-11 w-11
                shrink-0 items-center justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              "
            >
              <LogIn size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Registrar entrada
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registra el ingreso de un empleado a una obra.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCerrar}
            disabled={loadingSubmit}
            className="
              rounded-lg p-2
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

        {/* =================================================
            CONTENIDO
        ================================================= */}

        <div className="overflow-y-auto bg-white px-6 py-5">
          {/* ERROR */}

          {errorCatalogos && (
            <div
              className="
                mb-5 flex gap-3
                rounded-xl
                border border-red-200
                bg-red-50
                p-4
              "
            >
              <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={19} />

              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                  No se pudieron cargar los datos
                </p>

                <p className="mt-1 text-sm text-red-600">{errorCatalogos}</p>

                <button
                  type="button"
                  onClick={() => void cargarCatalogos()}
                  className="
                    mt-3 inline-flex
                    items-center gap-2
                    rounded-lg
                    border border-red-200
                    bg-white
                    px-3 py-1.5
                    text-xs font-medium
                    text-red-600
                    transition
                    hover:bg-red-50
                  "
                >
                  <RefreshCw size={14} />
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* LOADING */}

          {loadingCatalogos ? (
            <div
              className="
                flex min-h-[280px]
                flex-col items-center
                justify-center
                text-slate-500
              "
            >
              <Loader2
                size={30}
                className="mb-3 animate-spin text-orange-500"
              />

              <p className="text-sm">Cargando empleados y obras...</p>
            </div>
          ) : (
            <form
              id="registrar-entrada-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* =================================================
                  EMPLEADO
              ================================================= */}

              <div>
                <label
                  htmlFor="entrada-empleado"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Empleado
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="
                      pointer-events-none
                      absolute left-3 top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <select
                    id="entrada-empleado"
                    value={form.empleado_id}
                    onChange={(event) =>
                      actualizarCampo("empleado_id", event.target.value)
                    }
                    disabled={loadingSubmit}
                    className={`
                      w-full appearance-none
                      rounded-xl border
                      bg-white
                      py-3 pl-10 pr-4
                      text-sm text-slate-800
                      outline-none
                      transition
                      focus:ring-2
                      focus:ring-orange-100
                      disabled:bg-slate-50
                      disabled:text-slate-400

                      ${
                        errors.empleado_id
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-orange-400"
                      }
                    `}
                  >
                    <option value="">Seleccione un empleado</option>

                    {empleados.map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {`${empleado.apellidos || ""} ${empleado.nombres || ""}`.trim()}
                        {empleado.cedula ? ` - ${empleado.cedula}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.empleado_id && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.empleado_id}
                  </p>
                )}

                {!errors.empleado_id && empleados.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No existen empleados activos disponibles.
                  </p>
                )}

                {empleadoSeleccionado && (
                  <div
                    className="
                      mt-2 flex flex-wrap
                      gap-x-4 gap-y-1
                      text-xs text-slate-500
                    "
                  >
                    {empleadoSeleccionado.cargo && (
                      <span>
                        Cargo:{" "}
                        <strong className="font-medium text-slate-700">
                          {empleadoSeleccionado.cargo}
                        </strong>
                      </span>
                    )}

                    {empleadoSeleccionado.cedula && (
                      <span>
                        Cédula:{" "}
                        <strong className="font-medium text-slate-700">
                          {empleadoSeleccionado.cedula}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* =================================================
                  OBRA
              ================================================= */}

              <div>
                <label
                  htmlFor="entrada-obra"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Obra
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <Building2
                    size={18}
                    className="
                      pointer-events-none
                      absolute left-3 top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <select
                    id="entrada-obra"
                    value={form.obra_id}
                    onChange={(event) =>
                      actualizarCampo("obra_id", event.target.value)
                    }
                    disabled={loadingSubmit}
                    className={`
                      w-full appearance-none
                      rounded-xl border
                      bg-white
                      py-3 pl-10 pr-4
                      text-sm text-slate-800
                      outline-none
                      transition
                      focus:ring-2
                      focus:ring-orange-100
                      disabled:bg-slate-50
                      disabled:text-slate-400

                      ${
                        errors.obra_id
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-orange-400"
                      }
                    `}
                  >
                    <option value="">Seleccione una obra</option>

                    {obras.map((obra) => (
                      <option key={obra.id} value={obra.id}>
                        {obra.codigo ? `${obra.codigo} - ` : ""}
                        {obra.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.obra_id && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.obra_id}
                  </p>
                )}

                {!errors.obra_id && obras.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No existen obras en progreso disponibles.
                  </p>
                )}

                {obraSeleccionada && (
                  <div
                    className="
                      mt-2 flex flex-wrap
                      gap-x-4 gap-y-1
                      text-xs text-slate-500
                    "
                  >
                    <span>
                      Estado:{" "}
                      <strong className="font-medium text-emerald-600">
                        En progreso
                      </strong>
                    </span>

                    {obraSeleccionada.ubicacion && (
                      <span>
                        Ubicación:{" "}
                        <strong className="font-medium text-slate-700">
                          {obraSeleccionada.ubicacion}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* =================================================
                  FECHA Y HORA
              ================================================= */}

              <div>
                <label
                  htmlFor="entrada-fecha-hora"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Fecha y hora de entrada
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarClock
                    size={18}
                    className="
                      pointer-events-none
                      absolute left-3 top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    id="entrada-fecha-hora"
                    type="datetime-local"
                    value={form.fecha_hora}
                    max={obtenerFechaHoraLocal()}
                    onChange={(event) =>
                      actualizarCampo("fecha_hora", event.target.value)
                    }
                    disabled={loadingSubmit}
                    className={`
                      w-full rounded-xl
                      border
                      bg-white
                      py-3 pl-10 pr-4
                      text-sm text-slate-800
                      outline-none
                      transition
                      focus:ring-2
                      focus:ring-orange-100
                      disabled:bg-slate-50

                      ${
                        errors.fecha_hora
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-orange-400"
                      }
                    `}
                  />
                </div>

                {errors.fecha_hora ? (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.fecha_hora}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Se registra en hora local del equipo.
                  </p>
                )}
              </div>

              {/* =================================================
                  OBSERVACIONES
              ================================================= */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="entrada-observaciones"
                    className="text-sm font-medium text-slate-700"
                  >
                    Observaciones
                  </label>

                  <span
                    className={
                      form.observaciones.length > 500
                        ? "text-xs text-red-500"
                        : "text-xs text-slate-400"
                    }
                  >
                    {form.observaciones.length}/500
                  </span>
                </div>

                <div className="relative">
                  <FileText
                    size={18}
                    className="
                      pointer-events-none
                      absolute left-3 top-3.5
                      text-slate-400
                    "
                  />

                  <textarea
                    id="entrada-observaciones"
                    value={form.observaciones}
                    onChange={(event) =>
                      actualizarCampo("observaciones", event.target.value)
                    }
                    disabled={loadingSubmit}
                    rows={4}
                    placeholder="Ej.: Ingreso normal, cambio de turno, observación administrativa..."
                    className={`
                      w-full resize-none
                      rounded-xl border
                      bg-white
                      py-3 pl-10 pr-4
                      text-sm text-slate-800
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
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.observaciones}
                  </p>
                )}
              </div>

              {/* =================================================
                  RESUMEN
              ================================================= */}

              {form.empleado_id && form.obra_id && form.fecha_hora && (
                <div
                  className="
                    rounded-xl
                    border border-emerald-200
                    bg-emerald-50
                    p-4
                  "
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-emerald-700">
                        Registro preparado
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Se registrará la entrada de{" "}
                        <strong className="font-semibold text-slate-800">
                          {`${empleadoSeleccionado?.nombres || ""} ${empleadoSeleccionado?.apellidos || ""}`.trim()}
                        </strong>{" "}
                        en{" "}
                        <strong className="font-semibold text-slate-800">
                          {obraSeleccionada?.nombre}
                        </strong>{" "}
                        el{" "}
                        <strong className="font-semibold text-slate-800">
                          {formatearFechaHora(form.fecha_hora)}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            flex flex-col-reverse
            gap-3
            border-t border-slate-200
            bg-slate-50
            px-6 py-4
            sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="button"
            onClick={handleCerrar}
            disabled={loadingSubmit}
            className="
              inline-flex min-h-11
              items-center justify-center
              rounded-xl
              border border-slate-200
              bg-white
              px-5 py-2.5
              text-sm font-medium
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
            form="registrar-entrada-form"
            disabled={
              loadingSubmit ||
              loadingCatalogos ||
              empleados.length === 0 ||
              obras.length === 0
            }
            className="
              inline-flex min-h-11
              items-center justify-center
              gap-2
              rounded-xl
              bg-orange-500
              px-5 py-2.5
              text-sm font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-orange-600
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loadingSubmit ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Registrar entrada
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrarEntradaModal;
