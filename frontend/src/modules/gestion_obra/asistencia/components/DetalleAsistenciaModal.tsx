import { useEffect, useMemo, useState } from "react";

import {
  X,
  UserRound,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  BriefcaseBusiness,
  BadgeCheck,
  LogIn,
  LogOut,
  Fingerprint,
  MonitorCog,
  Hand,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  History,
  Timer,
  ClipboardCheck,
} from "lucide-react";

import axios from "axios";

import {
  asistenciaService,
  type Asistencia,
  type MarcacionAsistencia,
  type EstadoAsistencia,
  type OrigenRegistro,
} from "../services/asistenciaService";

/* =====================================================
   PROPS
===================================================== */

interface DetalleAsistenciaModalProps {
  isOpen: boolean;

  asistenciaId: string | null;

  onClose: () => void;

  onEditarAsistencia?: (asistencia: Asistencia) => void;

  onCorregirMarcacion?: (
    marcacion: MarcacionAsistencia,
    asistencia: Asistencia,
  ) => void;

  mostrarAcciones?: boolean;
}

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
      return "No tiene permisos para consultar esta asistencia.";
    }

    if (error.response?.status === 404) {
      return "No se encontró el registro de asistencia.";
    }

    if (error.code === "ERR_NETWORK") {
      return "No se pudo establecer conexión con el servidor.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado al consultar la asistencia.";
};

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
   FECHA Y HORA
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
   HORA
===================================================== */

