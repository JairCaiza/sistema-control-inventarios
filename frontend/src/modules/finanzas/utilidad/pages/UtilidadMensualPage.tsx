import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  FileDown,
} from "lucide-react";

interface Utilidad {
  mes: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
}

function UtilidaMensualPage() {
  /* =========================
     DATOS FICTICIOS (MOCK ERP)
  ========================= */

  const data: Utilidad[] = [
    {
      mes: "Enero",
      ingresos: 12000,
      egresos: 8000,
      utilidad: 4000,
    },
    {
      mes: "Febrero",
      ingresos: 15000,
      egresos: 9500,
      utilidad: 5500,
    },
    {
      mes: "Marzo",
      ingresos: 11000,
      egresos: 7000,
      utilidad: 4000,
    },
    {
      mes: "Abril",
      ingresos: 18000,
      egresos: 12000,
      utilidad: 6000,
    },
    {
      mes: "Mayo",
      ingresos: 20000,
      egresos: 14000,
      utilidad: 6000,
    },
    {
      mes: "Junio",
      ingresos: 17000,
      egresos: 11000,
      utilidad: 6000,
    },
  ];

  /* =========================
     KPIs GENERALES
  ========================= */

  const totalIngresos = data.reduce((acc, d) => acc + d.ingresos, 0);
  const totalEgresos = data.reduce((acc, d) => acc + d.egresos, 0);
  const totalUtilidad = data.reduce((acc, d) => acc + d.utilidad, 0);

  const promedioMensual = totalUtilidad / data.length;

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Utilidad Mensual</h1>
          <p className="text-gray-500 mt-1">
            Análisis de rentabilidad por periodo (datos ficticios).
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
        {/* INGRESOS */}
        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Ingresos Totales</p>
          <h2 className="text-2xl font-bold text-green-600">
            ${totalIngresos.toLocaleString()}
          </h2>
          <TrendingUp className="text-green-600 mt-2" />
        </div>

        {/* EGRESOS */}
        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Egresos Totales</p>
          <h2 className="text-2xl font-bold text-red-600">
            ${totalEgresos.toLocaleString()}
          </h2>
          <TrendingDown className="text-red-600 mt-2" />
        </div>

        {/* UTILIDAD */}
        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Utilidad Total</p>
          <h2
            className={`text-2xl font-bold ${
              totalUtilidad >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${totalUtilidad.toLocaleString()}
          </h2>
          <DollarSign className="text-gray-600 mt-2" />
        </div>

        {/* PROMEDIO */}
        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Promedio Mensual</p>
          <h2 className="text-2xl font-bold text-blue-600">
            ${promedioMensual.toFixed(0)}
          </h2>
          <Calendar className="text-blue-600 mt-2" />
        </div>
      </div>

      {/* =========================
          RESUMEN VISUAL (CARDS)
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-5 shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Mejor Mes</h3>
            <BarChart3 className="text-green-600" />
          </div>
          <p className="text-2xl font-bold mt-3">Mayo</p>
          <p className="text-sm text-gray-500">$6,000 utilidad</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Mes Más Bajo</h3>
            <BarChart3 className="text-red-600" />
          </div>
          <p className="text-2xl font-bold mt-3">Enero</p>
          <p className="text-sm text-gray-500">$4,000 utilidad</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tendencia</h3>
            <TrendingUp className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold mt-3">Estable</p>
          <p className="text-sm text-gray-500">Crecimiento controlado</p>
        </div>
      </div>

      {/* =========================
          TABLA ERP
      ========================= */}
      <div className="bg-white border shadow rounded-xl overflow-hidden">
        <div className="p-5 border-b flex justify-between">
          <h2 className="font-semibold">Detalle Mensual</h2>
          <span className="text-sm text-gray-500">{data.length} meses</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Mes</th>
                <th className="p-3 text-right">Ingresos</th>
                <th className="p-3 text-right">Egresos</th>
                <th className="p-3 text-right">Utilidad</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>

            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{d.mes}</td>

                  <td className="p-3 text-right text-green-600 font-semibold">
                    ${d.ingresos.toLocaleString()}
                  </td>

                  <td className="p-3 text-right text-red-600 font-semibold">
                    ${d.egresos.toLocaleString()}
                  </td>

                  <td className="p-3 text-right font-bold">
                    ${d.utilidad.toLocaleString()}
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        d.utilidad >= 5000
                          ? "bg-green-100 text-green-700"
                          : d.utilidad >= 3000
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {d.utilidad >= 5000
                        ? "Alta"
                        : d.utilidad >= 3000
                          ? "Media"
                          : "Baja"}
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
        Análisis de utilidad mensual basado en datos ficticios del sistema ERP.
      </div>
    </div>
  );
}

export default UtilidaMensualPage;
