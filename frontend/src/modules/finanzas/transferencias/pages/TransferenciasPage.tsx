import { useState } from "react";
import {
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  Clock,
  FileDown,
  Plus,
} from "lucide-react";

import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

interface Transferencia {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  referencia: string;
  metodo: string;
  monto: number;
  usuario: string;
  estado: "Confirmada" | "Pendiente" | "Rechazada";
}

function TransferenciasPage() {
  /* =========================
     DATOS FICTICIOS
  ========================= */

  const [transferencias] = useState<Transferencia[]>([
    {
      id: "TRF-001",
      fecha: "14/06/2026",
      origen: "Banco Pichincha",
      destino: "Banco Guayaquil",
      referencia: "Pago proveedores",
      metodo: "Transferencia Interbancaria",
      monto: 2500,
      usuario: "Administrador",
      estado: "Confirmada",
    },
    {
      id: "TRF-002",
      fecha: "13/06/2026",
      origen: "Caja General",
      destino: "Banco Pichincha",
      referencia: "Depósito diario",
      metodo: "Depósito",
      monto: 800,
      usuario: "Cajero",
      estado: "Pendiente",
    },
    {
      id: "TRF-003",
      fecha: "12/06/2026",
      origen: "Banco Guayaquil",
      destino: "Banco Pichincha",
      referencia: "Reintegro fondos",
      metodo: "Transferencia",
      monto: 1200,
      usuario: "Administrador",
      estado: "Confirmada",
    },
  ]);

  /* =========================
     KPIs
  ========================= */

  const totalMes = transferencias.reduce((acc, t) => acc + t.monto, 0);

  const pendientes = transferencias.filter(
    (t) => t.estado === "Pendiente",
  ).length;

  const promedio =
    transferencias.length > 0 ? totalMes / transferencias.length : 0;

  /* =========================
     CRUD SIMULADO
  ========================= */

  const handleCreate = () => console.log("Nueva transferencia");
  const handleView = (id: string) => console.log("Ver", id);
  const handleEdit = (id: string) => console.log("Editar", id);
  const handleDelete = (id: string) => console.log("Eliminar", id);

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Transferencias
          </h1>

          <p className="text-gray-500 mt-1">
            Control de movimientos entre cuentas bancarias y caja.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition"
          >
            <Plus size={18} />
            Nueva Transferencia
          </button>
        </div>
      </div>

      {/* =========================
          KPIs
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOTAL */}
        <div className="bg-white shadow border rounded-xl p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Transferido</p>
              <h2 className="text-3xl font-bold mt-2">
                ${totalMes.toLocaleString()}
              </h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ArrowLeftRight className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* PROMEDIO */}
        <div className="bg-white shadow border rounded-xl p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Promedio</p>
              <h2 className="text-3xl font-bold mt-2">
                ${promedio.toFixed(0)}
              </h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" />
            </div>
          </div>
        </div>

        {/* PENDIENTES */}
        <div className="bg-white shadow border rounded-xl p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pendientes</p>
              <h2 className="text-3xl font-bold mt-2">{pendientes}</h2>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          FILTROS
      ========================= */}
      <div className="bg-white shadow border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Referencia..."
            className="border px-4 py-2 rounded-lg"
          />

          <select className="border px-4 py-2 rounded-lg">
            <option>Estado</option>
            <option>Confirmada</option>
            <option>Pendiente</option>
            <option>Rechazada</option>
          </select>

          <input type="date" className="border px-4 py-2 rounded-lg" />

          <button className="border px-4 py-2 rounded-lg hover:bg-gray-100">
            Limpiar
          </button>
        </div>
      </div>

      {/* =========================
          TABLA
      ========================= */}
      <div className="bg-white shadow border rounded-xl overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Historial de Transferencias</h2>
          <span className="text-sm text-gray-500">
            {transferencias.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Origen</th>
                <th className="p-3 text-left">Destino</th>
                <th className="p-3 text-left">Referencia</th>
                <th className="p-3 text-left">Método</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {transferencias.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm">{t.fecha}</td>
                  <td className="p-3 text-sm">{t.origen}</td>
                  <td className="p-3 text-sm">{t.destino}</td>
                  <td className="p-3 text-sm">{t.referencia}</td>
                  <td className="p-3 text-sm">{t.metodo}</td>

                  <td className="p-3 text-right font-semibold text-blue-600">
                    ${t.monto.toLocaleString()}
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium
                      ${
                        t.estado === "Confirmada"
                          ? "bg-green-100 text-green-700"
                          : t.estado === "Pendiente"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t.estado}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleView(t.id)}>
                        <FaEye />
                      </button>

                      <button onClick={() => handleEdit(t.id)}>
                        <FaEdit />
                      </button>

                      <button onClick={() => handleDelete(t.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          MODAL CREAR (BASE)
      ========================= */}
      {false && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Nueva Transferencia</h2>

            <p className="text-gray-500">Formulario de transferencia aquí...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransferenciasPage;
