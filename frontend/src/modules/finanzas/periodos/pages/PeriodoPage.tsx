import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  FileDown,
} from "lucide-react";

interface Periodo {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
  estado: "Abierto" | "Cerrado" | "Bloqueado";
  ingresos: number;
  egresos: number;
  utilidad: number;
}

function PeriodoPage() {
  /* =========================
     DATOS FICTICIOS (ERP MOCK)
  ========================= */

  const periodos: Periodo[] = [
    {
      id: "PER-2026-01",
      nombre: "Enero 2026",
      inicio: "01/01/2026",
      fin: "31/01/2026",
      estado: "Cerrado",
      ingresos: 12000,
      egresos: 8000,
      utilidad: 4000,
    },
    {
      id: "PER-2026-02",
      nombre: "Febrero 2026",
      inicio: "01/02/2026",
      fin: "28/02/2026",
      estado: "Cerrado",
      ingresos: 15000,
      egresos: 9500,
      utilidad: 5500,
    },
    {
      id: "PER-2026-03",
      nombre: "Marzo 2026",
      inicio: "01/03/2026",
      fin: "31/03/2026",
      estado: "Bloqueado",
      ingresos: 11000,
      egresos: 7000,
      utilidad: 4000,
    },
    {
      id: "PER-2026-04",
      nombre: "Abril 2026",
      inicio: "01/04/2026",
      fin: "30/04/2026",
      estado: "Abierto",
      ingresos: 18000,
      egresos: 12000,
      utilidad: 6000,
    },
  ];

  /* =========================
     KPIs
  ========================= */

  const totalIngresos = periodos.reduce((a, p) => a + p.ingresos, 0);
  const totalEgresos = periodos.reduce((a, p) => a + p.egresos, 0);
  const totalUtilidad = periodos.reduce((a, p) => a + p.utilidad, 0);

  const abiertos = periodos.filter((p) => p.estado === "Abierto").length;
  const cerrados = periodos.filter((p) => p.estado === "Cerrado").length;
  const bloqueados = periodos.filter((p) => p.estado === "Bloqueado").length;

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Periodos
          </h1>
          <p className="text-gray-500 mt-1">
            Control contable de periodos abiertos, cerrados y bloqueados.
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <AlertTriangle className="text-red-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Utilidad</p>
          <h2 className="text-2xl font-bold text-blue-600">
            ${totalUtilidad.toLocaleString()}
          </h2>
          <Calendar className="text-blue-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Estados</p>
          <p className="text-sm mt-2 text-gray-600">
            🟢 {abiertos} Abiertos <br />
            🔒 {cerrados} Cerrados <br />
            ⚠️ {bloqueados} Bloqueados
          </p>
        </div>
      </div>

      {/* =========================
          TABLA PERIODOS
      ========================= */}
      <div className="bg-white border shadow rounded-xl overflow-hidden">
        <div className="p-5 border-b flex justify-between">
          <h2 className="font-semibold">Listado de Periodos Contables</h2>
          <span className="text-sm text-gray-500">
            {periodos.length} periodos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Periodo</th>
                <th className="p-3 text-left">Inicio</th>
                <th className="p-3 text-left">Fin</th>
                <th className="p-3 text-right">Ingresos</th>
                <th className="p-3 text-right">Egresos</th>
                <th className="p-3 text-right">Utilidad</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>

            <tbody>
              {periodos.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.nombre}</td>
                  <td className="p-3 text-sm">{p.inicio}</td>
                  <td className="p-3 text-sm">{p.fin}</td>

                  <td className="p-3 text-right text-green-600 font-semibold">
                    ${p.ingresos.toLocaleString()}
                  </td>

                  <td className="p-3 text-right text-red-600 font-semibold">
                    ${p.egresos.toLocaleString()}
                  </td>

                  <td className="p-3 text-right font-bold">
                    ${p.utilidad.toLocaleString()}
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.estado === "Abierto"
                          ? "bg-green-100 text-green-700"
                          : p.estado === "Cerrado"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          FOOTER ERP
      ========================= */}
      <div className="bg-gray-50 border rounded-xl p-4 text-sm text-gray-600">
        Control de periodos contables del sistema ERP (datos ficticios).
      </div>
    </div>
  );
}

export default PeriodoPage;
