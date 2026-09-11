import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  Filter,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
  UserCheck,
  UserRound,
  UserX,
  X,
} from "lucide-react";

import axios from "axios";

import { api } from "../../../../services/api";

import {
  asistenciaService,
  type Asistencia,
  type EstadoAsistencia,
  type FiltrosAsistencia,
  type MarcacionAsistencia,
} from "../services/asistenciaService";

import RegistrarEntradaModal from "../components/RegistrarEntradaModal";
import RegistrarSalidaModal from "../components/RegistrarSalidaModal";
import RegistrarNovedadModal from "../components/RegistrarNovedadModal";
import DetalleAsistenciaModal from "../components/DetalleAsistenciaModal";
import CorregirAsistenciaModal from "../components/CorregirAsistenciaModal";
import CorregirMarcacionModal from "../components/CorregirMarcacionModal";

/* =====================================================
   TIPOS LOCALES
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

interface RespuestaListadoNormalizada {
  registros: Asistencia[];
  total: number;
}

/* =====================================================
   CONSTANTES
===================================================== */

const REGISTROS_POR_PAGINA = 10;

/* =====================================================
   FECHAS
===================================================== */

const obtenerFechaLocal = (): string => {
  const fecha = new Date();

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

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
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(valor);
};

const formatearHora = (fecha?: string | null): string => {
  if (!fecha) {
    return "—";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(valor);
};

/* =====================================================
   TIEMPO
===================================================== */

const formatearMinutos = (minutos?: number | null): string => {
  const valor = Number(minutos || 0);

  const horas = Math.floor(valor / 60);

  const resto = valor % 60;

  return `${horas}h ${String(resto).padStart(2, "0")}m`;
};

/* =====================================================
   ERROR
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
      return "No tiene permisos para consultar el control de asistencia.";
    }

    if (error.code === "ERR_NETWORK") {
      return "No se pudo establecer conexión con el servidor.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
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
   NORMALIZAR LISTADO
===================================================== */

const normalizarListadoAsistencias = (
  data: unknown,
): RespuestaListadoNormalizada => {
  if (Array.isArray(data)) {
    return {
      registros: data as Asistencia[],
      total: data.length,
    };
  }

  if (data && typeof data === "object") {
    const respuesta = data as Record<string, unknown>;

    const candidatos = [
      respuesta.asistencias,
      respuesta.data,
      respuesta.resultados,
      respuesta.registros,
    ];

    for (const candidato of candidatos) {
      if (Array.isArray(candidato)) {
        return {
          registros: candidato as Asistencia[],

          total:
            typeof respuesta.total === "number"
              ? respuesta.total
              : candidato.length,
        };
      }
    }

    if (respuesta.data && typeof respuesta.data === "object") {
      const interna = respuesta.data as Record<string, unknown>;

      const internos = [
        interna.asistencias,
        interna.resultados,
        interna.registros,
      ];

      for (const candidato of internos) {
        if (Array.isArray(candidato)) {
          return {
            registros: candidato as Asistencia[],

            total:
              typeof interna.total === "number"
                ? interna.total
                : candidato.length,
          };
        }
      }
    }
  }

  return {
    registros: [],
    total: 0,
  };
};

/* =====================================================
   ESTADOS
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
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

const AsistenciaPage = () => {
  /* =================================================
     DATOS
  ================================================= */

  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  const [obras, setObras] = useState<Obra[]>([]);

  /* =================================================
     LOADING / ERROR
  ================================================= */

  const [loading, setLoading] = useState(true);

  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /* =================================================
     FILTROS
  ================================================= */

  const [busqueda, setBusqueda] = useState("");

  const [filtroEmpleado, setFiltroEmpleado] = useState("");

  const [filtroObra, setFiltroObra] = useState("");

  const [filtroEstado, setFiltroEstado] = useState<"" | EstadoAsistencia>("");

  const [fechaDesde, setFechaDesde] = useState(obtenerFechaLocal());

  const [fechaHasta, setFechaHasta] = useState(obtenerFechaLocal());

  const [mostrarFiltros, setMostrarFiltros] = useState(true);

  /* =================================================
     PAGINACIÓN
  ================================================= */

  const [paginaActual, setPaginaActual] = useState(1);

  /* =================================================
     MODALES
  ================================================= */

  const [modalEntradaOpen, setModalEntradaOpen] = useState(false);

  const [modalSalidaOpen, setModalSalidaOpen] = useState(false);

  const [modalNovedadOpen, setModalNovedadOpen] = useState(false);

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  const [modalCorregirAsistenciaOpen, setModalCorregirAsistenciaOpen] =
    useState(false);

  const [modalCorregirMarcacionOpen, setModalCorregirMarcacionOpen] =
    useState(false);

  /* =================================================
     SELECCIÓN
  ================================================= */

  const [asistenciaSeleccionada, setAsistenciaSeleccionada] =
    useState<Asistencia | null>(null);

  const [marcacionSeleccionada, setMarcacionSeleccionada] =
    useState<MarcacionAsistencia | null>(null);

  /* =================================================
     CARGAR CATÁLOGOS
  ================================================= */

  const cargarCatalogos = useCallback(async () => {
    try {
      setLoadingCatalogos(true);

      const [empleadosResponse, obrasResponse] = await Promise.all([
        api.get("/empleados"),
        api.get("/obras"),
      ]);

      const empleadosData = extraerEmpleados(empleadosResponse.data)
        .filter((empleado) => empleado.activo !== false)
        .sort((a, b) =>
          `${a.apellidos || ""} ${a.nombres || ""}`.localeCompare(
            `${b.apellidos || ""} ${b.nombres || ""}`,
            "es",
          ),
        );

      const obrasData = extraerObras(obrasResponse.data).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es"),
      );

      setEmpleados(empleadosData);

      setObras(obrasData);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    } finally {
      setLoadingCatalogos(false);
    }
  }, []);

  /* =================================================
     CARGAR ASISTENCIAS
  ================================================= */

  const cargarAsistencias = useCallback(async () => {
    try {
      setLoading(true);

      setError(null);

      const filtros: FiltrosAsistencia = {};

      if (filtroEmpleado) {
        filtros.empleado_id = filtroEmpleado;
      }

      if (filtroObra) {
        filtros.obra_id = filtroObra;
      }

      if (filtroEstado) {
        filtros.estado = filtroEstado;
      }

      if (fechaDesde) {
        filtros.fecha_desde = fechaDesde;
      }

      if (fechaHasta) {
        filtros.fecha_hasta = fechaHasta;
      }

      const respuesta = await asistenciaService.listarAsistencias(filtros);

      const normalizada = normalizarListadoAsistencias(respuesta);

      setAsistencias(normalizada.registros);

      setPaginaActual(1);
    } catch (error) {
      console.error("Error cargando asistencias:", error);

      setAsistencias([]);

      setError(obtenerMensajeError(error));
    } finally {
      setLoading(false);
    }
  }, [filtroEmpleado, filtroObra, filtroEstado, fechaDesde, fechaHasta]);

  /* =================================================
     CARGA INICIAL
  ================================================= */

  useEffect(() => {
    void cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    void cargarAsistencias();
  }, [cargarAsistencias]);

  /* =================================================
     BÚSQUEDA LOCAL
  ================================================= */

  const asistenciasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) {
      return asistencias;
    }

    return asistencias.filter((asistencia) => {
      const empleado =
        `${asistencia.nombres || ""} ${asistencia.apellidos || ""}`
          .trim()
          .toLowerCase();

      const cedula = String(asistencia.cedula || "").toLowerCase();

      const obra =
        `${asistencia.obra_codigo || ""} ${asistencia.obra_nombre || ""}`
          .trim()
          .toLowerCase();

      const cargo = String(
        asistencia.cargo_obra || asistencia.cargo || "",
      ).toLowerCase();

      return (
        empleado.includes(termino) ||
        cedula.includes(termino) ||
        obra.includes(termino) ||
        cargo.includes(termino)
      );
    });
  }, [asistencias, busqueda]);

  /* =================================================
     KPIs
  ================================================= */

  const estadisticas = useMemo(() => {
    let presentes = 0;
    let atrasos = 0;
    let ausentes = 0;
    let permisos = 0;
    let justificados = 0;
    let minutos = 0;

    asistenciasFiltradas.forEach((asistencia) => {
      switch (asistencia.estado) {
        case "presente":
          presentes++;
          break;

        case "atraso":
          atrasos++;
          break;

        case "ausente":
          ausentes++;
          break;

        case "permiso":
          permisos++;
          break;

        case "justificado":
          justificados++;
          break;
      }

      minutos += Number(asistencia.minutos_trabajados || 0);
    });

    return {
      presentes,
      atrasos,
      ausentes,
      permisos,
      justificados,
      minutos,
    };
  }, [asistenciasFiltradas]);

  /* =================================================
     PAGINACIÓN
  ================================================= */

  const totalPaginas = Math.max(
    1,
    Math.ceil(asistenciasFiltradas.length / REGISTROS_POR_PAGINA),
  );

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const asistenciasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;

    return asistenciasFiltradas.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [asistenciasFiltradas, paginaActual]);

  const indiceInicio =
    asistenciasFiltradas.length === 0
      ? 0
      : (paginaActual - 1) * REGISTROS_POR_PAGINA + 1;

  const indiceFin = Math.min(
    paginaActual * REGISTROS_POR_PAGINA,
    asistenciasFiltradas.length,
  );

  /* =================================================
     FILTROS ACTIVOS
  ================================================= */

  const cantidadFiltrosActivos = useMemo(() => {
    let cantidad = 0;

    if (filtroEmpleado) {
      cantidad++;
    }

    if (filtroObra) {
      cantidad++;
    }

    if (filtroEstado) {
      cantidad++;
    }

    if (fechaDesde !== obtenerFechaLocal()) {
      cantidad++;
    }

    if (fechaHasta !== obtenerFechaLocal()) {
      cantidad++;
    }

    return cantidad;
  }, [filtroEmpleado, filtroObra, filtroEstado, fechaDesde, fechaHasta]);

  /* =================================================
     LIMPIAR FILTROS
  ================================================= */

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEmpleado("");
    setFiltroObra("");
    setFiltroEstado("");

    setFechaDesde(obtenerFechaLocal());

    setFechaHasta(obtenerFechaLocal());

    setPaginaActual(1);
  };

  /* =================================================
     DETALLE
  ================================================= */

  const abrirDetalle = (asistencia: Asistencia) => {
    setAsistenciaSeleccionada(asistencia);

    setModalDetalleOpen(true);
  };

  /* =================================================
     CORREGIR ASISTENCIA
  ================================================= */

  const abrirCorregirAsistencia = (asistencia: Asistencia) => {
    setAsistenciaSeleccionada(asistencia);

    setModalDetalleOpen(false);

    setModalCorregirAsistenciaOpen(true);
  };

  /* =================================================
     CORREGIR MARCACIÓN
  ================================================= */

  const abrirCorregirMarcacion = (
    marcacion: MarcacionAsistencia,
    asistencia: Asistencia,
  ) => {
    setMarcacionSeleccionada(marcacion);

    setAsistenciaSeleccionada(asistencia);

    setModalDetalleOpen(false);

    setModalCorregirMarcacionOpen(true);
  };

  /* =================================================
     REFRESCAR
  ================================================= */

  const refrescarDatos = async () => {
    await cargarAsistencias();
  };

  const handleCorreccionAsistencia = async (
    asistenciaActualizada: Asistencia,
  ) => {
    setAsistenciaSeleccionada(asistenciaActualizada);

    await cargarAsistencias();
  };

  const handleCorreccionMarcacion = async () => {
    await cargarAsistencias();

    if (asistenciaSeleccionada?.id) {
      try {
        const detalle = await asistenciaService.obtenerAsistenciaPorId(
          asistenciaSeleccionada.id,
        );

        setAsistenciaSeleccionada(detalle);
      } catch {
        // El listado ya fue actualizado.
      }
    }

    setMarcacionSeleccionada(null);
  };

  /* =================================================
     RANGO FECHAS
  ================================================= */

  useEffect(() => {
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setFechaHasta(fechaDesde);
    }
  }, [fechaDesde, fechaHasta]);

  /* =================================================
     RENDER
  ================================================= */

  return (
    <div className="min-h-full bg-[#f5f7fa] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* ============================================
            ENCABEZADO
        ============================================ */}

        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <ClipboardCheck size={23} />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">
                Gestión de Obras
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Control de Asistencia
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Gestiona entradas, salidas, novedades y jornadas del personal en
                obra.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void cargarAsistencias()}
              disabled={loading}
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-slate-200
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-slate-700
                shadow-sm
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={() => setModalNovedadOpen(true)}
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-amber-200
                bg-amber-50
                px-4
                py-2
                text-sm
                font-semibold
                text-amber-700
                transition
                hover:bg-amber-100
              "
            >
              <AlertTriangle size={16} />
              Novedad
            </button>

            <button
              type="button"
              onClick={() => setModalSalidaOpen(true)}
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-blue-200
                bg-blue-50
                px-4
                py-2
                text-sm
                font-semibold
                text-blue-700
                transition
                hover:bg-blue-100
              "
            >
              <LogOut size={16} />
              Registrar salida
            </button>

            <button
              type="button"
              onClick={() => setModalEntradaOpen(true)}
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-orange-500
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-orange-600
              "
            >
              <LogIn size={16} />
              Registrar entrada
            </button>
          </div>
        </div>

        {/* ============================================
            KPIs
        ============================================ */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* PRESENTES */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Presentes</p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {estadisticas.presentes}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck size={20} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Jornadas con asistencia normal
            </p>
          </div>

          {/* ATRASOS */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Atrasos</p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {estadisticas.atrasos}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={20} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Registros marcados como atraso
            </p>
          </div>

          {/* AUSENTES */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ausentes</p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {estadisticas.ausentes}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <UserX size={20} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">Ausencias registradas</p>
          </div>

          {/* PERMISOS */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Permisos</p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {estadisticas.permisos}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck size={20} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">Permisos registrados</p>
          </div>

          {/* TIEMPO */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Tiempo trabajado
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatearMinutos(estadisticas.minutos)}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Timer size={20} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Total calculado por marcaciones
            </p>
          </div>
        </div>

        {/* ============================================
            FILTROS
        ============================================ */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            {/* BUSCADOR */}

            <div className="relative w-full lg:max-w-md">
              <Search
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
                type="text"
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value);

                  setPaginaActual(1);
                }}
                placeholder="Buscar empleado, cédula, obra o cargo..."
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  py-2.5
                  pl-10
                  pr-4
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-orange-400
                  focus:ring-2
                  focus:ring-orange-100
                "
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMostrarFiltros((actual) => !actual)}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                <Filter size={16} />
                Filtros
                {cantidadFiltrosActivos > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                    {cantidadFiltrosActivos}
                  </span>
                )}
              </button>

              {(cantidadFiltrosActivos > 0 || busqueda) && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3.5
                    py-2.5
                    text-sm
                    font-medium
                    text-slate-600
                    transition
                    hover:border-red-200
                    hover:bg-red-50
                    hover:text-red-600
                  "
                >
                  <X size={16} />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {mostrarFiltros && (
            <div className="grid gap-4 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* EMPLEADO */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Empleado
                </label>

                <select
                  value={filtroEmpleado}
                  onChange={(event) => {
                    setFiltroEmpleado(event.target.value);

                    setPaginaActual(1);
                  }}
                  disabled={loadingCatalogos}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                    text-slate-700
                    outline-none
                    transition
                    focus:border-orange-400
                    focus:ring-2
                    focus:ring-orange-100
                    disabled:bg-slate-100
                  "
                >
                  <option value="">Todos los empleados</option>

                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {`${empleado.apellidos || ""} ${empleado.nombres || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              {/* OBRA */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Obra
                </label>

                <select
                  value={filtroObra}
                  onChange={(event) => {
                    setFiltroObra(event.target.value);

                    setPaginaActual(1);
                  }}
                  disabled={loadingCatalogos}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                    text-slate-700
                    outline-none
                    transition
                    focus:border-orange-400
                    focus:ring-2
                    focus:ring-orange-100
                    disabled:bg-slate-100
                  "
                >
                  <option value="">Todas las obras</option>

                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.codigo ? `${obra.codigo} - ` : ""}

                      {obra.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* ESTADO */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </label>

                <select
                  value={filtroEstado}
                  onChange={(event) => {
                    setFiltroEstado(
                      event.target.value as "" | EstadoAsistencia,
                    );

                    setPaginaActual(1);
                  }}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                    text-slate-700
                    outline-none
                    transition
                    focus:border-orange-400
                    focus:ring-2
                    focus:ring-orange-100
                  "
                >
                  <option value="">Todos los estados</option>

                  <option value="presente">Presente</option>

                  <option value="atraso">Atraso</option>

                  <option value="ausente">Ausente</option>

                  <option value="permiso">Permiso</option>

                  <option value="justificado">Justificado</option>
                </select>
              </div>

              {/* DESDE */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Desde
                </label>

                <input
                  type="date"
                  value={fechaDesde}
                  max={fechaHasta || obtenerFechaLocal()}
                  onChange={(event) => {
                    setFechaDesde(event.target.value);

                    setPaginaActual(1);
                  }}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                    text-slate-700
                    outline-none
                    transition
                    focus:border-orange-400
                    focus:ring-2
                    focus:ring-orange-100
                  "
                />
              </div>

              {/* HASTA */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hasta
                </label>

                <input
                  type="date"
                  value={fechaHasta}
                  min={fechaDesde}
                  max={obtenerFechaLocal()}
                  onChange={(event) => {
                    setFechaHasta(event.target.value);

                    setPaginaActual(1);
                  }}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                    text-slate-700
                    outline-none
                    transition
                    focus:border-orange-400
                    focus:ring-2
                    focus:ring-orange-100
                  "
                />
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            TABLA
        ============================================ */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* HEADER TABLA */}

          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Registros de asistencia
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {asistenciasFiltradas.length} registro
                {asistenciasFiltradas.length === 1 ? "" : "s"} encontrado
                {asistenciasFiltradas.length === 1 ? "" : "s"}
              </p>
            </div>

            {estadisticas.justificados > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
                <ShieldCheck size={14} />
                {estadisticas.justificados} justificado
                {estadisticas.justificados === 1 ? "" : "s"}
              </div>
            )}
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-slate-500">
              <Loader2
                size={32}
                className="mb-3 animate-spin text-orange-500"
              />

              <p className="text-sm">Cargando registros de asistencia...</p>
            </div>
          ) : error ? (
            /* ERROR */

            <div className="flex min-h-[340px] items-center justify-center p-6">
              <div className="max-w-lg text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <AlertCircle size={24} />
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  No se pudieron cargar los registros
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

                <button
                  type="button"
                  onClick={() => void cargarAsistencias()}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <RefreshCw size={16} />
                  Reintentar
                </button>
              </div>
            </div>
          ) : asistenciasPaginadas.length === 0 ? (
            /* VACÍO */

            <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarDays size={28} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Sin registros de asistencia
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                No existen registros que coincidan con los filtros
                seleccionados.
              </p>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-700
                  shadow-sm
                  transition
                  hover:bg-slate-50
                "
              >
                <X size={16} />
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              {/* TABLA */}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Empleado
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Obra
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Fecha
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Entrada
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Salida
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tiempo
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Estado
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {asistenciasPaginadas.map((asistencia) => {
                      const nombre =
                        `${asistencia.nombres || ""} ${asistencia.apellidos || ""}`.trim() ||
                        "Empleado";

                      return (
                        <tr
                          key={asistencia.id}
                          className="transition hover:bg-slate-50"
                        >
                          {/* EMPLEADO */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <UserRound size={17} />
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[210px] truncate text-sm font-semibold text-slate-900">
                                  {nombre}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  {asistencia.cedula ||
                                    asistencia.cargo_obra ||
                                    asistencia.cargo ||
                                    "Sin información adicional"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* OBRA */}

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-2">
                              <Building2
                                size={15}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />

                              <div>
                                <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">
                                  {asistencia.obra_nombre || "—"}
                                </p>

                                {asistencia.obra_codigo && (
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {asistencia.obra_codigo}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* FECHA */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                            {formatearFecha(asistencia.fecha)}
                          </td>

                          {/* ENTRADA */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                              <LogIn size={15} />

                              {formatearHora(asistencia.primera_entrada)}
                            </div>
                          </td>

                          {/* SALIDA */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                              <LogOut size={15} />

                              {formatearHora(asistencia.ultima_salida)}
                            </div>
                          </td>

                          {/* TIEMPO */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                              <Timer size={15} className="text-orange-500" />

                              {asistencia.tiempo_trabajado?.texto ||
                                formatearMinutos(asistencia.minutos_trabajados)}
                            </span>
                          </td>

                          {/* ESTADO */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`
                                  inline-flex
                                  items-center
                                  rounded-full
                                  border
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-semibold
                                  ${obtenerClaseEstado(asistencia.estado)}
                                `}
                            >
                              {obtenerEtiquetaEstado(asistencia.estado)}
                            </span>
                          </td>

                          {/* ACCIÓN */}

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => abrirDetalle(asistencia)}
                              className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  px-3
                                  py-2
                                  text-xs
                                  font-medium
                                  text-slate-700
                                  shadow-sm
                                  transition
                                  hover:border-orange-200
                                  hover:bg-orange-50
                                  hover:text-orange-600
                                "
                            >
                              <Eye size={15} />
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ======================================
                  PAGINACIÓN
              ====================================== */}

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Mostrando{" "}
                  <span className="font-medium text-slate-700">
                    {indiceInicio}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium text-slate-700">
                    {indiceFin}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-slate-700">
                    {asistenciasFiltradas.length}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaginaActual((pagina) => Math.max(1, pagina - 1))
                    }
                    disabled={paginaActual <= 1}
                    className="
                      inline-flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      text-slate-500
                      shadow-sm
                      transition
                      hover:bg-slate-50
                      hover:text-slate-900
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <div className="flex min-w-[100px] items-center justify-center text-sm text-slate-500">
                    Página{" "}
                    <span className="mx-1 font-semibold text-slate-900">
                      {paginaActual}
                    </span>
                    de{" "}
                    <span className="ml-1 font-semibold text-slate-900">
                      {totalPaginas}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPaginaActual((pagina) =>
                        Math.min(totalPaginas, pagina + 1),
                      )
                    }
                    disabled={paginaActual >= totalPaginas}
                    className="
                      inline-flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      text-slate-500
                      shadow-sm
                      transition
                      hover:bg-slate-50
                      hover:text-slate-900
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============================================
          MODAL ENTRADA
      ============================================ */}

      <RegistrarEntradaModal
        isOpen={modalEntradaOpen}
        onClose={() => setModalEntradaOpen(false)}
        onSuccess={refrescarDatos}
      />

      {/* ============================================
          MODAL SALIDA
      ============================================ */}

      <RegistrarSalidaModal
        isOpen={modalSalidaOpen}
        onClose={() => setModalSalidaOpen(false)}
        onSuccess={refrescarDatos}
      />

      {/* ============================================
          MODAL NOVEDAD
      ============================================ */}

      <RegistrarNovedadModal
        isOpen={modalNovedadOpen}
        onClose={() => setModalNovedadOpen(false)}
        onSuccess={refrescarDatos}
      />

      {/* ============================================
          MODAL DETALLE
      ============================================ */}

      <DetalleAsistenciaModal
        isOpen={modalDetalleOpen}
        asistenciaId={asistenciaSeleccionada?.id || null}
        onClose={() => {
          setModalDetalleOpen(false);

          setAsistenciaSeleccionada(null);
        }}
        onEditarAsistencia={abrirCorregirAsistencia}
        onCorregirMarcacion={abrirCorregirMarcacion}
      />

      {/* ============================================
          CORREGIR ASISTENCIA
      ============================================ */}

      <CorregirAsistenciaModal
        isOpen={modalCorregirAsistenciaOpen}
        asistencia={asistenciaSeleccionada}
        onClose={() => {
          setModalCorregirAsistenciaOpen(false);

          setAsistenciaSeleccionada(null);
        }}
        onSuccess={handleCorreccionAsistencia}
      />

      {/* ============================================
          CORREGIR MARCACIÓN
      ============================================ */}

      <CorregirMarcacionModal
        isOpen={modalCorregirMarcacionOpen}
        marcacion={marcacionSeleccionada}
        asistencia={asistenciaSeleccionada}
        onClose={() => {
          setModalCorregirMarcacionOpen(false);

          setMarcacionSeleccionada(null);

          setAsistenciaSeleccionada(null);
        }}
        onSuccess={handleCorreccionMarcacion}
      />
    </div>
  );
};

export default AsistenciaPage;
