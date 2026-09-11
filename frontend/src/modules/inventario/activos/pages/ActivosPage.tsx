import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import {
  type Activo,
  getActivos,
  deleteActivo,
  exportarInventarioPDF,
  exportarInventarioExcel,
} from "../../activos/service/activoService";

import CreateActivoModal from "../components/CreateActivoModal";

import EditActivoModal from "../components/EditActivoModal";

import UpdateEstadoActivoModal from "../components/UpdateEstadoActivoModal";

import ActivoDetalleModal from "../components/ActivoDetalleModal";

import {
  Plus,
  Search,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  Package,
  MapPin,
  Tag,
  Boxes,
  Eye,
  Pencil,
  Trash2,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  XCircle,
  Warehouse,
  Layers3,
  Ban,
  SlidersHorizontal,
} from "lucide-react";

/* =====================================================
   FILTRO DE ESTADOS
===================================================== */

type EstadoFiltro =
  | "todos"
  | "disponible"
  | "alquilado"
  | "mantenimiento"
  | "danado"
  | "perdido"
  | "dado_baja"
  | "mixto";

/* =====================================================
   HELPERS
===================================================== */

const getEstadoLabel = (estado?: string | null) => {
  switch (estado) {
    case "disponible":
      return "Disponible";

    case "alquilado":
      return "Alquilado";

    case "mantenimiento":
      return "Mantenimiento";

    case "danado":
      return "Dañado";

    case "perdido":
      return "Perdido";

    case "dado_baja":
      return "Dado de baja";

    case "mixto":
      return "Estado mixto";

    default:
      return estado || "Sin estado";
  }
};

