import { useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  DollarSign,
  FileDown,
  Filter,
  PieChart,
  TrendingDown,
  TrendingUp,
  Users,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

interface ReporteObra {
  id: string;
  codigo: string;
  obra: string;
  cliente: string;
  estado: "planificada" | "en_proceso" | "pausada" | "finalizada" | "cancelada";
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto: number;
  gasto_total: number;
  pagos_empleados: number;
  avance: number;
  controles: number;
  operarios: number;
}

function ReportesObraPage() {
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("Junio 2026");

  const reportes: ReporteObra[] = [
    {
      id: "1",
      codigo: "OBR-001",
      obra: "Construcción Bodega Norte",
      cliente: "Hnos Guaracas",
      estado: "en_proceso",
      fecha_inicio: "2026-06-01",
      fecha_fin: "2026-08-30",
      presupuesto: 35000,
      gasto_total: 12450,
      pagos_empleados: 4200,
      avance: 65,
      controles: 18,
      operarios: 8,
    },
    {
      id: "2",
      codigo: "OBR-002",
      obra: "Ampliación Local Comercial",
      cliente: "Comercial Andino",
      estado: "en_proceso",
      fecha_inicio: "2026-05-15",
      fecha_fin: "2026-07-20",
      presupuesto: 22000,
      gasto_total: 9800,
      pagos_empleados: 3100,
      avance: 48,
      controles: 12,
      operarios: 5,
    },
    {
      id: "3",
      codigo: "OBR-003",
      obra: "Mantenimiento Galpón",
      cliente: "Cliente interno",
      estado: "pausada",
      fecha_inicio: "2026-06-10",
      fecha_fin: "2026-07-05",
      presupuesto: 8500,
      gasto_total: 3900,
      pagos_empleados: 950,
      avance: 30,
      controles: 5,
      operarios: 3,
    },
  ];

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((r) => {
      return filtroEstado === "Todos" || r.estado === filtroEstado;
    });
  }, [filtroEstado]);

  const resumen = useMemo(() => {
    const presupuestoTotal = reportesFiltrados.reduce(
      (acc, r) => acc + r.presupuesto,
      0,
    );

    const gastoTotal = reportesFiltrados.reduce(
      (acc, r) => acc + r.gasto_total,
      0,
    );

    const pagosTotal = reportesFiltrados.reduce(
      (acc, r) => acc + r.pagos_empleados,
      0,
    );

    const avancePromedio =
      reportesFiltrados.length > 0
        ? reportesFiltrados.reduce((acc, r) => acc + r.avance, 0) /
          reportesFiltrados.length
        : 0;

    const utilidadEstimada = presupuestoTotal - gastoTotal - pagosTotal;

    return {
      obras: reportesFiltrados.length,
      presupuestoTotal,
      gastoTotal,
      pagosTotal,
      avancePromedio,
      utilidadEstimada,
    };
  }, [reportesFiltrados]);

  const getEstadoClass = (estado: ReporteObra["estado"]) => {
    if (estado === "en_proceso") return "bg-blue-100 text-blue-700";
    if (estado === "finalizada") return "bg-green-100 text-green-700";
    if (estado === "pausada") return "bg-yellow-100 text-yellow-700";
    if (estado === "cancelada") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getRentabilidadClass = (valor: number) => {
    if (valor >= 0) return "text-green-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Reportes de Obras
          </h1>
          <p className="text-gray-500 mt-1">
            Análisis consolidado de avance, presupuesto, gastos, nómina y
            rentabilidad por obra.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white shadow-sm text-sm"
          >
            <option>Junio 2026</option>
            <option>Mayo 2026</option>
            <option>Abril 2026</option>
            <option>Todo el año 2026</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition">
            <BarChart3 size={18} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter size={18} />
            Filtros
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white"
          >
            <option value="Todos">Todos los estados</option>
            <option value="planificada">Planificada</option>
            <option value="en_proceso">En proceso</option>
            <option value="pausada">Pausada</option>
            <option value="finalizada">Finalizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <span className="text-sm text-gray-500">
            Periodo seleccionado: {filtroPeriodo}
          </span>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Obras analizadas</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.obras}</h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Building2 className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Presupuesto total</p>
              <h2 className="text-3xl font-bold mt-2">
                ${resumen.presupuestoTotal.toLocaleString()}
              </h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Gastos de obra</p>
              <h2 className="text-3xl font-bold mt-2">
                ${resumen.gastoTotal.toLocaleString()}
              </h2>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Utilidad estimada</p>
              <h2
                className={`text-3xl font-bold mt-2 ${getRentabilidadClass(
                  resumen.utilidadEstimada,
                )}`}
              >
                ${resumen.utilidadEstimada.toLocaleString()}
              </h2>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* RESUMEN AVANCE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow border p-6 xl:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">
            Avance y consumo de presupuesto
          </h2>

          <div className="space-y-5">
            {reportesFiltrados.map((reporte) => {
              const consumo =
                reporte.presupuesto > 0
                  ? ((reporte.gasto_total + reporte.pagos_empleados) /
                      reporte.presupuesto) *
                    100
                  : 0;

              return (
                <div key={reporte.id} className="border rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {reporte.obra}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {reporte.codigo} · Cliente: {reporte.cliente}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getEstadoClass(
                        reporte.estado,
                      )}`}
                    >
                      {reporte.estado.replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Avance físico</span>
                        <span className="font-semibold">{reporte.avance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-[var(--color-primary)] h-3 rounded-full"
                          style={{ width: `${reporte.avance}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Consumo presupuesto</span>
                        <span className="font-semibold">
                          {consumo.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-red-500 h-3 rounded-full"
                          style={{ width: `${Math.min(consumo, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">
            Resumen operativo
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <ClipboardList className="text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700">Controles diarios</p>
                  <h3 className="text-2xl font-bold text-blue-800">
                    {reportesFiltrados.reduce((acc, r) => acc + r.controles, 0)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-3">
                <Users className="text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700">Operarios activos</p>
                  <h3 className="text-2xl font-bold text-purple-800">
                    {reportesFiltrados.reduce((acc, r) => acc + r.operarios, 0)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <PieChart className="text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Avance promedio</p>
                  <h3 className="text-2xl font-bold text-green-800">
                    {resumen.avancePromedio.toFixed(1)}%
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-700">Alertas</p>
                  <h3 className="text-lg font-bold text-yellow-800">
                    2 obras requieren revisión
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DETALLADA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Reporte detallado por obra
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Comparación entre presupuesto, gastos, pagos de personal y avance
            real.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Obra
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Fechas
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Presupuesto
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Gastos
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Nómina
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Avance
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Rentabilidad
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>
              {reportesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No hay información para el filtro seleccionado
                  </td>
                </tr>
              )}

              {reportesFiltrados.map((reporte) => {
                const rentabilidad =
                  reporte.presupuesto -
                  reporte.gasto_total -
                  reporte.pagos_empleados;

                return (
                  <tr
                    key={reporte.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {reporte.obra}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reporte.codigo} · {reporte.cliente}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <CalendarDays size={15} className="text-gray-400" />
                        {reporte.fecha_inicio}
                      </div>
                      <p className="text-xs text-gray-500">
                        hasta {reporte.fecha_fin}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-right font-semibold">
                      ${reporte.presupuesto.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right text-red-600 font-semibold">
                      ${reporte.gasto_total.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                      ${reporte.pagos_empleados.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold">{reporte.avance}%</span>
                    </td>

                    <td
                      className={`px-4 py-3 text-right font-bold ${getRentabilidadClass(
                        rentabilidad,
                      )}`}
                    >
                      ${rentabilidad.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoClass(
                          reporte.estado,
                        )}`}
                      >
                        {reporte.estado.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALERTAS */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Alertas del reporte
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="font-semibold text-red-800">
              Consumo alto de presupuesto
            </p>
            <p className="text-sm text-red-700">
              Revisa obras donde el consumo financiero supera el avance físico.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="font-semibold text-yellow-800">Obras pausadas</p>
            <p className="text-sm text-yellow-700">
              Las obras pausadas pueden generar costos indirectos no previstos.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="font-semibold text-blue-800">
              Trazabilidad financiera
            </p>
            <p className="text-sm text-blue-700">
              Los gastos y pagos deben estar vinculados a obra para calcular
              rentabilidad real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportesObraPage;
