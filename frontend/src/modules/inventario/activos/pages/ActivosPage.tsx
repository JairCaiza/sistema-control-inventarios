import { useEffect, useMemo, useState } from "react";

import { type Activo, getActivos } from "../../activos/service/activoService";

import CreateActivoModal from "../components/CreateActivoModal";
import UpdateEstadoActivoModal from "../components/UpdateEstadoActivoModal";
import ActivoDetalleModal from "../components/ActivoDetalleModal";

import {
  Plus,
  Search,
  FileDown,
  RefreshCw,
  Package,
  MapPin,
  Tag,
  Boxes,
  Eye,
  Settings,
  CheckCircle,
  AlertTriangle,
  Wrench,
  XCircle,
} from "lucide-react";

function ActivosPage() {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [historialModalOpen, setHistorialModalOpen] = useState(false);

  const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);
  const [activoHistorialId, setActivoHistorialId] = useState<string | null>(
    null,
  );

  const loadActivos = async () => {
    try {
      setLoading(true);
      const data = await getActivos();
      setActivos(data);
    } catch (error) {
      console.error("Error cargando activos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivos();
  }, []);

  const openEstadoModal = (activo: Activo) => {
    setSelectedActivo(activo);
    setEstadoModalOpen(true);
  };

  const openHistorialModal = (activoId: string) => {
    setActivoHistorialId(activoId);
    setHistorialModalOpen(true);
  };

  const filtered = useMemo(() => {
    return activos.filter((a) => {
      const matchSearch =
        a.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        a.codigo?.toLowerCase().includes(search.toLowerCase()) ||
        a.categoria?.toLowerCase().includes(search.toLowerCase()) ||
        a.ubicacion?.toLowerCase().includes(search.toLowerCase()) ||
        a.estado?.toLowerCase().includes(search.toLowerCase());

      const matchEstado = estadoFiltro === "todos" || a.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [activos, search, estadoFiltro]);

  const resumen = useMemo(() => {
    const total = activos.length;

    const disponibles = activos.filter((a) => a.estado === "disponible").length;

    const alquilados = activos.filter((a) => a.estado === "alquilado").length;

    const mantenimiento = activos.filter(
      (a) => a.estado === "mantenimiento",
    ).length;

    const cantidadTotal = activos.reduce(
      (acc, a) => acc + Number(a.cantidad_total || 0),
      0,
    );

    return {
      total,
      disponibles,
      alquilados,
      mantenimiento,
      cantidadTotal,
    };
  }, [activos]);

  const getEstadoClass = (estado: string) => {
    if (estado === "disponible") return "bg-green-100 text-green-700";
    if (estado === "alquilado") return "bg-blue-100 text-blue-700";
    if (estado === "mantenimiento") return "bg-yellow-100 text-yellow-700";
    if (estado === "danado") return "bg-orange-100 text-orange-700";
    if (estado === "perdido") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getEstadoIcon = (estado: string) => {
    if (estado === "disponible") return <CheckCircle size={15} />;
    if (estado === "alquilado") return <Package size={15} />;
    if (estado === "mantenimiento") return <Wrench size={15} />;
    if (estado === "danado") return <AlertTriangle size={15} />;
    if (estado === "perdido") return <XCircle size={15} />;
    return <Package size={15} />;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Activos</h1>
          <p className="text-gray-500 mt-1">
            Administración de equipos, herramientas y encofrados disponibles
            para alquiler.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            onClick={loadActivos}
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
            Nuevo Activo
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Activos registrados</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.total}</h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Boxes className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Disponibles</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.disponibles}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Alquilados</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.alquilados}</h2>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Package className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Mantenimiento</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.mantenimiento}
              </h2>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Wrench className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Stock total</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.cantidadTotal}
              </h2>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Tag className="text-orange-600" />
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
              placeholder="Buscar por código, nombre, categoría, ubicación o estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="todos">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="alquilado">Alquilado</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="danado">Dañado</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Catálogo de activos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Control de stock, ubicación, estado operativo e historial de
            movimientos.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Cargando activos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-gray-600 text-sm">
                  <th className="px-4 py-3 text-left font-semibold">Activo</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Ubicación
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No existen activos
                    </td>
                  </tr>
                )}

                {filtered.map((activo) => (
                  <tr
                    key={activo.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">
                        {activo.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        Código: {activo.codigo}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-gray-400" />
                        <span>{activo.categoria}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{activo.ubicacion}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-800">
                        {activo.cantidad_total}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium capitalize ${getEstadoClass(
                          activo.estado,
                        )}`}
                      >
                        {getEstadoIcon(activo.estado)}
                        {activo.estado}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => openHistorialModal(activo.id)}
                          className="text-cyan-600 hover:scale-110 transition"
                          title="Ver historial"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => openEstadoModal(activo)}
                          className="text-blue-600 hover:scale-110 transition"
                          title="Cambiar estado"
                        >
                          <Settings size={18} />
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

      {/* PANEL INFERIOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Reglas de activos
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="font-semibold text-green-800">Disponible</p>
              <p className="text-sm text-green-700">
                Puede ser utilizado en contratos de alquiler o asignado a una
                obra.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-800">Alquilado</p>
              <p className="text-sm text-blue-700">
                Se encuentra asociado a un contrato activo y no debe contarse
                como disponible.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="font-semibold text-yellow-800">Mantenimiento</p>
              <p className="text-sm text-yellow-700">
                No debe utilizarse hasta que sea revisado y habilitado
                nuevamente.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Control operativo
          </h2>

          <p className="text-sm text-gray-600 leading-6">
            Los activos se descuentan automáticamente cuando se agregan a un
            contrato de alquiler y vuelven al stock cuando se registra la
            devolución. El historial permite revisar cada entrada, salida o
            ajuste realizado sobre el activo.
          </p>
        </div>
      </div>

      <CreateActivoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadActivos}
      />

      <UpdateEstadoActivoModal
        open={estadoModalOpen}
        activo={selectedActivo}
        onClose={() => setEstadoModalOpen(false)}
        onUpdated={loadActivos}
      />

      <ActivoDetalleModal
        open={historialModalOpen}
        activoId={activoHistorialId}
        onClose={() => setHistorialModalOpen(false)}
      />
    </div>
  );
}

export default ActivosPage;
