import { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  CloudSun,
  Users,
  DollarSign,
  FileDown,
  Search,
  Eye,
  Plus,
  BarChart3,
} from "lucide-react";

interface ControlDiario {
  id: string;
  fecha: string;
  obra: string;
  actividad: string;
  descripcion: string;
  hora_inicio: string;
  hora_fin: string;
  avance: number;
  clima: string;
  operarios: number;
  horas_totales: number;
  gasto_total: number;
  estado: "Registrado" | "Revisado" | "Pendiente";
}

function ControlDiarioPage() {
  const [search, setSearch] = useState("");
  const [filtroObra, setFiltroObra] = useState("Todas");

  const controles: ControlDiario[] = [
    {
      id: "1",
      fecha: "2026-06-22",
      obra: "Construcción Bodega Norte",
      actividad: "Fundición de columnas",
      descripcion: "Se realizó fundición de columnas principales del bloque A.",
      hora_inicio: "08:00",
      hora_fin: "16:30",
      avance: 65,
      clima: "Soleado",
      operarios: 8,
      horas_totales: 68,
      gasto_total: 420,
      estado: "Registrado",
    },
    {
      id: "2",
      fecha: "2026-06-21",
      obra: "Ampliación Local Comercial",
      actividad: "Encofrado de losa",
      descripcion: "Armado y revisión de encofrado para losa superior.",
      hora_inicio: "07:30",
      hora_fin: "15:00",
      avance: 42,
      clima: "Nublado",
      operarios: 5,
      horas_totales: 37.5,
      gasto_total: 260,
      estado: "Revisado",
    },
    {
      id: "3",
      fecha: "2026-06-20",
      obra: "Mantenimiento Galpón",
      actividad: "Limpieza y reparación",
      descripcion: "Mantenimiento preventivo de estructura metálica.",
      hora_inicio: "09:00",
      hora_fin: "13:00",
      avance: 25,
      clima: "Lluvia ligera",
      operarios: 3,
      horas_totales: 12,
      gasto_total: 90,
      estado: "Pendiente",
    },
  ];

  const obras = ["Todas", ...Array.from(new Set(controles.map((c) => c.obra)))];

  const controlesFiltrados = useMemo(() => {
    return controles.filter((control) => {
      const matchSearch =
        control.obra.toLowerCase().includes(search.toLowerCase()) ||
        control.actividad.toLowerCase().includes(search.toLowerCase()) ||
        control.descripcion.toLowerCase().includes(search.toLowerCase());

      const matchObra = filtroObra === "Todas" || control.obra === filtroObra;

      return matchSearch && matchObra;
    });
  }, [search, filtroObra]);

  const resumen = useMemo(() => {
    const totalControles = controlesFiltrados.length;

    const avancePromedio =
      totalControles > 0
        ? controlesFiltrados.reduce((acc, c) => acc + c.avance, 0) /
          totalControles
        : 0;

    const totalOperarios = controlesFiltrados.reduce(
      (acc, c) => acc + c.operarios,
      0,
    );

    const gastoTotal = controlesFiltrados.reduce(
      (acc, c) => acc + c.gasto_total,
      0,
    );

    return {
      totalControles,
      avancePromedio,
      totalOperarios,
      gastoTotal,
    };
  }, [controlesFiltrados]);

  const getEstadoClass = (estado: ControlDiario["estado"]) => {
    if (estado === "Registrado") return "bg-blue-100 text-blue-700";
    if (estado === "Revisado") return "bg-green-100 text-green-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Control Diario</h1>
          <p className="text-gray-500 mt-1">
            Seguimiento diario de actividades, avances, operarios y gastos por
            obra.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition">
            <Plus size={18} />
            Nuevo Control
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Controles registrados</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.totalControles}
              </h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ClipboardList className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Avance promedio</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.avancePromedio.toFixed(1)}%
              </h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Operarios registrados</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.totalOperarios}
              </h2>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Gastos vinculados</p>
              <h2 className="text-3xl font-bold mt-2">
                ${resumen.gastoTotal.toLocaleString()}
              </h2>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <DollarSign className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="relative lg:col-span-2">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por obra, actividad o descripción..."
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
          >
            {obras.map((obra) => (
              <option key={obra} value={obra}>
                {obra}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Registros diarios
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Información tomada desde controles diarios, operarios y gastos de
            obra.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Obra
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Actividad
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Horario
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Avance
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Operarios
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Gasto
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
              {controlesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No hay controles diarios registrados
                  </td>
                </tr>
              )}

              {controlesFiltrados.map((control) => (
                <tr
                  key={control.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays size={16} className="text-gray-400" />
                      {control.fecha}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{control.obra}</p>
                    <p className="text-xs text-gray-500">
                      Control #{control.id}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium">{control.actividad}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {control.descripcion}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <CloudSun size={14} />
                      {control.clima}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center text-sm">
                    {control.hora_inicio} - {control.hora_fin}
                    <p className="text-xs text-gray-500">
                      {control.horas_totales} h
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">
                        {control.avance}%
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-[var(--color-primary)] h-2 rounded-full"
                          style={{ width: `${control.avance}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold">{control.operarios}</span>
                  </td>

                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    ${control.gasto_total.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoClass(
                        control.estado,
                      )}`}
                    >
                      {control.estado}
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

      {/* RESUMEN INFERIOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Observaciones importantes
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="font-semibold text-yellow-800">
                Controles pendientes de revisión
              </p>
              <p className="text-sm text-yellow-700">
                Revisa los registros pendientes antes de generar reportes.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-800">
                Gastos vinculados a obra
              </p>
              <p className="text-sm text-blue-700">
                Los gastos diarios deben alimentar automáticamente el módulo
                financiero.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Acciones rápidas
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 rounded-xl border hover:border-[var(--color-primary)] hover:bg-gray-50 transition">
              <div className="text-2xl mb-2">📝</div>
              <p className="font-semibold">Nuevo control</p>
            </button>

            <button className="p-4 rounded-xl border hover:border-green-500 hover:bg-green-50 transition">
              <div className="text-2xl mb-2">👷</div>
              <p className="font-semibold">Operarios</p>
            </button>

            <button className="p-4 rounded-xl border hover:border-red-500 hover:bg-red-50 transition">
              <div className="text-2xl mb-2">💸</div>
              <p className="font-semibold">Gastos obra</p>
            </button>

            <button className="p-4 rounded-xl border hover:border-blue-500 hover:bg-blue-50 transition">
              <div className="text-2xl mb-2">📊</div>
              <p className="font-semibold">Reporte</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlDiarioPage;
