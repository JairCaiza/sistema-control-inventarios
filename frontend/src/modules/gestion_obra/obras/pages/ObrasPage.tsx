import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Swal from "sweetalert2";

import type { Obra } from "../services/obrasService";
import { getObras, deleteObra } from "../services/obrasService";

import CreateObraModal from "../components/modals/CreateObraModal";
import EditObraModal from "../components/modals/EditObraModal";

import {
  Plus,
  Search,
  FileDown,
  RefreshCw,
  Building2,
  MapPin,
  CalendarDays,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  ClipboardList,
  PauseCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);

  const loadObras = async () => {
    try {
      setLoading(true);
      const data = await getObras();
      setObras(data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudieron cargar las obras", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObras();
  }, []);

  const filtered = useMemo(() => {
    return obras.filter((obra) => {
      const matchSearch =
        obra.codigo?.toLowerCase().includes(search.toLowerCase()) ||
        obra.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        obra.ubicacion?.toLowerCase().includes(search.toLowerCase()) ||
        obra.estado?.toLowerCase().includes(search.toLowerCase());

      const matchEstado =
        estadoFiltro === "todos" || obra.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [obras, search, estadoFiltro]);

  const resumen = useMemo(() => {
    const total = obras.length;
    const planificadas = obras.filter((o) => o.estado === "planificada").length;
    const enProceso = obras.filter((o) => o.estado === "en_proceso").length;
    const pausadas = obras.filter((o) => o.estado === "pausada").length;
    const finalizadas = obras.filter((o) => o.estado === "finalizada").length;

    const presupuestoTotal = obras.reduce(
      (acc, o) => acc + Number(o.presupuesto || 0),
      0,
    );

    return {
      total,
      planificadas,
      enProceso,
      pausadas,
      finalizadas,
      presupuestoTotal,
    };
  }, [obras]);

  const getEstadoClass = (estado?: string) => {
    if (estado === "planificada") return "bg-gray-100 text-gray-700";
    if (estado === "en_proceso") return "bg-blue-100 text-blue-700";
    if (estado === "pausada") return "bg-yellow-100 text-yellow-700";
    if (estado === "finalizada") return "bg-green-100 text-green-700";
    if (estado === "cancelada") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getEstadoIcon = (estado?: string) => {
    if (estado === "planificada") return <Clock size={15} />;
    if (estado === "en_proceso") return <Building2 size={15} />;
    if (estado === "pausada") return <PauseCircle size={15} />;
    if (estado === "finalizada") return <CheckCircle size={15} />;
    if (estado === "cancelada") return <XCircle size={15} />;
    return <ClipboardList size={15} />;
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "No registrada";
    return date.split("T")[0];
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar obra?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteObra(id);
        setObras((prev) => prev.filter((o) => o.id !== id));

        Swal.fire({
          icon: "success",
          title: "Obra eliminada",
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (error: any) {
        Swal.fire(
          "Error",
          error.response?.data?.message || "No se pudo eliminar",
          "error",
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Obras</h1>
          <p className="text-gray-500 mt-1">
            Administración de obras, presupuesto, estado, personal asignado y
            control diario.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            onClick={loadObras}
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
            Nueva Obra
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Obras registradas</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.total}</h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Building2 className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">En proceso</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.enProceso}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ClipboardList className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Planificadas</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.planificadas}
              </h2>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <Clock className="text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pausadas</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.pausadas}</h2>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <PauseCircle className="text-yellow-600" />
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
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="text-purple-600" />
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
              placeholder="Buscar por código, nombre, ubicación o estado..."
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
            <option value="planificada">Planificada</option>
            <option value="en_proceso">En proceso</option>
            <option value="pausada">Pausada</option>
            <option value="finalizada">Finalizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Listado de obras
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Desde el detalle puedes gestionar empleados, actividades diarias,
            pagos, gastos y reportes.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Cargando obras...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Obra
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Ubicación
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Fechas
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Presupuesto
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No hay obras registradas
                    </td>
                  </tr>
                )}

                {filtered.map((obra) => (
                  <tr
                    key={obra.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">
                        {obra.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        Código: {obra.codigo || "---"}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-gray-400 mt-0.5" />
                        <span className="text-sm">
                          {obra.ubicacion || "No registrada"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <CalendarDays size={15} className="text-gray-400" />
                        {formatDate(obra.fecha_inicio)}
                      </div>
                      <p className="text-xs text-gray-500">
                        hasta {formatDate(obra.fecha_fin)}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      ${Number(obra.presupuesto || 0).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getEstadoClass(
                          obra.estado,
                        )}`}
                      >
                        {getEstadoIcon(obra.estado)}
                        {obra.estado?.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          to={`/dashboard/obras/${obra.id}`}
                          className="text-cyan-600 hover:scale-110 transition"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </Link>

                        <button
                          className="text-blue-600 hover:scale-110 transition"
                          title="Editar"
                          onClick={() => {
                            setSelectedObra(obra);
                            setEditOpen(true);
                          }}
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(obra.id)}
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
        )}
      </div>

      {/* PANEL INFERIOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Flujo operativo de obra
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-800">Control diario</p>
              <p className="text-sm text-blue-700">
                Cada obra puede registrar actividades diarias, avance, clima y
                observaciones.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="font-semibold text-purple-800">Personal asignado</p>
              <p className="text-sm text-purple-700">
                Los empleados se asignan a una obra para controlar pagos y
                rendimiento.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="font-semibold text-red-800">Gastos de obra</p>
              <p className="text-sm text-red-700">
                Los gastos vinculados a obra deben generar egresos automáticos
                en finanzas.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Reglas ERP
          </h2>

          <p className="text-sm text-gray-600 leading-6">
            La obra funciona como centro de costo. Los pagos de empleados,
            gastos diarios y actividades deben quedar vinculados a su obra para
            calcular avance, costos, utilidad estimada y reportes consolidados.
          </p>
        </div>
      </div>

      <CreateObraModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadObras}
      />

      <EditObraModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadObras}
        obra={selectedObra}
      />
    </div>
  );
}

export default ObrasPage;
