// pages/DevolucionesPage.tsx
import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  RefreshCw,
  FileDown,
  Search,
  RotateCcw,
  ClipboardCheck,
  DollarSign,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";

import { getDevoluciones } from "../services/devolucionService";

import DevolucionesTable from "../components/DevolucionesTable";
import RegistrarDevolucionModal from "../components/RegistrarDevolucionModal";

import type { Devolucion } from "../../../types/devolucion.types";

function DevolucionesPage() {
  const [data, setData] = useState<Devolucion[]>([]);
  const [filteredData, setFilteredData] = useState<Devolucion[]>([]);

  const [openModal, setOpenModal] = useState(false);
  const [contratoId, setContratoId] = useState<string>("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getDevoluciones();
      setData(res);
      setFilteredData(res);
    } catch (error) {
      console.error("Error cargando devoluciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const text = search.toLowerCase();

    const result = data.filter((item: any) => {
      return (
        item.numero_contrato?.toLowerCase().includes(text) ||
        item.cliente?.toLowerCase().includes(text) ||
        item.contrato_id?.toLowerCase().includes(text)
      );
    });

    setFilteredData(result);
  }, [search, data]);

  const handleOpenModal = (id: string) => {
    setContratoId(id);
    setOpenModal(true);
  };

  const handleNuevaDevolucion = () => {
    if (data.length === 0) return;

    setContratoId(data[0].contrato_id);
    setOpenModal(true);
  };

  const resumen = useMemo(() => {
    const total = filteredData.length;

    const conRetraso = filteredData.filter(
      (d: any) => Number(d.dias_retraso || 0) > 0,
    ).length;

    const sinRetraso = filteredData.filter(
      (d: any) => Number(d.dias_retraso || 0) === 0,
    ).length;

    const penalidades = filteredData.reduce(
      (acc: number, d: any) => acc + Number(d.penalidad_total || 0),
      0,
    );

    return {
      total,
      conRetraso,
      sinRetraso,
      penalidades,
    };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Devoluciones</h1>
          <p className="text-gray-500 mt-1">
            Control de retorno de activos alquilados, penalidades y cierre de
            contratos.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>

          <button
            onClick={handleNuevaDevolucion}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition"
          >
            <Plus size={18} />
            Registrar devolución
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Devoluciones</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.total}</h2>
            </div>

            <div className="bg-blue-100 p-3 rounded-full">
              <RotateCcw className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Sin retraso</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.sinRetraso}</h2>
            </div>

            <div className="bg-green-100 p-3 rounded-full">
              <ClipboardCheck className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Con retraso</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.conRetraso}</h2>
            </div>

            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Penalidades</p>
              <h2 className="text-3xl font-bold mt-2 text-red-600">
                ${resumen.penalidades.toLocaleString()}
              </h2>
            </div>

            <div className="bg-red-100 p-3 rounded-full">
              <DollarSign className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />

          <input
            placeholder="Buscar por contrato, cliente o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Historial de devoluciones
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Al registrar una devolución se debe devolver el stock, finalizar el
            contrato y calcular penalidades.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Cargando devoluciones...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No hay devoluciones registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DevolucionesTable
              data={filteredData}
              onRegistrar={handleOpenModal}
            />
          </div>
        )}
      </div>

      {/* PANEL INFERIOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Reglas de devolución
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="font-semibold text-green-800">Retorno de stock</p>
              <p className="text-sm text-green-700">
                Los activos del contrato vuelven automáticamente al inventario.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-800">Cierre de contrato</p>
              <p className="text-sm text-blue-700">
                El contrato pasa a finalizado después de registrar la
                devolución.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="font-semibold text-red-800">
                Penalidad por retraso
              </p>
              <p className="text-sm text-red-700">
                Si hay días de retraso, el sistema calcula el valor pendiente a
                cobrar.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Integración financiera
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-3">
                <CalendarDays className="text-yellow-600 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-yellow-800">
                    Penalidad no es ingreso hasta que se cobre
                  </p>
                  <p className="text-sm text-yellow-700">
                    La devolución calcula la penalidad, pero el ingreso debe
                    registrarse cuando el cliente paga.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-800">
                Cobro mediante pagos_contratos
              </p>
              <p className="text-sm text-blue-700">
                Si el cliente paga alquiler o penalidad, se registra en
                pagos_contratos y se genera una transacción de ingreso.
              </p>
            </div>
          </div>
        </div>
      </div>

      <RegistrarDevolucionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        contratoId={contratoId}
        onSuccess={loadData}
      />
    </div>
  );
}

export default DevolucionesPage;
