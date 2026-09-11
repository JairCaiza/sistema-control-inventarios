import { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import Swal from "sweetalert2";

import {
  Building2,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  DollarSign,
  Edit,
  Eye,
  MapPin,
  PauseCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
  Clock,
} from "lucide-react";

import {
  deleteObra,
  getObras,
  type EstadoObra,
  type Obra,
} from "../services/obrasService";

import CreateObraModal from "../components/modals/CreateObraModal";

import EditObraModal from "../components/modals/EditObraModal";

/* =====================================================
   TIPOS
===================================================== */

type EstadoFiltro = "todos" | EstadoObra;

/* =====================================================
   HELPERS
===================================================== */

const obtenerMensajeError = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    return axiosError.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

/* =====================================================
   FORMATEAR MONEDA
===================================================== */

const formatCurrency = (value: number | string | null | undefined) => {
  const numero = Number(value ?? 0);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

/* =====================================================
   FORMATEAR FECHA
===================================================== */

const formatDate = (date?: string | null) => {
  if (!date) {
    return "No registrada";
  }

  const soloFecha = date.includes("T") ? date.split("T")[0] : date;

  const partes = soloFecha.split("-");

  if (partes.length !== 3) {
    return soloFecha;
  }

  const [year, month, day] = partes;

  return `${day}/${month}/${year}`;
};

/* =====================================================
   LABEL ESTADO
===================================================== */

const getEstadoLabel = (estado: EstadoObra) => {
  const labels: Record<EstadoObra, string> = {
    planificada: "Planificada",

    en_proceso: "En proceso",

    pausada: "Pausada",

    finalizada: "Finalizada",

    cancelada: "Cancelada",
  };

  return labels[estado];
};

/* =====================================================
   ESTILO ESTADO
===================================================== */

const getEstadoClass = (estado: EstadoObra) => {
  const clases: Record<EstadoObra, string> = {
    planificada: "border-slate-200 bg-slate-100 text-slate-700",

    en_proceso: "border-blue-200 bg-blue-50 text-blue-700",

    pausada: "border-amber-200 bg-amber-50 text-amber-700",

    finalizada: "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelada: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return clases[estado];
};

/* =====================================================
   ICONO ESTADO
===================================================== */

const getEstadoIcon = (estado: EstadoObra) => {
  switch (estado) {
    case "planificada":
      return <Clock size={14} />;

    case "en_proceso":
      return <Building2 size={14} />;

    case "pausada":
      return <PauseCircle size={14} />;

    case "finalizada":
      return <CheckCircle size={14} />;

    case "cancelada":
      return <XCircle size={14} />;

    default:
      return <ClipboardList size={14} />;
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");

  const [modalOpen, setModalOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);

  /* =================================================
     CARGAR OBRAS
  ================================================= */

  const loadObras = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getObras();

      setObras(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando obras:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudieron cargar las obras",
        text: obtenerMensajeError(
          error,
          "Ocurrió un error al consultar las obras.",
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadObras();
  }, [loadObras]);

  /* =================================================
     FILTROS
  ================================================= */

  const filtered = useMemo(() => {
    const termino = search.trim().toLowerCase();

    return obras.filter((obra) => {
      const matchEstado =
        estadoFiltro === "todos" || obra.estado === estadoFiltro;

      if (!matchEstado) {
        return false;
      }

      if (!termino) {
        return true;
      }

      const textoBusqueda = [
        obra.codigo,
        obra.nombre,
        obra.cliente_nombre,
        obra.ubicacion,
        getEstadoLabel(obra.estado),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return textoBusqueda.includes(termino);
    });
  }, [obras, search, estadoFiltro]);

  /* =================================================
     RESUMEN
  ================================================= */

  const resumen = useMemo(() => {
    const total = obras.length;

    const planificadas = obras.filter(
      (obra) => obra.estado === "planificada",
    ).length;

    const enProceso = obras.filter(
      (obra) => obra.estado === "en_proceso",
    ).length;

    const pausadas = obras.filter((obra) => obra.estado === "pausada").length;

    const finalizadas = obras.filter(
      (obra) => obra.estado === "finalizada",
    ).length;

    const canceladas = obras.filter(
      (obra) => obra.estado === "cancelada",
    ).length;

    const presupuestoTotal = obras.reduce((totalPresupuesto, obra) => {
      const presupuesto = Number(obra.presupuesto ?? 0);

      return (
        totalPresupuesto + (Number.isFinite(presupuesto) ? presupuesto : 0)
      );
    }, 0);

    return {
      total,
      planificadas,
      enProceso,
      pausadas,
      finalizadas,
      canceladas,
      presupuestoTotal,
    };
  }, [obras]);

  /* =================================================
     ABRIR EDITAR
  ================================================= */

  const handleOpenEdit = (obra: Obra) => {
    setSelectedObra(obra);

    setEditOpen(true);
  };

  /* =================================================
     CERRAR EDITAR
  ================================================= */

  const handleCloseEdit = () => {
    setEditOpen(false);

    setSelectedObra(null);
  };

  /* =================================================
     ELIMINAR
  ================================================= */

  const handleDelete = async (obra: Obra) => {
    const result = await Swal.fire({
      icon: "warning",

      title: "¿Eliminar obra?",

      html: `
            <div style="text-align:left">
              <p style="margin-bottom:8px">
                Está por eliminar:
              </p>

              <strong>
                ${obra.codigo} - ${obra.nombre}
              </strong>

              <p style="margin-top:12px">
                La eliminación solamente será permitida si la obra
                todavía no posee empleados, controles diarios,
                gastos, pagos o movimientos financieros asociados.
              </p>
            </div>
          `,

      showCancelButton: true,

      confirmButtonText: "Sí, eliminar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",

      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteObra(obra.id);

      setObras((prev) => prev.filter((item) => item.id !== obra.id));

      await Swal.fire({
        icon: "success",

        title: "Obra eliminada",

        text: "La obra fue eliminada correctamente.",

        timer: 1500,

        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error eliminando obra:", error);

      const mensaje = obtenerMensajeError(
        error,
        "No se pudo eliminar la obra.",
      );

      await Swal.fire({
        icon: "error",

        title: "No se puede eliminar",

        text: mensaje,

        confirmButtonText: "Entendido",
      });
    }
  };

  /* =================================================
     REFRESCAR
  ================================================= */

  const handleRefresh = async () => {
    await loadObras();
  };

  /* =================================================
     LIMPIAR FILTROS
  ================================================= */

  const limpiarFiltros = () => {
    setSearch("");

    setEstadoFiltro("todos");
  };

  /* =================================================
     RENDER
  ================================================= */

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Gestión de Obras
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">Obras</h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Administra las obras, clientes, presupuesto, estado, personal,
            controles diarios y trazabilidad de cada proyecto.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={18} />
            Nueva obra
          </button>
        </div>
      </div>

      {/* =================================================
          KPIS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Obras registradas
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.total}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Building2 size={22} />
            </div>
          </div>
        </div>

        {/* EN PROCESO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">En proceso</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.enProceso}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <ClipboardList size={22} />
            </div>
          </div>
        </div>

        {/* PLANIFICADAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Planificadas</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.planificadas}
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* FINALIZADAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Finalizadas</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.finalizadas}
              </p>

              {(resumen.pausadas > 0 || resumen.canceladas > 0) && (
                <p className="mt-1 text-xs text-slate-400">
                  {resumen.pausadas} pausadas · {resumen.canceladas} canceladas
                </p>
              )}
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle size={22} />
            </div>
          </div>
        </div>

        {/* PRESUPUESTO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                Presupuesto total
              </p>

              <p className="mt-2 truncate text-2xl font-bold text-slate-900">
                {formatCurrency(resumen.presupuestoTotal)}
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <DollarSign size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Buscar obra
            </label>

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Código, nombre, cliente, ubicación o estado..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="w-full lg:w-64">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Estado
            </label>

            <select
              value={estadoFiltro}
              onChange={(event) =>
                setEstadoFiltro(event.target.value as EstadoFiltro)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="todos">Todos los estados</option>

              <option value="planificada">Planificada</option>

              <option value="en_proceso">En proceso</option>

              <option value="pausada">Pausada</option>

              <option value="finalizada">Finalizada</option>

              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {(search || estadoFiltro !== "todos") && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Mostrando{" "}
            <strong className="text-slate-700">{filtered.length}</strong> de{" "}
            <strong className="text-slate-700">{obras.length}</strong> obras.
          </p>
        </div>
      </div>

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Listado de obras</h2>

          <p className="mt-1 text-sm text-slate-500">
            Ingresa al detalle para gestionar personal, controles, pagos, gastos
            y reportes de cada obra.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw size={28} className="animate-spin" />

            <p className="text-sm">Cargando obras...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">
              <Building2 size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">
              No se encontraron obras
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {obras.length === 0
                ? "Todavía no existen obras registradas."
                : "No existen obras que coincidan con los filtros aplicados."}
            </p>

            {obras.length === 0 && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus size={17} />
                Crear primera obra
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Obra
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ubicación
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fechas
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Presupuesto
                  </th>

                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((obra) => (
                  <tr key={obra.id} className="transition hover:bg-slate-50/80">
                    {/* OBRA */}

                    <td className="px-5 py-4">
                      <div className="min-w-[170px]">
                        <Link
                          to={`/dashboard/obras/${obra.id}`}
                          className="font-semibold text-slate-900 transition hover:text-[var(--color-primary)]"
                        >
                          {obra.nombre}
                        </Link>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {obra.codigo}
                        </p>
                      </div>
                    </td>

                    {/* CLIENTE */}

                    <td className="px-5 py-4">
                      <div className="max-w-[180px]">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {obra.cliente_nombre || "Sin cliente"}
                        </p>
                      </div>
                    </td>

                    {/* UBICACIÓN */}

                    <td className="px-5 py-4">
                      <div className="flex max-w-[210px] items-start gap-2">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <span className="text-sm text-slate-600">
                          {obra.ubicacion || "No registrada"}
                        </span>
                      </div>
                    </td>

                    {/* FECHAS */}

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <CalendarDays
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <div className="text-sm">
                          <p className="font-medium text-slate-700">
                            {formatDate(obra.fecha_inicio)}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Hasta {formatDate(obra.fecha_fin)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* PRESUPUESTO */}

                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(obra.presupuesto)}
                      </span>
                    </td>

                    {/* ESTADO */}

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getEstadoClass(
                          obra.estado,
                        )}`}
                      >
                        {getEstadoIcon(obra.estado)}

                        {getEstadoLabel(obra.estado)}
                      </span>
                    </td>

                    {/* ACCIONES */}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/dashboard/obras/${obra.id}`}
                          title="Ver detalle"
                          aria-label={`Ver detalle de ${obra.nombre}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cyan-600 transition hover:bg-cyan-50"
                        >
                          <Eye size={18} />
                        </Link>

                        <button
                          type="button"
                          title="Editar obra"
                          aria-label={`Editar ${obra.nombre}`}
                          onClick={() => handleOpenEdit(obra)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          type="button"
                          title="Eliminar obra"
                          aria-label={`Eliminar ${obra.nombre}`}
                          onClick={() => void handleDelete(obra)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          INFORMACIÓN DEL MÓDULO
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Flujo operativo de una obra
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Los procesos de la obra permanecen relacionados para mantener la
            trazabilidad.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-semibold text-blue-900">Control diario</p>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                Registra actividades, avance, horarios, clima y observaciones de
                cada jornada.
              </p>
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="font-semibold text-violet-900">Personal asignado</p>

              <p className="mt-1 text-sm leading-6 text-violet-700">
                Relaciona a cada empleado con la obra y su asignación para
                posteriormente controlar sus pagos.
              </p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="font-semibold text-rose-900">Gastos y finanzas</p>

              <p className="mt-1 text-sm leading-6 text-rose-700">
                Los gastos confirmados generan egresos y quedan vinculados a la
                obra para conservar la trazabilidad financiera.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Reglas de integridad
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Cada obra funciona como un centro de operación y de costo. Los pagos
            de empleados, gastos, controles diarios y movimientos financieros
            deben permanecer vinculados a la obra correspondiente.
          </p>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">
              Eliminación protegida
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Una obra con historial operativo o financiero no se elimina. En
              ese caso debe utilizarse el estado <strong>Cancelada</strong> para
              conservar sus registros históricos.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          CREATE MODAL
      ================================================= */}

      <CreateObraModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadObras}
      />

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      <EditObraModal
        open={editOpen}
        obra={selectedObra}
        onClose={handleCloseEdit}
        onUpdated={loadObras}
      />
    </div>
  );
}

export default ObrasPage;
