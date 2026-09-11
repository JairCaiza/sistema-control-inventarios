import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  Boxes,
  FileDown,
  FileSpreadsheet,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  Tags,
  X,
} from "lucide-react";

import {
  getInventarioReporte,
  exportInventarioPDF,
  exportInventarioExcel,
  type InventarioReporte,
} from "../services/reporteService";

function InventarioReportePage() {
  const [data, setData] = useState<InventarioReporte[]>([]);

  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ubicacion, setUbicacion] = useState("");

  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // CARGAR REPORTE
  // =========================================================

  const loadReporte = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getInventarioReporte();

      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error cargando reporte de inventario:", err);

      setData([]);
      setError("No se pudo cargar el reporte de inventario.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReporte();
  }, [loadReporte]);

  // =========================================================
  // OPCIONES DE FILTRO
  // =========================================================

  const categorias = useMemo(() => {
    return Array.from(
      new Set(
        data
          .map((item) => item.categoria)
          .filter(
            (value): value is string =>
              typeof value === "string" && value.trim() !== "",
          ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const ubicaciones = useMemo(() => {
    return Array.from(
      new Set(
        data
          .map((item) => item.ubicacion)
          .filter(
            (value): value is string =>
              typeof value === "string" && value.trim() !== "",
          ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // =========================================================
  // FILTRADO
  // =========================================================

  const filtered = useMemo(() => {
    const termino = search.trim().toLowerCase();

    return data.filter((item) => {
      const coincideBusqueda =
        !termino ||
        String(item.codigo ?? "")
          .toLowerCase()
          .includes(termino) ||
        String(item.nombre ?? "")
          .toLowerCase()
          .includes(termino) ||
        String(item.categoria ?? "")
          .toLowerCase()
          .includes(termino) ||
        String(item.ubicacion ?? "")
          .toLowerCase()
          .includes(termino);

      const coincideCategoria = !categoria || item.categoria === categoria;

      const coincideUbicacion = !ubicacion || item.ubicacion === ubicacion;

      return coincideBusqueda && coincideCategoria && coincideUbicacion;
    });
  }, [data, search, categoria, ubicacion]);

  // =========================================================
  // KPIs
  // =========================================================

  const totalActivos = data.length;

  const totalStock = useMemo(() => {
    return data.reduce(
      (acc, item) => acc + Number(item.cantidad_total ?? 0),
      0,
    );
  }, [data]);

  const totalCategorias = categorias.length;
  const totalUbicaciones = ubicaciones.length;

  // =========================================================
  // LIMPIAR FILTROS
  // =========================================================

  const limpiarFiltros = () => {
    setSearch("");
    setCategoria("");
    setUbicacion("");
  };

  const hayFiltros =
    search.trim() !== "" || categoria !== "" || ubicacion !== "";

  // =========================================================
  // EXPORTAR PDF
  // =========================================================

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);

      await exportInventarioPDF();
    } catch (err) {
      console.error("Error exportando PDF:", err);
      setError("No se pudo exportar el reporte en PDF.");
    } finally {
      setExportingPDF(false);
    }
  };

  // =========================================================
  // EXPORTAR EXCEL
  // =========================================================

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);

      await exportInventarioExcel();
    } catch (err) {
      console.error("Error exportando Excel:", err);
      setError("No se pudo exportar el reporte en Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6 pb-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <BarChart3 size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Reporte de Inventario
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Consulte las existencias actuales, categorías y ubicaciones de
                los activos registrados en el sistema.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadReporte}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={exportingPDF || loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown size={17} />

              {exportingPDF ? "Generando..." : "Exportar PDF"}
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel || loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileSpreadsheet size={17} />

              {exportingExcel ? "Generando..." : "Exportar Excel"}
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          KPI
      ===================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Activos registrados"
          value={totalActivos}
          subtitle="Activos incluidos en el reporte"
          icon={<Boxes size={21} />}
        />

        <KpiCard
          title="Stock total"
          value={totalStock}
          subtitle="Unidades disponibles registradas"
          icon={<PackageCheck size={21} />}
        />

        <KpiCard
          title="Categorías"
          value={totalCategorias}
          subtitle="Categorías diferentes"
          icon={<Tags size={21} />}
        />

        <KpiCard
          title="Ubicaciones"
          value={totalUbicaciones}
          subtitle="Ubicaciones con inventario"
          icon={<MapPin size={21} />}
        />
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-md p-1 transition hover:bg-red-100"
            aria-label="Cerrar mensaje"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-900">Filtros del reporte</h2>

          <p className="mt-1 text-sm text-slate-500">
            Filtre los registros por activo, categoría o ubicación.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_1fr_1fr_auto]">
          {/* BUSCADOR */}

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Buscar por código, activo, categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* CATEGORIA */}

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Todas las categorías</option>

            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* UBICACION */}

          <select
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Todas las ubicaciones</option>

            {ubicaciones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* LIMPIAR */}

          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={16} />
            Limpiar
          </button>
        </div>
      </section>

      {/* =====================================================
          TABLA
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* CABECERA TABLA */}

        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Inventario actual</h2>

            <p className="mt-0.5 text-sm text-slate-500">
              Existencias registradas en el sistema
            </p>
          </div>

          {!loading && (
            <div className="text-sm text-slate-500">
              Mostrando{" "}
              <span className="font-semibold text-slate-900">
                {filtered.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-900">
                {data.length}
              </span>{" "}
              registros
            </div>
          )}
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <RefreshCw size={25} className="animate-spin text-slate-500" />

            <p className="text-sm text-slate-500">Cargando inventario...</p>
          </div>
        ) : filtered.length === 0 ? (
          /* EMPTY */

          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Boxes size={23} />
            </div>

            <h3 className="font-semibold text-slate-900">
              No se encontraron activos
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              No existen registros que coincidan con los filtros seleccionados.
            </p>

            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-4 text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          /* TABLA */

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Código
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Activo
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Categoría
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ubicación
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stock
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const stock = Number(item.cantidad_total ?? 0);

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* CODIGO */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                          {item.codigo || "—"}
                        </span>
                      </td>

                      {/* ACTIVO */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Boxes size={17} />
                          </div>

                          <div>
                            <p className="font-medium text-slate-900">
                              {item.nombre || "Sin nombre"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Activo de inventario
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORIA */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {item.categoria || "Sin categoría"}
                        </span>
                      </td>

                      {/* UBICACION */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <span>{item.ubicacion || "Sin ubicación"}</span>
                        </div>
                      </td>

                      {/* STOCK */}

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span
                          className={`inline-flex min-w-[55px] justify-center rounded-lg px-3 py-1.5 text-sm font-bold ${
                            stock > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {stock}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}

        {!loading && filtered.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3">
            <p className="text-xs text-slate-500">
              La información mostrada corresponde al inventario registrado
              actualmente en ConstructSys.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// =========================================================
// KPI CARD
// =========================================================

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
}

function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
    </article>
  );
}

export default InventarioReportePage;
