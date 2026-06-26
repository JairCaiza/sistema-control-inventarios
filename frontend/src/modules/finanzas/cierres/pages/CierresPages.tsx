import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileDown,
  Lock,
} from "lucide-react";

interface Cierre {
  id: string;
  fecha: string;
  tipo: "Diario" | "Mensual" | "Caja";
  responsable: string;
  ingresos: number;
  egresos: number;
  saldo: number;
  estado: "Abierto" | "Cerrado" | "Revisado";
}

function CierresPage() {
  /* =========================
     DATOS FICTICIOS (MOCK ERP)
  ========================= */

  const cierres: Cierre[] = [
    {
      id: "CIE-001",
      fecha: "14/06/2026",
      tipo: "Diario",
      responsable: "Administrador",
      ingresos: 5000,
      egresos: 3200,
      saldo: 1800,
      estado: "Cerrado",
    },
    {
      id: "CIE-002",
      fecha: "13/06/2026",
      tipo: "Diario",
      responsable: "Cajero",
      ingresos: 4200,
      egresos: 2800,
      saldo: 1400,
      estado: "Revisado",
    },
    {
      id: "CIE-003",
      fecha: "Junio 2026",
      tipo: "Mensual",
      responsable: "Contabilidad",
      ingresos: 85000,
      egresos: 62000,
      saldo: 23000,
      estado: "Abierto",
    },
    {
      id: "CIE-004",
      fecha: "12/06/2026",
      tipo: "Caja",
      responsable: "Cajero",
      ingresos: 3100,
      egresos: 2900,
      saldo: 200,
      estado: "Cerrado",
    },
  ];

  /* =========================
     KPIs
  ========================= */

  const totalIngresos = cierres.reduce((acc, c) => acc + c.ingresos, 0);
  const totalEgresos = cierres.reduce((acc, c) => acc + c.egresos, 0);
  const totalSaldo = cierres.reduce((acc, c) => acc + c.saldo, 0);

  const abiertos = cierres.filter((c) => c.estado === "Abierto").length;
  const cerrados = cierres.filter((c) => c.estado === "Cerrado").length;

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Cierres Contables
          </h1>
          <p className="text-gray-500 mt-1">
            Control de cierres diarios, mensuales y de caja.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white">
          <FileDown size={18} />
          Exportar
        </button>
      </div>

      {/* =========================
          KPIs
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Ingresos</p>
          <h2 className="text-2xl font-bold text-green-600">
            ${totalIngresos.toLocaleString()}
          </h2>
          <CheckCircle className="text-green-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Egresos</p>
          <h2 className="text-2xl font-bold text-red-600">
            ${totalEgresos.toLocaleString()}
          </h2>
          <XCircle className="text-red-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Saldo Total</p>
          <h2 className="text-2xl font-bold text-blue-600">
            ${totalSaldo.toLocaleString()}
          </h2>
          <Clock className="text-blue-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Abiertos</p>
          <h2 className="text-2xl font-bold text-yellow-600">{abiertos}</h2>
          <Lock className="text-yellow-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Cerrados</p>
          <h2 className="text-2xl font-bold text-gray-700">{cerrados}</h2>
          <CheckCircle className="text-gray-700 mt-2" />
        </div>
      </div>

      {/* =========================
          TABLA CIERRES
      ========================= */}
      <div className="bg-white border shadow rounded-xl overflow-hidden">
        <div className="p-5 border-b flex justify-between">
          <h2 className="font-semibold">Historial de Cierres</h2>
          <span className="text-sm text-gray-500">
            {cierres.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Responsable</th>
                <th className="p-3 text-right">Ingresos</th>
                <th className="p-3 text-right">Egresos</th>
                <th className="p-3 text-right">Saldo</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>

            <tbody>
              {cierres.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm">{c.fecha}</td>

                  <td className="p-3 text-sm">
                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                      {c.tipo}
                    </span>
                  </td>

                  <td className="p-3 text-sm">{c.responsable}</td>

                  <td className="p-3 text-right text-green-600 font-semibold">
                    ${c.ingresos.toLocaleString()}
                  </td>

                  <td className="p-3 text-right text-red-600 font-semibold">
                    ${c.egresos.toLocaleString()}
                  </td>

                  <td className="p-3 text-right font-bold">
                    ${c.saldo.toLocaleString()}
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.estado === "Cerrado"
                          ? "bg-green-100 text-green-700"
                          : c.estado === "Abierto"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {c.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          FOOTER
      ========================= */}
      <div className="bg-gray-50 border rounded-xl p-4 text-sm text-gray-600">
        Módulo de cierres contables (datos ficticios). Control de cierre
        operativo del sistema ERP.
      </div>
    </div>
  );
}

export default CierresPage;
