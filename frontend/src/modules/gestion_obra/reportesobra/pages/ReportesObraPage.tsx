import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Eye,
  FilterX,
  HardHat,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import {
  obtenerReporteObra,
  obtenerResumenGeneral,
  type EstadoObra,
  type FiltrosResumenGeneral,
  type ObraResumenItem,
  type ReporteObraCompleto,
  type ResumenGeneralObras,
} from "../services/reporteObraService";

/* =====================================================
   CONSTANTES
===================================================== */

const ESTADOS: {
  value: "" | EstadoObra;
  label: string;
}[] = [
  {
    value: "",
    label: "Todos los estados",
  },
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

/* =====================================================
   HELPERS
===================================================== */

const formatearMoneda = (valor: number | string | null | undefined) => {
  const numero = Number(valor ?? 0);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) {
    return "—";
  }

  const soloFecha = fecha.includes("T") ? fecha.split("T")[0] : fecha;

  const partes = soloFecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const normalizarNumero = (valor: number | string | null | undefined) => {
  const numero = Number(valor ?? 0);

  return Number.isFinite(numero) ? numero : 0;
};

const obtenerMensajeError = (error: unknown): string => {
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
      "No fue posible completar la solicitud."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ha ocurrido un error inesperado.";
};

const obtenerEtiquetaEstado = (estado: EstadoObra) => {
  switch (estado) {
    case "planificada":
      return "Planificada";

    case "en_proceso":
      return "En proceso";

    case "pausada":
      return "Pausada";

    case "finalizada":
      return "Finalizada";

    case "cancelada":
      return "Cancelada";

    default:
      return estado;
  }
};

const obtenerClaseEstado = (estado: EstadoObra) => {
  switch (estado) {
    case "planificada":
      return "bg-sky-50 text-sky-700 ring-sky-600/20";

    case "en_proceso":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "pausada":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "finalizada":
      return "bg-indigo-50 text-indigo-700 ring-indigo-600/20";

    case "cancelada":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";

    default:
      return "bg-slate-50 text-slate-700 ring-slate-600/20";
  }
};

/* =====================================================
   COMPONENTE KPI
===================================================== */

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  descripcion: string;
  icono: React.ReactNode;
}

const KpiCard = ({ titulo, valor, descripcion, icono }: KpiCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{titulo}</p>

          <p className="mt-2 truncate text-2xl font-bold text-slate-900">
            {valor}
          </p>

          <p className="mt-1 text-xs text-slate-500">{descripcion}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icono}
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   PANEL DETALLE DE OBRA
===================================================== */

interface DetalleReporteProps {
  reporte: ReporteObraCompleto | null;
  cargando: boolean;
  error: string | null;
  onClose: () => void;
}

