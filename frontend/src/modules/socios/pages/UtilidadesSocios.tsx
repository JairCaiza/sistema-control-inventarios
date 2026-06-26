import { DollarSign, TrendingUp, PieChart, FileDown } from "lucide-react";

interface Utilidad {
  id: string;
  socio: string;
  porcentaje: number;
  utilidadBase: number;
  ganancia: number;
  periodo: string;
  estado: "Pagado" | "Pendiente";
}

function UtilidadesSocios() {
  /* =========================
     DATOS FICTICIOS
  ========================= */

  const utilidades: Utilidad[] = [
    {
      id: "UTI-001",
      socio: "Juan Pérez",
      porcentaje: 25,
      utilidadBase: 6000,
      ganancia: 1500,
      periodo: "Junio 2026",
      estado: "Pagado",
    },
    {
      id: "UTI-002",
      socio: "María López",
      porcentaje: 40,
      utilidadBase: 6000,
      ganancia: 2400,
      periodo: "Junio 2026",
      estado: "Pendiente",
    },
    {
      id: "UTI-003",
      socio: "Carlos Ramírez",
      porcentaje: 15,
      utilidadBase: 6000,
      ganancia: 900,
      periodo: "Junio 2026",
      estado: "Pagado",
    },
  ];

  const totalDistribuido = utilidades.reduce((acc, u) => acc + u.ganancia, 0);

  const totalBase = utilidades.reduce((acc, u) => acc + u.utilidadBase, 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Utilidades de Socios
          </h1>
          <p className="text-gray-500">
            Distribución de ganancias por participación accionaria.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
          <FileDown size={18} />
          Exportar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border shadow rounded-xl p-5">
          <p>Total Utilidad Base</p>
          <h2 className="text-2xl font-bold text-blue-600">
            ${totalBase.toLocaleString()}
          </h2>
          <PieChart className="text-blue-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p>Total Distribuido</p>
          <h2 className="text-2xl font-bold text-green-600">
            ${totalDistribuido.toLocaleString()}
          </h2>
          <TrendingUp className="text-green-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p>Promedio Ganancia</p>
          <h2 className="text-2xl font-bold text-purple-600">
            ${(totalDistribuido / utilidades.length).toFixed(0)}
          </h2>
          <DollarSign className="text-purple-600 mt-2" />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white border shadow rounded-xl overflow-hidden">
        <div className="p-5 border-b flex justify-between">
          <h2 className="font-semibold">Distribución de Utilidades</h2>
          <span className="text-sm text-gray-500">
            {utilidades.length} socios
          </span>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Socio</th>
              <th className="p-3 text-right">%</th>
              <th className="p-3 text-right">Ganancia</th>
              <th className="p-3 text-left">Periodo</th>
              <th className="p-3 text-center">Estado</th>
            </tr>
          </thead>

          <tbody>
            {utilidades.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.socio}</td>

                <td className="p-3 text-right">{u.porcentaje}%</td>

                <td className="p-3 text-right font-semibold text-green-600">
                  ${u.ganancia.toLocaleString()}
                </td>

                <td className="p-3">{u.periodo}</td>

                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      u.estado === "Pagado"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {u.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UtilidadesSocios;
