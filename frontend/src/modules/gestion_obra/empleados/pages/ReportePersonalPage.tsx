import { useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  FileDown,
  Search,
  Filter,
  CalendarDays,
  Building2,
  TrendingUp,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";

interface ReportePersonal {
  id: string;
  empleado: string;
  cedula: string;
  cargo: string;
  tipo_pago: "diario" | "semanal" | "mensual";
  obra?: string;
  estado: "Activo" | "Inactivo";
  fecha_ingreso: string;
  dias_trabajados: number;
  horas_trabajadas: number;
  total_pagado: number;
  pagos_pendientes: number;
  observacion: string;
}

function ReportePersonalPage() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTipoPago, setFiltroTipoPago] = useState("Todos");

  const reportes: ReportePersonal[] = [
    {
      id: "EMP-001",
      empleado: "Juan Guaraca",
      cedula: "0601234567",
      cargo: "Maestro de obra",
      tipo_pago: "semanal",
      obra: "Construcción Bodega Norte",
      estado: "Activo",
      fecha_ingreso: "2026-01-10",
      dias_trabajados: 22,
      horas_trabajadas: 176,
      total_pagado: 720,
      pagos_pendientes: 0,
      observacion: "Empleado asignado actualmente a obra.",
    },
    {
      id: "EMP-002",
      empleado: "Carlos Daquilema",
      cedula: "0607654321",
      cargo: "Operario",
      tipo_pago: "diario",
      obra: "Ampliación Local Comercial",
      estado: "Activo",
      fecha_ingreso: "2026-03-05",
      dias_trabajados: 18,
      horas_trabajadas: 144,
      total_pagado: 630,
      pagos_pendientes: 70,
      observacion: "Tiene una jornada pendiente de pago.",
    },
    {
      id: "EMP-003",
      empleado: "María Guamán",
      cedula: "0609988776",
      cargo: "Administrativa",
      tipo_pago: "mensual",
      estado: "Activo",
      fecha_ingreso: "2025-11-01",
      dias_trabajados: 30,
      horas_trabajadas: 160,
      total_pagado: 650,
      pagos_pendientes: 0,
      observacion: "Personal administrativo.",
    },
    {
      id: "EMP-004",
      empleado: "Pedro Lema",
      cedula: "0603344556",
      cargo: "Ayudante",
      tipo_pago: "diario",
      estado: "Inactivo",
      fecha_ingreso: "2026-02-18",
      dias_trabajados: 10,
      horas_trabajadas: 80,
      total_pagado: 280,
      pagos_pendientes: 0,
      observacion: "Empleado desactivado.",
    },
  ];

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((item) => {
      const matchSearch =
        item.empleado.toLowerCase().includes(search.toLowerCase()) ||
        item.cedula.toLowerCase().includes(search.toLowerCase()) ||
        item.cargo.toLowerCase().includes(search.toLowerCase()) ||
        item.obra?.toLowerCase().includes(search.toLowerCase());

      const matchEstado =
        filtroEstado === "Todos" || item.estado === filtroEstado;

      const matchTipoPago =
        filtroTipoPago === "Todos" || item.tipo_pago === filtroTipoPago;

      return matchSearch && matchEstado && matchTipoPago;
    });
  }, [search, filtroEstado, filtroTipoPago]);

  const resumen = useMemo(() => {
    const activos = reportesFiltrados.filter(
      (r) => r.estado === "Activo",
    ).length;
    const inactivos = reportesFiltrados.filter(
      (r) => r.estado === "Inactivo",
    ).length;

    const totalPagado = reportesFiltrados.reduce(
      (acc, r) => acc + r.total_pagado,
      0,
    );

    const totalPendiente = reportesFiltrados.reduce(
      (acc, r) => acc + r.pagos_pendientes,
      0,
    );

    const horasTotales = reportesFiltrados.reduce(
      (acc, r) => acc + r.horas_trabajadas,
      0,
    );

    return {
      totalPersonal: reportesFiltrados.length,
      activos,
      inactivos,
      totalPagado,
      totalPendiente,
      horasTotales,
    };
  }, [reportesFiltrados]);

  const getEstadoClass = (estado: ReportePersonal["estado"]) => {
    if (estado === "Activo") return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Reporte de Personal
          </h1>

          <p className="text-gray-500 mt-1">
            Análisis de empleados, asignaciones a obras, horas trabajadas, pagos
            realizados y pendientes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition">
            <TrendingUp size={18} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Personal total</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.totalPersonal}
              </h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Activos</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.activos}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <UserCheck className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pagado al personal</p>
              <h2 className="text-3xl font-bold mt-2">
                ${resumen.totalPagado.toLocaleString()}
              </h2>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pendiente por pagar</p>
              <h2 className="text-3xl font-bold mt-2 text-red-600">
                ${resumen.totalPendiente.toLocaleString()}
              </h2>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empleado, cédula, cargo u obra..."
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option>Todos</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>

          <select
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={filtroTipoPago}
            onChange={(e) => setFiltroTipoPago(e.target.value)}
          >
            <option>Todos</option>
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Detalle de personal
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Consolidado entre empleados, asignaciones de obra, controles diarios
            y pagos.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Empleado
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Obra actual
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Tipo pago
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Horas
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Pagado
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Pendiente
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {reportesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No hay información de personal
                  </td>
                </tr>
              )}

              {reportesFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{item.empleado}</p>
                    <p className="text-xs text-gray-500">
                      {item.cedula} · {item.cargo}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <CalendarDays size={13} />
                      Ingreso: {item.fecha_ingreso}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400" />
                      <span className="text-sm">
                        {item.obra || "No asignado"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.observacion}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 capitalize">
                      {item.tipo_pago}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={15} className="text-gray-400" />
                      <span className="font-semibold">
                        {item.horas_trabajadas}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.dias_trabajados} días
                    </p>
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-green-600">
                    ${item.total_pagado.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    ${item.pagos_pendientes.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoClass(
                        item.estado,
                      )}`}
                    >
                      {item.estado}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <button
                        className="text-cyan-600 hover:scale-110 transition"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL INFERIOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Resumen de horas por tipo de pago
          </h2>

          <div className="space-y-4">
            {["diario", "semanal", "mensual"].map((tipo) => {
              const horas = reportesFiltrados
                .filter((r) => r.tipo_pago === tipo)
                .reduce((acc, r) => acc + r.horas_trabajadas, 0);

              const porcentaje =
                resumen.horasTotales > 0
                  ? (horas / resumen.horasTotales) * 100
                  : 0;

              return (
                <div key={tipo}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-700 capitalize">
                      {tipo}
                    </span>
                    <span className="font-semibold">{horas} h</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-[var(--color-primary)] h-3 rounded-full"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Alertas de personal
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="font-semibold text-red-800">
                Pagos pendientes detectados
              </p>
              <p className="text-sm text-red-700">
                Revisa empleados con valores pendientes antes del cierre de
                caja.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-800">Relación con obras</p>
              <p className="text-sm text-blue-700">
                El reporte debe cruzar empleados_obras, controles_diarios,
                control_operarios y pagos_empleados.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="font-semibold text-green-800">Control financiero</p>
              <p className="text-sm text-green-700">
                Los pagos confirmados deben registrarse como egresos automáticos
                en transacciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportePersonalPage;