const DetalleReporte = ({
  reporte,
  cargando,
  error,
  onClose,
}: DetalleReporteProps) => {
  if (cargando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
        <div className="flex min-h-[240px] w-full max-w-3xl items-center justify-center rounded-2xl bg-white shadow-2xl">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-slate-700" />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Generando reporte de obra...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-7 w-7 text-rose-600" />

            <h2 className="text-lg font-bold text-slate-900">
              No se pudo cargar el reporte
            </h2>
          </div>

          <p className="mt-4 text-sm text-slate-600">{error}</p>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!reporte) {
    return null;
  }

  const financiero = reporte.resumen_financiero;

  const porcentaje = Math.max(
    0,
    Math.min(normalizarNumero(financiero.porcentaje_ejecutado), 100),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-6xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Reporte integral de obra
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {reporte.obra.nombre}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>
                Código:{" "}
                <strong className="text-slate-700">
                  {reporte.obra.codigo}
                </strong>
              </span>

              <span>
                Cliente:{" "}
                <strong className="text-slate-700">
                  {reporte.obra.cliente_nombre || "Sin especificar"}
                </strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* DATOS GENERALES */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              titulo="Presupuesto"
              valor={formatearMoneda(financiero.presupuesto)}
              descripcion="Presupuesto establecido para la obra"
              icono={<WalletCards className="h-5 w-5" />}
            />

            <KpiCard
              titulo="Ejecutado"
              valor={formatearMoneda(financiero.total_ejecutado)}
              descripcion="Gastos pagados + pagos al personal"
              icono={<TrendingDown className="h-5 w-5" />}
            />

            <KpiCard
              titulo="Comprometido"
              valor={formatearMoneda(financiero.total_comprometido)}
              descripcion="Ejecutado + gastos pendientes"
              icono={<CircleDollarSign className="h-5 w-5" />}
            />

            <KpiCard
              titulo="Disponible"
              valor={formatearMoneda(financiero.presupuesto_disponible)}
              descripcion="Presupuesto menos valor ejecutado"
              icono={<BarChart3 className="h-5 w-5" />}
            />
          </div>

          {/* PRESUPUESTO */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ejecución presupuestaria
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Porcentaje del presupuesto utilizado en costos ejecutados.
                </p>
              </div>

              <span className="text-2xl font-bold text-slate-900">
                {normalizarNumero(financiero.porcentaje_ejecutado).toFixed(2)}%
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-800 transition-all"
                style={{
                  width: `${porcentaje}%`,
                }}
              />
            </div>

            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <span className="text-slate-500">Gastos obra</span>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatearMoneda(financiero.gastos_pagados)}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Pagos personal</span>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatearMoneda(financiero.pagos_personal)}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Pendiente</span>

                <p className="mt-1 font-semibold text-amber-700">
                  {formatearMoneda(financiero.gastos_pendientes)}
                </p>
              </div>
            </div>
          </section>

          {/* INFORMACIÓN OPERATIVA */}

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <HardHat className="h-5 w-5" />
                Información de la obra
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Estado
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${obtenerClaseEstado(
                      reporte.obra.estado,
                    )}`}
                  >
                    {obtenerEtiquetaEstado(reporte.obra.estado)}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Ubicación
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {reporte.obra.ubicacion || "No registrada"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Inicio
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formatearFecha(reporte.obra.fecha_inicio)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Finalización
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formatearFecha(reporte.obra.fecha_fin)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <CircleDollarSign className="h-5 w-5" />
                Flujo financiero vinculado
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase text-emerald-700">
                    Ingresos
                  </p>

                  <p className="mt-2 text-lg font-bold text-emerald-800">
                    {formatearMoneda(financiero.ingresos)}
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase text-rose-700">
                    Egresos
                  </p>

                  <p className="mt-2 text-lg font-bold text-rose-800">
                    {formatearMoneda(financiero.egresos)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-600">
                    Flujo neto
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatearMoneda(financiero.flujo_neto)}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* GASTOS */}

          {reporte.gastos && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <ClipboardList className="h-5 w-5" />
                Gastos registrados
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Registros</p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {reporte.gastos.resumen.total_registros}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Pagados</p>

                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {reporte.gastos.resumen.pagados}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Pendientes</p>

                  <p className="mt-1 text-xl font-bold text-amber-700">
                    {reporte.gastos.resumen.pendientes}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Anulados</p>

                  <p className="mt-1 text-xl font-bold text-rose-700">
                    {reporte.gastos.resumen.anulados}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* PERSONAL + CONTROLES */}

          <div className="grid gap-5 lg:grid-cols-2">
            {reporte.personal && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Users className="h-5 w-5" />
                  Personal
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Asignados</p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {reporte.personal.resumen.empleados_asignados}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Activos</p>

                    <p className="mt-1 text-xl font-bold text-emerald-700">
                      {reporte.personal.resumen.empleados_activos}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Pagado</p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      {formatearMoneda(
                        reporte.personal.resumen.total_pagado_personal,
                      )}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {reporte.controles && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <CalendarDays className="h-5 w-5" />
                  Control diario
                </h3>

                <p className="mt-5 text-xs text-slate-500">
                  Registros encontrados
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {reporte.controles.pagination.total}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   PAGE
===================================================== */

const ReportesObraPage = () => {
  const [resumen, setResumen] = useState<ResumenGeneralObras | null>(null);

  const [obras, setObras] = useState<ObraResumenItem[]>([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [total, setTotal] = useState(0);

  const limit = 10;

  /* =================================================
       FILTROS
    ================================================= */

  const [buscar, setBuscar] = useState("");

  const [buscarAplicado, setBuscarAplicado] = useState("");

  const [estado, setEstado] = useState<"" | EstadoObra>("");

  const [fechaDesde, setFechaDesde] = useState("");

  const [fechaHasta, setFechaHasta] = useState("");

  /* =================================================
       REPORTE INDIVIDUAL
    ================================================= */

  const [reporteSeleccionado, setReporteSeleccionado] =
    useState<ReporteObraCompleto | null>(null);

  const [cargandoReporte, setCargandoReporte] = useState(false);

  const [errorReporte, setErrorReporte] = useState<string | null>(null);

  const [modalReporteOpen, setModalReporteOpen] = useState(false);

  /* =================================================
       FILTROS API
    ================================================= */

  const filtros = useMemo<FiltrosResumenGeneral>(
    () => ({
      page,
      limit,

      ...(estado
        ? {
            estado,
          }
        : {}),

      ...(buscarAplicado
        ? {
            buscar: buscarAplicado,
          }
        : {}),

      ...(fechaDesde
        ? {
            fecha_desde: fechaDesde,
          }
        : {}),

      ...(fechaHasta
        ? {
            fecha_hasta: fechaHasta,
          }
        : {}),
    }),
    [page, estado, buscarAplicado, fechaDesde, fechaHasta],
  );

  /* =================================================
       CARGAR RESUMEN
    ================================================= */

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);

      setError(null);

      const response = await obtenerResumenGeneral(filtros);

      setResumen(response.resumen);

      setObras(response.data);

      setTotal(response.pagination.total);

      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Error cargando reportes de obra:", error);

      setError(obtenerMensajeError(error));
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  /* =================================================
       BUSCAR
    ================================================= */

  const aplicarBusqueda = () => {
    setPage(1);

    setBuscarAplicado(buscar.trim());
  };

  /* =================================================
       LIMPIAR
    ================================================= */

  const limpiarFiltros = () => {
    setBuscar("");
    setBuscarAplicado("");
    setEstado("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  };

  /* =================================================
       VER REPORTE
    ================================================= */

  const handleVerReporte = async (obraId: string) => {
    try {
      setModalReporteOpen(true);

      setCargandoReporte(true);

      setReporteSeleccionado(null);

      setErrorReporte(null);

      const response = await obtenerReporteObra(obraId, {
        incluir_gastos: true,
        incluir_personal: true,
        incluir_controles: true,
        incluir_finanzas: true,
      });

      setReporteSeleccionado(response.data);
    } catch (error) {
      console.error("Error obteniendo reporte:", error);

      setErrorReporte(obtenerMensajeError(error));
    } finally {
      setCargandoReporte(false);
    }
  };

  /* =================================================
       RENDER
    ================================================= */

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* HEADER */}

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <BarChart3 className="h-4 w-4" />
              Gestión de Obras
            </div>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Reportes de Obras
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Analiza presupuesto, costos ejecutados, gastos pendientes,
              personal y actividad financiera de cada obra.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void cargarDatos();
            }}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`}
            />
            Actualizar
          </button>
        </div>

        {/* KPIS */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            titulo="Total de obras"
            valor={resumen?.total_obras ?? 0}
            descripcion="Obras registradas en el sistema"
            icono={<Building2 className="h-5 w-5" />}
          />

          <KpiCard
            titulo="En proceso"
            valor={resumen?.en_proceso ?? 0}
            descripcion="Obras actualmente en ejecución"
            icono={<HardHat className="h-5 w-5" />}
          />

          <KpiCard
            titulo="Finalizadas"
            valor={resumen?.finalizadas ?? 0}
            descripcion="Obras completadas"
            icono={<ClipboardList className="h-5 w-5" />}
          />

          <KpiCard
            titulo="Presupuesto total"
            valor={formatearMoneda(resumen?.presupuesto_total ?? 0)}
            descripcion="Presupuesto acumulado de las obras"
            icono={<WalletCards className="h-5 w-5" />}
          />
        </div>

        {/* FILTROS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(240px,1.4fr)_minmax(170px,0.7fr)_170px_170px_auto]">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Buscar
              </label>

              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-slate-400">
                <div className="flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </div>

                <input
                  type="text"
                  value={buscar}
                  onChange={(event) => {
                    setBuscar(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      aplicarBusqueda();
                    }
                  }}
                  placeholder="Código, obra, cliente..."
                  className="min-w-0 flex-1 border-none bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none"
                />

                <button
                  type="button"
                  onClick={aplicarBusqueda}
                  className="border-l border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Buscar
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado
              </label>

              <select
                value={estado}
                onChange={(event) => {
                  setEstado(event.target.value as "" | EstadoObra);

                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                {ESTADOS.map((item) => (
                  <option key={item.value || "todos"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Desde
              </label>

              <input
                type="date"
                value={fechaDesde}
                onChange={(event) => {
                  setFechaDesde(event.target.value);

                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hasta
              </label>

              <input
                type="date"
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={(event) => {
                  setFechaHasta(event.target.value);

                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <FilterX className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

            <div>
              <p className="font-semibold text-rose-800">
                No se pudieron cargar los reportes
              </p>

              <p className="mt-1 text-sm text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* TABLA */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Resumen por obra</h2>

              <p className="mt-1 text-xs text-slate-500">
                {total} obra
                {total !== 1 ? "s" : ""} encontrada
                {total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {cargando ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-700" />

                <p className="mt-3 text-sm text-slate-500">
                  Cargando reportes...
                </p>
              </div>
            </div>
          ) : obras.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
              <Building2 className="h-10 w-10 text-slate-300" />

              <p className="mt-4 font-semibold text-slate-700">
                No se encontraron obras
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Prueba cambiando los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Obra
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Presupuesto
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Gastos
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Personal
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Empleados
                    </th>

                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {obras.map((obra) => {
                    const gastos = normalizarNumero(obra.gastos_pagados);

                    const personal = normalizarNumero(obra.pagos_personal);

                    return (
                      <tr
                        key={obra.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                              <Building2 className="h-5 w-5" />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {obra.nombre}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {obra.codigo}

                                {obra.cliente_nombre
                                  ? ` · ${obra.cliente_nombre}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${obtenerClaseEstado(
                              obra.estado,
                            )}`}
                          >
                            {obtenerEtiquetaEstado(obra.estado)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800">
                          {formatearMoneda(obra.presupuesto)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <p className="text-sm font-semibold text-slate-800">
                            {formatearMoneda(gastos)}
                          </p>

                          {normalizarNumero(obra.gastos_pendientes) > 0 && (
                            <p className="mt-0.5 text-xs text-amber-600">
                              +{formatearMoneda(obra.gastos_pendientes)}{" "}
                              pendiente
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800">
                          {formatearMoneda(personal)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <Users className="h-4 w-4 text-slate-400" />

                            {obra.empleados_activos}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              void handleVerReporte(obra.id);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                            Ver reporte
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINACIÓN */}

          {!cargando && obras.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Página <strong className="text-slate-800">{page}</strong> de{" "}
                <strong className="text-slate-800">{totalPages}</strong>
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* NOTA */}

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-start gap-3">
            <CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />

            <div>
              <p className="text-sm font-semibold text-sky-900">
                Cálculo del costo ejecutado
              </p>

              <p className="mt-1 text-sm leading-6 text-sky-800">
                El costo ejecutado se obtiene de los gastos de obra pagados más
                los pagos de empleados pagados. Las transacciones financieras se
                utilizan para trazabilidad y flujo de caja, evitando
                contabilizar un mismo egreso dos veces.
              </p>
            </div>
          </div>
        </div>
      </div>

      {modalReporteOpen && (
        <DetalleReporte
          reporte={reporteSeleccionado}
          cargando={cargandoReporte}
          error={errorReporte}
          onClose={() => {
            setModalReporteOpen(false);

            setReporteSeleccionado(null);

            setErrorReporte(null);
          }}
        />
      )}
    </div>
  );
};

export default ReportesObraPage;
