import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  FileDown,
  Package,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  CalendarDays,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

import { getMovimientos, type Movimiento } from "../services/movimientoService";
import CreateMovimientoModal from "../components/CreateMovimientoModal";

function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [loading, setLoading] = useState(false);

  const loadMovimientos = async () => {
    try {
      setLoading(true);
      const data = await getMovimientos();
      setMovimientos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovimientos();
  }, []);

  const filtered = useMemo(() => {
    return movimientos.filter((m) => {
      const matchSearch =
        m.activo?.toLowerCase().includes(search.toLowerCase()) ||
        m.motivo?.toLowerCase().includes(search.toLowerCase()) ||
        m.referencia?.toLowerCase().includes(search.toLowerCase()) ||
        m.tipo_movimiento?.toLowerCase().includes(search.toLowerCase());

      const matchTipo =
        tipoFiltro === "todos" || m.tipo_movimiento === tipoFiltro;

      return matchSearch && matchTipo;
    });
  }, [movimientos, search, tipoFiltro]);

  const resumen = useMemo(() => {
    const entradas = filtered.filter((m) => m.tipo_movimiento === "entrada");
    const salidas = filtered.filter((m) => m.tipo_movimiento === "salida");
    const ajustes = filtered.filter((m) => m.tipo_movimiento === "ajuste");

    return {
      total: filtered.length,
      entradas: entradas.length,
      salidas: salidas.length,
      ajustes: ajustes.length,
      cantidadMovida: filtered.reduce(
        (acc, m) => acc + Number(m.cantidad || 0),
        0,
      ),
    };
  }, [filtered]);

  const getTipoClass = (tipo: string) => {
    if (tipo === "entrada") return "bg-green-100 text-green-700";
    if (tipo === "salida") return "bg-red-100 text-red-700";
    if (tipo === "ajuste") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === "entrada") return <TrendingUp size={15} />;
    if (tipo === "salida") return <TrendingDown size={15} />;
    return <SlidersHorizontal size={15} />;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Movimientos de Inventario
          </h1>
          <p className="text-gray-500 mt-1">
            Control de entradas, salidas y ajustes de equipos, herramientas y
            encofrados.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            onClick={loadMovimientos}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition"
          >
            <Plus size={18} />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Movimientos</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.total}</h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ClipboardList className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Entradas</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.entradas}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Salidas</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.salidas}</h2>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Cantidad movida</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.cantidadMovida}
              </h2>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Package className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-3">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              placeholder="Buscar por activo, motivo, referencia o tipo..."
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="todos">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Historial de movimientos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Las salidas pueden generarse por contratos de alquiler y las
            entradas por devoluciones.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Cargando movimientos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Activo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Motivo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Referencia
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No hay movimientos registrados
                    </td>
                  </tr>
                )}

                {filtered.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays size={16} className="text-gray-400" />
                        {new Date(m.fecha_creacion).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{m.activo}</p>
                      <p className="text-xs text-gray-500">
                        Movimiento #{m.id.slice(0, 8)}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium capitalize ${getTipoClass(
                          m.tipo_movimiento,
                        )}`}
                      >
                        {getTipoIcon(m.tipo_movimiento)}
                        {m.tipo_movimiento}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-semibold">
                      {m.cantidad}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {m.motivo || "Sin motivo"}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">
                      {m.referencia || "Sin referencia"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PANEL INFERIOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Reglas de inventario
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="font-semibold text-green-800">Entrada</p>
              <p className="text-sm text-green-700">
                Aumenta el stock. Se usa para compras, devoluciones o ajustes
                positivos.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="font-semibold text-red-800">Salida</p>
              <p className="text-sm text-red-700">
                Disminuye el stock. Se genera al alquilar equipos o retirar
                materiales.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="font-semibold text-yellow-800">Ajuste</p>
              <p className="text-sm text-yellow-700">
                Corrige diferencias físicas detectadas en inventario.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Trazabilidad operativa
          </h2>

          <p className="text-sm text-gray-600 leading-6">
            Este módulo debe mostrar todos los cambios de stock. Los movimientos
            automáticos vienen desde contratos y devoluciones; los movimientos
            manuales se usan solo para ajustes, compras iniciales o correcciones
            autorizadas.
          </p>
        </div>
      </div>

      <CreateMovimientoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadMovimientos}
      />
    </div>
  );
}

export default MovimientosPage;
