import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  FileDown,
  DollarSign,
  Building2,
  CalendarDays,
  ClipboardList,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface GastoObra {
  id: string;
  fecha: string;
  obra: string;
  control_diario?: string;
  tipo: string;
  descripcion: string;
  monto: number;
  cuenta: string;
  responsable: string;
  estado: "Registrado" | "Pendiente" | "Anulado";
}

function GastosObraPage() {
  const [search, setSearch] = useState("");
  const [filtroObra, setFiltroObra] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const gastos: GastoObra[] = [
    {
      id: "GOB-001",
      fecha: "2026-06-22",
      obra: "Construcción Bodega Norte",
      control_diario: "Fundición de columnas",
      tipo: "Materiales",
      descripcion: "Compra de cemento, arena y varilla",
      monto: 420,
      cuenta: "Caja General",
      responsable: "Administrador",
      estado: "Registrado",
    },
    {
      id: "GOB-002",
      fecha: "2026-06-21",
      obra: "Ampliación Local Comercial",
      control_diario: "Encofrado de losa",
      tipo: "Mano de obra",
      descripcion: "Pago diario a cuadrilla de encofrado",
      monto: 260,
      cuenta: "Banco Pichincha",
      responsable: "Supervisor",
      estado: "Registrado",
    },
    {
      id: "GOB-003",
      fecha: "2026-06-20",
      obra: "Mantenimiento Galpón",
      control_diario: "Reparación estructura",
      tipo: "Transporte",
      descripcion: "Movilización de personal y herramientas",
      monto: 90,
      cuenta: "Caja Chica",
      responsable: "Administrador",
      estado: "Pendiente",
    },
  ];

  const obras = ["Todas", ...Array.from(new Set(gastos.map((g) => g.obra)))];
  const tipos = ["Todos", ...Array.from(new Set(gastos.map((g) => g.tipo)))];

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((gasto) => {
      const matchSearch =
        gasto.obra.toLowerCase().includes(search.toLowerCase()) ||
        gasto.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        gasto.tipo.toLowerCase().includes(search.toLowerCase());

      const matchObra = filtroObra === "Todas" || gasto.obra === filtroObra;
      const matchTipo = filtroTipo === "Todos" || gasto.tipo === filtroTipo;

      return matchSearch && matchObra && matchTipo;
    });
  }, [search, filtroObra, filtroTipo]);

  const resumen = useMemo(() => {
    const totalGastos = gastosFiltrados.reduce((acc, g) => acc + g.monto, 0);
    const registrados = gastosFiltrados.filter(
      (g) => g.estado === "Registrado",
    ).length;
    const pendientes = gastosFiltrados.filter(
      (g) => g.estado === "Pendiente",
    ).length;
    const obrasAfectadas = new Set(gastosFiltrados.map((g) => g.obra)).size;

    return {
      totalGastos,
      registrados,
      pendientes,
      obrasAfectadas,
    };
  }, [gastosFiltrados]);

  const getEstadoClass = (estado: GastoObra["estado"]) => {
    if (estado === "Registrado") return "bg-green-100 text-green-700";
    if (estado === "Pendiente") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gastos de Obra</h1>
          <p className="text-gray-500 mt-1">
            Control de gastos operativos vinculados a obras, controles diarios y
            flujo financiero.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition">
            <Plus size={18} />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total gastos</p>
              <h2 className="text-3xl font-bold mt-2">
                ${resumen.totalGastos.toLocaleString()}
              </h2>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <DollarSign className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Gastos registrados</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.registrados}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ClipboardList className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.pendientes}</h2>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <TrendingDown className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Obras afectadas</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.obrasAfectadas}
              </h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Building2 className="text-blue-600" />
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
              placeholder="Buscar por obra, tipo o descripción..."
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

          <select
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Registro de gastos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cada gasto debe generar automáticamente un egreso en transacciones
            financieras.
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
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Cuenta
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Monto
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
              {gastosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No hay gastos registrados
                  </td>
                </tr>
              )}

              {gastosFiltrados.map((gasto) => (
                <tr
                  key={gasto.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays size={16} className="text-gray-400" />
                      {gasto.fecha}
                    </div>
                    <p className="text-xs text-gray-500">{gasto.id}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{gasto.obra}</p>
                    <p className="text-xs text-gray-500">
                      Control: {gasto.control_diario || "No vinculado"}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                      {gasto.tipo}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">
                      {gasto.descripcion}
                    </p>
                    <p className="text-xs text-gray-500">
                      Responsable: {gasto.responsable}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-sm">{gasto.cuenta}</td>

                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    -${gasto.monto.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoClass(
                        gasto.estado,
                      )}`}
                    >
                      {gasto.estado}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-3">
                      <button
                        className="text-cyan-600 hover:scale-110 transition"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        className="text-blue-600 hover:scale-110 transition"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        className="text-red-600 hover:scale-110 transition"
                        title="Eliminar"
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
      </div>

      {/* PANEL INFERIOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Distribución por tipo de gasto
          </h2>

          <div className="space-y-4">
            {tipos
              .filter((tipo) => tipo !== "Todos")
              .map((tipo) => {
                const total = gastosFiltrados
                  .filter((g) => g.tipo === tipo)
                  .reduce((acc, g) => acc + g.monto, 0);

                const porcentaje =
                  resumen.totalGastos > 0
                    ? (total / resumen.totalGastos) * 100
                    : 0;

                return (
                  <div key={tipo}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">{tipo}</span>
                      <span className="font-semibold">
                        ${total.toLocaleString()}
                      </span>
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
            Reglas financieras
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="font-semibold text-red-800">
                Todo gasto de obra genera egreso
              </p>
              <p className="text-sm text-red-700">
                Al guardar un gasto, el backend debe crear automáticamente una
                transacción tipo egreso.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-800">
                Vinculación con control diario
              </p>
              <p className="text-sm text-blue-700">
                El gasto puede asociarse a un control diario para reportar
                costos por actividad.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="font-semibold text-green-800">Trazabilidad ERP</p>
              <p className="text-sm text-green-700">
                Usa origen_modulo = gastos_obra y origen_id = id del gasto en
                transacciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GastosObraPage;
