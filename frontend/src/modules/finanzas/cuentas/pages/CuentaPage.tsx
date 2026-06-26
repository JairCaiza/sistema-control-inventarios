import { useState } from "react";
import Swal from "sweetalert2";

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
} from "react-icons/fa";

interface Cuenta {
  id: string;
  nombre: string;
  tipo: "caja" | "banco";
  saldo_actual: number;
  movimientos: number;
  activo: boolean;
}

function CuentaPage() {
  const [loading] = useState(false);

  /* Datos temporales para maquetación */
  const [cuentas] = useState<Cuenta[]>([
    {
      id: "1",
      nombre: "Caja General",
      tipo: "caja",
      saldo_actual: 2500,
      movimientos: 35,
      activo: true,
    },
    {
      id: "2",
      nombre: "Banco Pichincha",
      tipo: "banco",
      saldo_actual: 18000,
      movimientos: 112,
      activo: true,
    },
    {
      id: "3",
      nombre: "Banco Guayaquil",
      tipo: "banco",
      saldo_actual: 4200,
      movimientos: 54,
      activo: true,
    },
  ]);

  const handleDelete = async () => {
    await Swal.fire({
      title: "Plantilla",
      text: "La funcionalidad se implementará después.",
      icon: "info",
    });
  };

  return (
    <div className="space-y-6">
      {/* ========================= HEADER ========================= */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Cuentas Financieras</h1>

          <p className="text-sm text-gray-500 mt-1">
            Administra cajas y cuentas bancarias del ERP.
          </p>
        </div>

        <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90">
          + Nueva Cuenta
        </button>
      </div>

      {/* ========================= RESUMEN ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-sm text-gray-500">Total Cuentas</p>

          <p className="text-2xl font-bold">{cuentas.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-sm text-gray-500">Saldo en Cajas</p>

          <p className="text-2xl font-bold text-green-600">$3,300</p>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-sm text-gray-500">Saldo Total Disponible</p>

          <p className="text-2xl font-bold text-blue-600">$24,700</p>
        </div>
      </div>

      {/* ========================= FILTROS ========================= */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar cuenta..."
            className="border rounded px-3 py-2 flex-1"
          />

          <select className="border rounded px-3 py-2">
            <option>Todas</option>
            <option>Caja</option>
            <option>Banco</option>
          </select>
        </div>
      </div>

      {/* ========================= LOADING ========================= */}
      {loading && (
        <div className="text-center py-10 text-gray-500">
          Cargando cuentas...
        </div>
      )}

      {/* ========================= TABLA ========================= */}
      {!loading && (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Cuenta
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Tipo
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Saldo Actual
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Movimientos
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Estado
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {cuentas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No hay cuentas registradas
                  </td>
                </tr>
              )}

              {cuentas.map((cuenta) => (
                <tr
                  key={cuenta.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 font-medium">{cuenta.nombre}</td>

                  <td className="px-4 py-3 capitalize">{cuenta.tipo}</td>

                  <td className="px-4 py-3">
                    $
                    {cuenta.saldo_actual.toLocaleString("es-EC", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td className="px-4 py-3">{cuenta.movimientos}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        cuenta.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cuenta.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>

                  {/* ========================= ACCIONES ========================= */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      {/* Ver detalle */}
                      <button
                        title="Ver detalle"
                        className="text-cyan-600 hover:scale-110 transition"
                      >
                        <FaEye />
                      </button>

                      {/* Editar */}
                      <button
                        title="Editar"
                        className="text-blue-600 hover:scale-110 transition"
                      >
                        <FaEdit />
                      </button>

                      {/* Ver movimientos */}
                      <button
                        title="Movimientos"
                        className="text-purple-600 hover:scale-110 transition"
                      >
                        <FaFileInvoiceDollar />
                      </button>

                      {/* Registrar ingreso */}
                      <button
                        title="Registrar ingreso"
                        className="text-green-600 hover:scale-110 transition"
                      >
                        <FaMoneyBillWave />
                      </button>

                      {/* Transferencia */}
                      <button
                        title="Transferir"
                        className="text-orange-600 hover:scale-110 transition"
                      >
                        <FaExchangeAlt />
                      </button>

                      {/* Eliminar */}
                      <button
                        title="Eliminar"
                        onClick={handleDelete}
                        className="text-red-600 hover:scale-110 transition"
                      >
                        <FaTrash />
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
  );
}

export default CuentaPage;