const getEstadoClass = (estado?: string | null) => {
  switch (estado) {
    case "disponible":
      return "bg-green-100 text-green-700";

    case "alquilado":
      return "bg-blue-100 text-blue-700";

    case "mantenimiento":
      return "bg-yellow-100 text-yellow-700";

    case "danado":
      return "bg-orange-100 text-orange-700";

    case "perdido":
      return "bg-red-100 text-red-700";

    case "dado_baja":
      return "bg-gray-200 text-gray-700";

    case "mixto":
      return "bg-purple-100 text-purple-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getEstadoIcon = (estado?: string | null) => {
  switch (estado) {
    case "disponible":
      return <CheckCircle2 size={14} />;

    case "alquilado":
      return <Package size={14} />;

    case "mantenimiento":
      return <Wrench size={14} />;

    case "danado":
      return <AlertTriangle size={14} />;

    case "perdido":
      return <XCircle size={14} />;

    case "dado_baja":
      return <Ban size={14} />;

    case "mixto":
      return <Layers3 size={14} />;

    default:
      return <Package size={14} />;
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

function ActivosPage() {
  /* =====================================================
     ESTADOS GENERALES
  ===================================================== */

  const [activos, setActivos] = useState<Activo[]>([]);

  const [search, setSearch] = useState("");

  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");

  const [tipoControlFiltro, setTipoControlFiltro] = useState("todos");

  const [loading, setLoading] = useState(false);

  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  /* =====================================================
     MODAL CREAR
  ===================================================== */

  const [modalOpen, setModalOpen] = useState(false);

  /* =====================================================
     MODAL EDITAR
  ===================================================== */

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [activoEditar, setActivoEditar] = useState<Activo | null>(null);

  /* =====================================================
     MODAL ESTADO
  ===================================================== */

  const [estadoModalOpen, setEstadoModalOpen] = useState(false);

  const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);

  /* =====================================================
     MODAL HISTORIAL
  ===================================================== */

  const [historialModalOpen, setHistorialModalOpen] = useState(false);

  const [activoHistorialId, setActivoHistorialId] = useState<string | null>(
    null,
  );

  /* =====================================================
     ELIMINANDO
  ===================================================== */

  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* =====================================================
     CARGAR ACTIVOS
  ===================================================== */

  const loadActivos = async () => {
    try {
      setLoading(true);

      const data = await getActivos();

      setActivos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error cargando activos:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo cargar el inventario",

        text:
          error?.response?.data?.message ||
          "Ocurrió un error al consultar los activos.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivos();
  }, []);

  /* =====================================================
     ABRIR MODAL EDITAR
  ===================================================== */

  const openEditModal = (activo: Activo) => {
    setActivoEditar(activo);

    setEditModalOpen(true);
  };

  /* =====================================================
     ABRIR MODAL ESTADO
  ===================================================== */

  const openEstadoModal = (activo: Activo) => {
    setSelectedActivo(activo);

    setEstadoModalOpen(true);
  };

  /* =====================================================
     ABRIR HISTORIAL
  ===================================================== */

  const openHistorialModal = (activoId: string) => {
    setActivoHistorialId(activoId);

    setHistorialModalOpen(true);
  };

  /* =====================================================
     ELIMINAR ACTIVO
  ===================================================== */

  const handleDeleteActivo = async (activo: Activo) => {
    const confirmacion = await Swal.fire({
      icon: "warning",

      title: "¿Eliminar activo?",

      html: `
            <div style="text-align:left; line-height:1.7">

              <p>
                <strong>Activo:</strong>
                ${activo.nombre}
              </p>

              <p>
                <strong>Código:</strong>
                ${activo.codigo}
              </p>

              <p style="margin-top:14px;">
                La eliminación solamente será permitida
                si este activo todavía no tiene contratos
                ni operaciones reales relacionadas.
              </p>

              <p>
                Si ya existe historial operativo,
                el sistema impedirá su eliminación
                para conservar la trazabilidad.
              </p>

            </div>
          `,

      showCancelButton: true,

      confirmButtonText: "Sí, eliminar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      setDeletingId(activo.id);

      await deleteActivo(activo.id);

      setActivos((prev) => prev.filter((item) => item.id !== activo.id));

      await Swal.fire({
        icon: "success",

        title: "Activo eliminado",

        text: `${activo.nombre} fue eliminado correctamente.`,

        timer: 1800,

        showConfirmButton: false,

        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error("Error eliminando activo:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo eliminar",

        text:
          error?.response?.data?.message ||
          "El activo tiene operaciones relacionadas y no puede eliminarse.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  /* =====================================================
     FILTROS
  ===================================================== */

  const filtered = useMemo(() => {
    const termino = search.trim().toLowerCase();

    return activos.filter((activo) => {
      /* =============================================
             BUSCADOR
          ============================================= */

      const matchSearch =
        !termino ||
        activo.nombre?.toLowerCase().includes(termino) ||
        activo.codigo?.toLowerCase().includes(termino) ||
        activo.categoria?.toLowerCase().includes(termino) ||
        activo.ubicacion?.toLowerCase().includes(termino) ||
        activo.marca?.toLowerCase().includes(termino) ||
        activo.responsable?.toLowerCase().includes(termino);

      /* =============================================
             FILTRO ESTADO
          ============================================= */

      let matchEstado = true;

      if (estadoFiltro !== "todos") {
        if (estadoFiltro === "mixto") {
          matchEstado = activo.estado === "mixto";
        } else {
          switch (estadoFiltro) {
            case "disponible":
              matchEstado = activo.cantidad_disponible > 0;
              break;

            case "alquilado":
              matchEstado = activo.cantidad_alquilada > 0;
              break;

            case "mantenimiento":
              matchEstado = activo.cantidad_mantenimiento > 0;
              break;

            case "danado":
              matchEstado = activo.cantidad_danada > 0;
              break;

            case "perdido":
              matchEstado = activo.cantidad_perdida > 0;
              break;

            case "dado_baja":
              matchEstado = activo.cantidad_dado_baja > 0;
              break;
          }
        }
      }

      /* =============================================
             TIPO CONTROL
          ============================================= */

      const matchControl =
        tipoControlFiltro === "todos" ||
        activo.tipo_control === tipoControlFiltro;

      return matchSearch && matchEstado && matchControl;
    });
  }, [activos, search, estadoFiltro, tipoControlFiltro]);

  /* =====================================================
     KPIs
  ===================================================== */

  const resumen = useMemo(() => {
    const registros = activos.length;

    const stockTotal = activos.reduce(
      (total, activo) => total + Number(activo.cantidad_total || 0),
      0,
    );

    const disponibles = activos.reduce(
      (total, activo) => total + Number(activo.cantidad_disponible || 0),
      0,
    );

    const alquilados = activos.reduce(
      (total, activo) => total + Number(activo.cantidad_alquilada || 0),
      0,
    );

    const mantenimiento = activos.reduce(
      (total, activo) => total + Number(activo.cantidad_mantenimiento || 0),
      0,
    );

    const comprometidos = activos.reduce(
      (total, activo) =>
        total +
        Number(activo.cantidad_danada || 0) +
        Number(activo.cantidad_perdida || 0) +
        Number(activo.cantidad_dado_baja || 0),
      0,
    );

    return {
      registros,
      stockTotal,
      disponibles,
      alquilados,
      mantenimiento,
      comprometidos,
    };
  }, [activos]);

  /* =====================================================
     EXPORTAR PDF
  ===================================================== */

  const handleExportPDF = async () => {
    try {
      setExporting("pdf");

      await exportarInventarioPDF();
    } catch (error: any) {
      console.error("Error exportando PDF:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo exportar",

        text:
          error?.response?.data?.message ||
          "No se pudo generar el reporte PDF.",
      });
    } finally {
      setExporting(null);
    }
  };

  /* =====================================================
     EXPORTAR EXCEL
  ===================================================== */

  const handleExportExcel = async () => {
    try {
      setExporting("excel");

      await exportarInventarioExcel();
    } catch (error: any) {
      console.error("Error exportando Excel:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo exportar",

        text:
          error?.response?.data?.message ||
          "No se pudo generar el reporte Excel.",
      });
    } finally {
      setExporting(null);
    }
  };

  /* =====================================================
     LIMPIAR FILTROS
  ===================================================== */

  const limpiarFiltros = () => {
    setSearch("");

    setEstadoFiltro("todos");

    setTipoControlFiltro("todos");
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Activos
          </h1>

          <p className="mt-1 text-gray-500">
            Control de equipos, herramientas y existencias según ubicación,
            disponibilidad y estado operativo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* PDF */}

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting !== null}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {exporting === "pdf" ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <FileDown size={18} />
            )}
            PDF
          </button>

          {/* EXCEL */}

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting !== null}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {exporting === "excel" ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={18} />
            )}
            Excel
          </button>

          {/* ACTUALIZAR */}

          <button
            type="button"
            onClick={loadActivos}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>

          {/* NUEVO */}

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={18} />
            Nuevo Activo
          </button>
        </div>
      </div>

      {/* =================================================
          KPIs
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-6">
        {/* REGISTROS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Activos registrados</p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {resumen.registros}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Registros maestros</p>
            </div>

            <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
              <Boxes size={23} />
            </div>
          </div>
        </div>

        {/* STOCK */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock físico</p>

              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {resumen.stockTotal}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Total de unidades</p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Warehouse size={23} />
            </div>
          </div>
        </div>

        {/* DISPONIBLES */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Disponibles</p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {resumen.disponibles}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Listos para operar</p>
            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <CheckCircle2 size={23} />
            </div>
          </div>
        </div>

        {/* ALQUILADOS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Alquilados</p>

              <h2 className="mt-2 text-3xl font-bold text-purple-600">
                {resumen.alquilados}
              </h2>

              <p className="mt-1 text-xs text-gray-400">En contratos</p>
            </div>

            <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
              <Package size={23} />
            </div>
          </div>
        </div>

        {/* MANTENIMIENTO */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Mantenimiento</p>

              <h2 className="mt-2 text-3xl font-bold text-yellow-600">
                {resumen.mantenimiento}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Fuera de operación</p>
            </div>

            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
              <Wrench size={23} />
            </div>
          </div>
        </div>

        {/* NO OPERATIVOS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">No operativos</p>

              <h2 className="mt-2 text-3xl font-bold text-red-600">
                {resumen.comprometidos}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Dañados / perdidos / baja
              </p>
            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <AlertTriangle size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-gray-500" />

          <div>
            <h2 className="font-semibold text-gray-800">
              Filtros de inventario
            </h2>

            <p className="text-sm text-gray-500">
              Localiza activos por código, nombre, categoría, ubicación o
              condición.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* BUSCADOR */}

          <div className="relative lg:col-span-6">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Buscar código, activo, categoría, ubicación, marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>

          {/* ESTADO */}

          <div className="lg:col-span-3">
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value as EstadoFiltro)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
            >
              <option value="todos">Todos los estados</option>

              <option value="disponible">Con disponibilidad</option>

              <option value="alquilado">Con unidades alquiladas</option>

              <option value="mantenimiento">En mantenimiento</option>

              <option value="danado">Con unidades dañadas</option>

              <option value="perdido">Con unidades perdidas</option>

              <option value="dado_baja">Dado de baja</option>

              <option value="mixto">Estado mixto</option>
            </select>
          </div>

          {/* CONTROL */}

          <div className="lg:col-span-2">
            <select
              value={tipoControlFiltro}
              onChange={(e) => setTipoControlFiltro(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
            >
              <option value="todos">Todo control</option>

              <option value="unidad">Individual</option>

              <option value="cantidad">Por cantidad</option>
            </select>
          </div>

          {/* LIMPIAR */}

          <div className="lg:col-span-1">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="h-full w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Catálogo de Activos
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Existencias reales por estado y ubicación.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {filtered.length} registros
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw size={22} className="animate-spin" />
              Cargando inventario...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <Boxes size={44} className="mb-3 text-gray-300" />

            <p className="font-semibold text-gray-600">
              No se encontraron activos
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Modifica los filtros o registra un nuevo activo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Activo
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Categoría
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ubicación
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Control
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Disponible
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Alquilado
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Mant.
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    No operativo
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((activo) => {
                  const noOperativo =
                    Number(activo.cantidad_danada || 0) +
                    Number(activo.cantidad_perdida || 0) +
                    Number(activo.cantidad_dado_baja || 0);

                  const puedeCambioManual = (activo.existencias || []).some(
                    (existencia) =>
                      existencia.cantidad > 0 &&
                      existencia.estado !== "alquilado",
                  );

                  const deleting = deletingId === activo.id;

                  return (
                    <tr
                      key={activo.id}
                      className="border-t align-middle transition hover:bg-gray-50"
                    >
                      {/* ACTIVO */}

                      <td className="px-5 py-4">
                        <div className="min-w-52">
                          <p className="font-semibold text-gray-800">
                            {activo.nombre}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {activo.codigo}
                          </p>

                          {activo.marca && (
                            <p className="mt-1 text-xs text-gray-400">
                              Marca: {activo.marca}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* CATEGORÍA */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="shrink-0 text-gray-400" />

                          <span className="text-sm text-gray-700">
                            {activo.categoria}
                          </span>
                        </div>
                      </td>

                      {/* UBICACIÓN */}

                      <td className="px-5 py-4">
                        <div className="flex max-w-52 items-start gap-2">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-gray-400"
                          />

                          <span className="text-sm text-gray-600">
                            {activo.ubicacion || "Sin ubicación"}
                          </span>
                        </div>
                      </td>

                      {/* CONTROL */}

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${
                            activo.tipo_control === "unidad"
                              ? "bg-cyan-100 text-cyan-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {activo.tipo_control === "unidad"
                            ? "Individual"
                            : "Cantidad"}
                        </span>
                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4 text-center">
                        <span className="text-lg font-bold text-gray-800">
                          {activo.cantidad_total}
                        </span>
                      </td>

                      {/* DISPONIBLE */}

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex min-w-10 justify-center rounded-lg bg-green-50 px-2 py-1 font-semibold text-green-700">
                          {activo.cantidad_disponible}
                        </span>
                      </td>

                      {/* ALQUILADO */}

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex min-w-10 justify-center rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                          {activo.cantidad_alquilada}
                        </span>
                      </td>

                      {/* MANTENIMIENTO */}

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex min-w-10 justify-center rounded-lg bg-yellow-50 px-2 py-1 font-semibold text-yellow-700">
                          {activo.cantidad_mantenimiento}
                        </span>
                      </td>

                      {/* NO OPERATIVO */}

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex min-w-10 justify-center rounded-lg px-2 py-1 font-semibold ${
                            noOperativo > 0
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {noOperativo}
                        </span>
                      </td>

                      {/* ESTADO */}

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getEstadoClass(
                            activo.estado,
                          )}`}
                        >
                          {getEstadoIcon(activo.estado)}

                          {getEstadoLabel(activo.estado)}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* HISTORIAL */}

                          <button
                            type="button"
                            onClick={() => openHistorialModal(activo.id)}
                            title="Ver historial"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-200 text-cyan-600 transition hover:bg-cyan-50"
                          >
                            <Eye size={17} />
                          </button>

                          {/* EDITAR */}

                          <button
                            type="button"
                            onClick={() => openEditModal(activo)}
                            title="Editar información"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50"
                          >
                            <Pencil size={17} />
                          </button>

                          {/* CAMBIAR ESTADO */}

                          <button
                            type="button"
                            onClick={() => openEstadoModal(activo)}
                            disabled={!puedeCambioManual}
                            title={
                              puedeCambioManual
                                ? "Cambiar estado"
                                : "No existen existencias disponibles para cambio manual"
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Settings size={17} />
                          </button>

                          {/* ELIMINAR */}

                          <button
                            type="button"
                            onClick={() => handleDeleteActivo(activo)}
                            disabled={deleting}
                            title="Eliminar activo"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deleting ? (
                              <RefreshCw size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          LEYENDA / REGLAS
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ESTADOS */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            Estados del inventario
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Una existencia puede distribuirse entre varios estados sin modificar
            las demás unidades.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-green-800">
                <CheckCircle2 size={17} />
                Disponible
              </div>

              <p className="mt-1 text-sm text-green-700">
                Puede utilizarse en nuevas operaciones.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-blue-800">
                <Package size={17} />
                Alquilado
              </div>

              <p className="mt-1 text-sm text-blue-700">
                Se asigna automáticamente desde contratos.
              </p>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-yellow-800">
                <Wrench size={17} />
                Mantenimiento
              </div>

              <p className="mt-1 text-sm text-yellow-700">
                Temporalmente fuera de operación.
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-red-800">
                <AlertTriangle size={17} />
                No operativo
              </div>

              <p className="mt-1 text-sm text-red-700">
                Dañado, perdido o dado de baja.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROL */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            Modelo de control
          </h2>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border bg-cyan-50 p-4">
              <p className="font-semibold text-cyan-800">Control individual</p>

              <p className="mt-1 text-sm leading-6 text-cyan-700">
                Cada equipo físico tiene su propio código, ubicación, estado e
                historial. Dos equipos iguales no comparten necesariamente el
                mismo estado.
              </p>
            </div>

            <div className="rounded-xl border bg-indigo-50 p-4">
              <p className="font-semibold text-indigo-800">
                Control por cantidad
              </p>

              <p className="mt-1 text-sm leading-6 text-indigo-700">
                Un mismo activo mantiene stock agrupado. Por ejemplo, de 100
                unidades pueden existir 70 disponibles, 20 alquiladas y 10 en
                mantenimiento.
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4 text-sm leading-6 text-gray-600">
              Los cambios manuales no permiten asignar el estado{" "}
              <strong>alquilado</strong>. Esa condición debe generarse desde
              Contratos y revertirse mediante Devoluciones.
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MODAL CREAR
      ================================================= */}

      <CreateActivoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadActivos}
      />

      {/* =================================================
          MODAL EDITAR
      ================================================= */}

      <EditActivoModal
        open={editModalOpen}
        activo={activoEditar}
        onClose={() => {
          setEditModalOpen(false);

          setActivoEditar(null);
        }}
        onUpdated={loadActivos}
      />

      {/* =================================================
          MODAL CAMBIAR ESTADO
      ================================================= */}

      <UpdateEstadoActivoModal
        open={estadoModalOpen}
        activo={selectedActivo}
        onClose={() => {
          setEstadoModalOpen(false);

          setSelectedActivo(null);
        }}
        onUpdated={loadActivos}
      />

      {/* =================================================
          MODAL HISTORIAL
      ================================================= */}

      <ActivoDetalleModal
        open={historialModalOpen}
        activoId={activoHistorialId}
        onClose={() => {
          setHistorialModalOpen(false);

          setActivoHistorialId(null);
        }}
      />
    </div>
  );
}

export default ActivosPage;
