import { DollarSign, TrendingUp, Plus, FileDown, Wallet } from "lucide-react";

import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

interface Aporte {
  id: string;
  socio: string;
  fecha: string;
  tipo: "Aporte" | "Retiro";
  monto: number;
  metodo: "Efectivo" | "Transferencia" | "Banco";
  referencia: string;
  estado: "Confirmado" | "Pendiente";
}

function AportesSocios() {
  /* =========================
     DATOS FICTICIOS
  ========================= */

  const aportes: Aporte[] = [
    {
      id: "APO-001",
      socio: "Juan Pérez",
      fecha: "10/06/2026",
      tipo: "Aporte",
      monto: 2000,
      metodo: "Transferencia",
      referencia: "DEP-001",
      estado: "Confirmado",
    },
    {
      id: "APO-002",
      socio: "María López",
      fecha: "09/06/2026",
      tipo: "Aporte",
      monto: 3500,
      metodo: "Banco",
      referencia: "DEP-002",
      estado: "Confirmado",
    },
    {
      id: "APO-003",
      socio: "Carlos Ramírez",
      fecha: "08/06/2026",
      tipo: "Retiro",
      monto: 1000,
      metodo: "Efectivo",
      referencia: "RET-001",
      estado: "Pendiente",
    },
  ];

  /* =========================
     KPIs
  ========================= */

  const totalAportes = aportes
    .filter((a) => a.tipo === "Aporte")
    .reduce((acc, a) => acc + a.monto, 0);

  const totalRetiros = aportes
    .filter((a) => a.tipo === "Retiro")
    .reduce((acc, a) => acc + a.monto, 0);

  const saldoCapital = totalAportes - totalRetiros;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Aportes de Socios
          </h1>
          <p className="text-gray-500">
            Registro de capital, aportes y retiros de socios.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white">
            <FileDown size={18} />
            Exportar
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white">
            <Plus size={18} />
            Nuevo Aporte
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Total Aportes</p>
          <h2 className="text-2xl font-bold text-green-600">
            ${totalAportes.toLocaleString()}
          </h2>
          <TrendingUp className="text-green-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Total Retiros</p>
          <h2 className="text-2xl font-bold text-red-600">
            ${totalRetiros.toLocaleString()}
          </h2>
          <Wallet className="text-red-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Capital Neto</p>
          <h2 className="text-2xl font-bold text-blue-600">
            ${saldoCapital.toLocaleString()}
          </h2>
          <DollarSign className="text-blue-600 mt-2" />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white border shadow rounded-xl overflow-hidden">
        <div className="p-5 border-b flex justify-between">
          <h2 className="font-semibold">Movimientos de Capital</h2>
          <span className="text-sm text-gray-500">
            {aportes.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Socio</th>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Método</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {aportes.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{a.socio}</td>
                  <td className="p-3 text-sm">{a.fecha}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        a.tipo === "Aporte"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.tipo}
                    </span>
                  </td>

                  <td className="p-3 text-sm">{a.metodo}</td>

                  <td className="p-3 text-right font-semibold">
                    ${a.monto.toLocaleString()}
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        a.estado === "Confirmado"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {a.estado}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <FaEye />
                      <FaEdit />
                      <FaTrash />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AportesSocios;