const formatearHora = (fecha?: string | null): string => {
  if (!fecha) {
    return "—";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(valor);
};

/* =====================================================
   ETIQUETA ESTADO
===================================================== */

const obtenerEtiquetaEstado = (estado: EstadoAsistencia): string => {
  switch (estado) {
    case "presente":
      return "Presente";

    case "atraso":
      return "Atraso";

    case "ausente":
      return "Ausente";

    case "permiso":
      return "Permiso";

    case "justificado":
      return "Justificado";

    default:
      return estado;
  }
};

/* =====================================================
   ESTILO ESTADO - TEMA CLARO
===================================================== */

const obtenerClaseEstado = (estado: EstadoAsistencia): string => {
  switch (estado) {
    case "presente":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "atraso":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "ausente":
      return "border-red-200 bg-red-50 text-red-700";

    case "permiso":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "justificado":
      return "border-violet-200 bg-violet-50 text-violet-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

/* =====================================================
   ORIGEN
===================================================== */

const obtenerEtiquetaOrigen = (origen: OrigenRegistro): string => {
  switch (origen) {
    case "manual":
      return "Manual";

    case "biometrico":
      return "Biométrico";

    case "sistema":
      return "Sistema";

    default:
      return origen;
  }
};

/* =====================================================
   ICONO ORIGEN
===================================================== */

const obtenerIconoOrigen = (origen: OrigenRegistro) => {
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
   COMPONENTE
===================================================== */

const DetalleAsistenciaModal = ({
  isOpen,
  asistenciaId,
  onClose,
  onEditarAsistencia,
  onCorregirMarcacion,
  mostrarAcciones = true,
}: DetalleAsistenciaModalProps) => {
  /* =================================================
     ESTADOS
  ================================================= */

  const [asistencia, setAsistencia] = useState<Asistencia | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* =================================================
     CARGAR DETALLE
  ================================================= */

  const cargarDetalle = async () => {
    if (!asistenciaId) {
      return;
    }

    try {
      setLoading(true);

      setError(null);

      const data = await asistenciaService.obtenerAsistenciaPorId(asistenciaId);

      setAsistencia(data);
    } catch (error) {
      console.error("Error cargando detalle de asistencia:", error);

      setAsistencia(null);

      setError(obtenerMensajeError(error));
    } finally {
      setLoading(false);
    }
  };

  /* =================================================
     ABRIR
  ================================================= */

  useEffect(() => {
    if (!isOpen || !asistenciaId) {
      return;
    }

    void cargarDetalle();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, asistenciaId]);

  /* =================================================
     LIMPIAR AL CERRAR
  ================================================= */

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setAsistencia(null);

    setError(null);
  }, [isOpen]);

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
     CERRAR CON ESC
  ================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [isOpen, onClose]);

  /* =================================================
     MARCACIONES ORDENADAS
  ================================================= */

  const marcacionesOrdenadas = useMemo(() => {
    if (!asistencia?.marcaciones) {
      return [];
    }

    return [...asistencia.marcaciones].sort(
      (a, b) =>
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
    );
  }, [asistencia]);

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
     TIEMPO
  ================================================= */

  const tiempoTrabajado = useMemo(() => {
    if (!asistencia) {
      return "0h 00m";
    }

    if (asistencia.tiempo_trabajado?.texto) {
      return asistencia.tiempo_trabajado.texto;
    }

    const minutos = Number(asistencia.minutos_trabajados || 0);

    const horas = Math.floor(minutos / 60);

    const resto = minutos % 60;

    return `${horas}h ${String(resto).padStart(2, "0")}m`;
  }, [asistencia]);

  /* =================================================
     CERRAR
  ================================================= */

  const handleCerrar = () => {
    onClose();
  };

  /* =================================================
     NO RENDERIZAR
  ================================================= */

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
        if (event.target === event.currentTarget) {
          handleCerrar();
        }
      }}
    >
      <div
        className="
          flex max-h-[94vh]
          w-full max-w-4xl
          flex-col overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white
          shadow-2xl
        "
      >
        {/* =====================================
            HEADER
        ====================================== */}

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
                shrink-0
                items-center justify-center
                rounded-xl
                bg-orange-50
                text-orange-500
              "
            >
              <ClipboardCheck size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Detalle de asistencia
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consulta la jornada, marcaciones y tiempo trabajado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCerrar}
            className="
              rounded-lg p-2
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* =====================================
            BODY
        ====================================== */}

        <div className="flex-1 overflow-y-auto bg-white px-6 py-5">
          {/* =================================
              LOADING
          ================================== */}

          {loading && (
            <div
              className="
                flex min-h-[420px]
                flex-col
                items-center
                justify-center
                text-slate-500
              "
            >
              <Loader2
                size={34}
                className="mb-3 animate-spin text-orange-500"
              />

              <p className="text-sm">Cargando detalle de asistencia...</p>
            </div>
          )}

          {/* =================================
              ERROR
          ================================== */}

          {!loading && error && (
            <div className="flex min-h-[350px] items-center justify-center">
              <div
                className="
                  w-full max-w-lg
                  rounded-2xl
                  border border-red-200
                  bg-red-50
                  p-6
                  text-center
                "
              >
                <div
                  className="
                    mx-auto mb-4
                    flex h-12 w-12
                    items-center justify-center
                    rounded-xl
                    bg-red-100
                    text-red-600
                  "
                >
                  <AlertCircle size={24} />
                </div>

                <h3 className="text-base font-semibold text-red-700">
                  No se pudo cargar la asistencia
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-600">{error}</p>

                <button
                  type="button"
                  onClick={() => void cargarDetalle()}
                  className="
                    mt-5 inline-flex
                    items-center gap-2
                    rounded-xl
                    border border-red-200
                    bg-white
                    px-4 py-2.5
                    text-sm font-medium
                    text-red-600
                    transition
                    hover:bg-red-100
                  "
                >
                  <RefreshCw size={16} />
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* =================================
              CONTENIDO
          ================================== */}

          {!loading && !error && asistencia && (
            <div className="space-y-6">
              {/* =====================
                  ENCABEZADO EMPLEADO
              ====================== */}

              <div
                className="
                  flex flex-col
                  gap-4
                  rounded-2xl
                  border border-slate-200
                  bg-slate-50
                  p-5
                  md:flex-row
                  md:items-center
                  md:justify-between
                "
              >
                <div className="flex items-center gap-4">
                  <div
                    className="
                      flex h-12 w-12
                      items-center
                      justify-center
                      rounded-xl
                      bg-white
                      text-slate-500
                      shadow-sm
                      ring-1 ring-slate-200
                    "
                  >
                    <UserRound size={24} />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {nombreEmpleado}
                    </h3>

                    <div
                      className="
                        mt-1
                        flex flex-wrap
                        gap-x-4
                        gap-y-1
                        text-sm
                        text-slate-500
                      "
                    >
                      {asistencia.cedula && (
                        <span>C.I. {asistencia.cedula}</span>
                      )}

                      {(asistencia.cargo_obra || asistencia.cargo) && (
                        <span>{asistencia.cargo_obra || asistencia.cargo}</span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`
                    inline-flex
                    w-fit
                    items-center
                    gap-2
                    rounded-full
                    border
                    px-3 py-1.5
                    text-sm
                    font-semibold
                    ${obtenerClaseEstado(asistencia.estado)}
                  `}
                >
                  <BadgeCheck size={15} />

                  {obtenerEtiquetaEstado(asistencia.estado)}
                </span>
              </div>

              {/* =====================
                  KPIs
              ====================== */}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                  className="
                    rounded-xl
                    border border-slate-200
                    bg-white
                    p-4
                    shadow-sm
                  "
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <LogIn size={17} className="text-emerald-600" />
                    Primera entrada
                  </div>

                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatearHora(asistencia.primera_entrada)}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    border border-slate-200
                    bg-white
                    p-4
                    shadow-sm
                  "
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <LogOut size={17} className="text-blue-600" />
                    Última salida
                  </div>

                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatearHora(asistencia.ultima_salida)}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    border border-slate-200
                    bg-white
                    p-4
                    shadow-sm
                  "
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Timer size={17} className="text-orange-500" />
                    Tiempo trabajado
                  </div>

                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {tiempoTrabajado}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    border border-slate-200
                    bg-white
                    p-4
                    shadow-sm
                  "
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <History size={17} className="text-violet-600" />
                    Marcaciones
                  </div>

                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {asistencia.total_marcaciones ??
                      marcacionesOrdenadas.length}
                  </p>
                </div>
              </div>

              {/* =====================
                  INFORMACIÓN GENERAL
              ====================== */}

              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border border-slate-200
                  bg-white
                "
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <h3
                    className="
                      text-sm
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-700
                    "
                  >
                    Información general
                  </h3>
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Building2
                      size={18}
                      className="mt-0.5 shrink-0 text-slate-400"
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

                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {asistencia.obra_codigo
                          ? `${asistencia.obra_codigo} - `
                          : ""}

                        {asistencia.obra_nombre || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarDays
                      size={18}
                      className="mt-0.5 shrink-0 text-slate-400"
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

                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatearFecha(asistencia.fecha)}
                      </p>
                    </div>
                  </div>

                  {asistencia.obra_ubicacion && (
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-400"
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
                          Ubicación
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {asistencia.obra_ubicacion}
                        </p>
                      </div>
                    </div>
                  )}

                  {(asistencia.cargo_obra || asistencia.cargo) && (
                    <div className="flex items-start gap-3">
                      <BriefcaseBusiness
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-400"
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
                          Cargo
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {asistencia.cargo_obra || asistencia.cargo}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* =====================
                  OBSERVACIONES
              ====================== */}

              <div
                className="
                  rounded-2xl
                  border border-slate-200
                  bg-white
                  p-5
                "
              >
                <div className="flex items-start gap-3">
                  <FileText
                    size={18}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <div className="flex-1">
                    <p
                      className="
                        text-xs
                        uppercase
                        tracking-wide
                        text-slate-400
                      "
                    >
                      Observaciones de asistencia
                    </p>

                    <p
                      className="
                        mt-2
                        whitespace-pre-wrap
                        text-sm
                        leading-6
                        text-slate-600
                      "
                    >
                      {asistencia.observaciones ||
                        "Sin observaciones registradas."}
                    </p>
                  </div>
                </div>
              </div>

              {/* =====================
                  MARCACIONES
              ====================== */}

              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border border-slate-200
                  bg-white
                "
              >
                <div
                  className="
                    flex flex-col
                    gap-3
                    border-b border-slate-200
                    bg-slate-50
                    px-5 py-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Marcaciones de la jornada
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Entradas y salidas registradas en orden cronológico.
                    </p>
                  </div>

                  <span
                    className="
                      inline-flex
                      w-fit
                      items-center
                      rounded-full
                      border border-slate-200
                      bg-white
                      px-3 py-1
                      text-xs
                      font-medium
                      text-slate-600
                    "
                  >
                    {marcacionesOrdenadas.length} registro
                    {marcacionesOrdenadas.length === 1 ? "" : "s"}
                  </span>
                </div>

                {marcacionesOrdenadas.length === 0 ? (
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      px-6 py-12
                      text-center
                    "
                  >
                    <div
                      className="
                        mb-3
                        flex h-12 w-12
                        items-center justify-center
                        rounded-xl
                        bg-slate-100
                      "
                    >
                      <Clock3 size={25} className="text-slate-400" />
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      Sin marcaciones
                    </p>

                    <p className="mt-1 max-w-md text-sm text-slate-500">
                      Esta asistencia no contiene entradas o salidas
                      registradas.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {marcacionesOrdenadas.map((marcacion, index) => {
                      const esEntrada = marcacion.tipo === "entrada";

                      return (
                        <div
                          key={marcacion.id}
                          className="
                            flex flex-col
                            gap-4
                            px-5 py-4
                            transition
                            hover:bg-slate-50
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                          "
                        >
                          <div className="flex min-w-0 items-start gap-4">
                            <div
                              className={`
                                flex h-10 w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl

                                ${
                                  esEntrada
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-blue-50 text-blue-600"
                                }
                              `}
                            >
                              {esEntrada ? (
                                <LogIn size={19} />
                              ) : (
                                <LogOut size={19} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`
                                    text-sm
                                    font-semibold

                                    ${
                                      esEntrada
                                        ? "text-emerald-700"
                                        : "text-blue-700"
                                    }
                                  `}
                                >
                                  {esEntrada ? "Entrada" : "Salida"}
                                </span>

                                <span className="text-xs text-slate-400">
                                  #{index + 1}
                                </span>
                              </div>

                              <p
                                className="
                                  mt-1
                                  text-base
                                  font-semibold
                                  text-slate-900
                                "
                              >
                                {formatearFechaHora(marcacion.fecha_hora)}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span
                                  className="
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    rounded-full
                                    border border-slate-200
                                    bg-slate-50
                                    px-2.5 py-1
                                    text-xs
                                    text-slate-600
                                  "
                                >
                                  {obtenerIconoOrigen(
                                    marcacion.origen_registro,
                                  )}

                                  {obtenerEtiquetaOrigen(
                                    marcacion.origen_registro,
                                  )}
                                </span>

                                {marcacion.dispositivo_id && (
                                  <span
                                    className="
                                      inline-flex
                                      items-center
                                      rounded-full
                                      border border-slate-200
                                      bg-slate-50
                                      px-2.5 py-1
                                      text-xs
                                      text-slate-500
                                    "
                                  >
                                    Dispositivo: {marcacion.dispositivo_id}
                                  </span>
                                )}

                                {marcacion.referencia_externa && (
                                  <span
                                    className="
                                      inline-flex
                                      items-center
                                      rounded-full
                                      border border-slate-200
                                      bg-slate-50
                                      px-2.5 py-1
                                      text-xs
                                      text-slate-500
                                    "
                                  >
                                    Ref: {marcacion.referencia_externa}
                                  </span>
                                )}
                              </div>

                              {marcacion.observaciones && (
                                <p
                                  className="
                                    mt-3
                                    text-sm
                                    leading-5
                                    text-slate-500
                                  "
                                >
                                  {marcacion.observaciones}
                                </p>
                              )}
                            </div>
                          </div>

                          {mostrarAcciones && onCorregirMarcacion && (
                            <button
                              type="button"
                              onClick={() =>
                                onCorregirMarcacion(marcacion, asistencia)
                              }
                              className="
                                inline-flex
                                shrink-0
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                border border-slate-200
                                bg-white
                                px-3 py-2
                                text-xs
                                font-medium
                                text-slate-600
                                shadow-sm
                                transition
                                hover:border-orange-300
                                hover:bg-orange-50
                                hover:text-orange-600
                              "
                            >
                              <Pencil size={14} />
                              Corregir
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* =====================
                  METADATA
              ====================== */}

              <div
                className="
                  grid gap-3
                  rounded-xl
                  border border-slate-200
                  bg-slate-50
                  p-4
                  text-xs
                  text-slate-500
                  md:grid-cols-2
                "
              >
                <div>
                  <span className="font-medium text-slate-600">
                    Registro creado:
                  </span>{" "}
                  {formatearFechaHora(asistencia.fecha_creacion)}
                </div>

                <div>
                  <span className="font-medium text-slate-600">
                    Última actualización:
                  </span>{" "}
                  {formatearFechaHora(asistencia.fecha_actualizacion)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =====================================
            FOOTER
        ====================================== */}

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
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              rounded-xl
              border border-slate-200
              bg-white
              px-5 py-2.5
              text-sm
              font-medium
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-100
            "
          >
            Cerrar
          </button>

          {asistencia && mostrarAcciones && onEditarAsistencia && (
            <button
              type="button"
              onClick={() => onEditarAsistencia(asistencia)}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-orange-500
                px-5 py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-orange-600
              "
            >
              <Pencil size={17} />
              Corregir asistencia
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleAsistenciaModal;
