import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileDown,
} from "lucide-react";

interface Flujo {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: "Ingreso" | "Egreso" | "Transferencia";
  categoria: string;
  monto: number;
  saldo: number;
  referencia: string;
}

function FlujoCajaPage() {
  /* =========================
     DATOS FICTICIOS (MOCK ERP)
  ========================= */

  const movimientos: Flujo[] = [
    {
      id: "FLU-001",
      fecha: "14/06/2026",
      descripcion: "Cobro cliente obra",
      tipo: "Ingreso",
      categoria: "Ventas",
      monto: 5000,
      saldo: 15000,
      referencia: "FAC-1001",
    },
    {
      id: "FLU-002",
      fecha: "14/06/2026",
      descripcion: "Pago materiales",
      tipo: "Egreso",
      categoria: "Materiales",
      monto: 1200,
      saldo: 13800,
      referencia: "EGR-778",
    },
    {
      id: "FLU-003",
      fecha: "13/06/2026",
      descripcion: "Transferencia entre cuentas",
      tipo: "Transferencia",
      categoria: "Bancos",
      monto: 2000,
      saldo: 15800,
      referencia: "TRF-300",
    },
    {
      id: "FLU-004",
      fecha: "12/06/2026",
      descripcion: "Pago nómina",
      tipo: "Egreso",
      categoria: "Nómina",
      monto: 1800,
      saldo: 13800,
      referencia: "PAY-550",
    },
  ];

  /* =========================
     KPIs (SOLO DERIVADOS UI)
  ========================= */

  const totalIngresos = movimientos
    .filter((m) => m.tipo === "Ingreso")
    .reduce((a, b) => a + b.monto, 0);

  const totalEgresos = movimientos
    .filter((m) => m.tipo === "Egreso")
    .reduce((a, b) => a + b.monto, 0);

  const totalTransferencias = movimientos
    .filter((m) => m.tipo === "Transferencia")
    .reduce((a, b) => a + b.monto, 0);

  const saldoNeto = totalIngresos - totalEgresos;

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER ERP
      ========================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Flujo de Caja</h1>
          <p className="text-gray-500">
            Vista contable de movimientos financieros (mock ERP).
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white">
          <FileDown size={18} />
          Exportar
        </button>
      </div>

      {/* =========================
          KPIs ERP
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Ingresos</p>
          <h2 className="text-2xl font-bold text-green-600">
            ${totalIngresos.toLocaleString()}
          </h2>
          <TrendingUp className="text-green-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Egresos</p>
          <h2 className="text-2xl font-bold text-red-600">
            ${totalEgresos.toLocaleString()}
          </h2>
          <TrendingDown className="text-red-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Transferencias</p>
          <h2 className="text-2xl font-bold text-blue-600">
            ${totalTransferencias.toLocaleString()}
          </h2>
          <Wallet className="text-blue-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Saldo Neto</p>
          <h2
            className={`text-2xl font-bold ${
              saldoNeto >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${saldoNeto.toLocaleString()}
          </h2>
          <DollarSign className="text-gray-600 mt-2" />
        </div>
      </div>

      {/* =========================
          FILTROS (UI ONLY)
      ========================= */}
      <div className="bg-white border shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            className="border px-4 py-2 rounded-lg"
            placeholder="Buscar..."
          />

          <select className="border px-4 py-2 rounded-lg">
            <option>Tipo</option>
            <option>Ingreso</option>
            <option>Egreso</option>
            <option>Transferencia</option>
          </select>

          <input type="date" className="border px-4 py-2 rounded-lg" />

          <button className="border px-4 py-2 rounded-lg hover:bg-gray-100">
            Limpiar
          </button>
        </div>
      </div>

      {/* =========================
          TABLA ERP
      ========================= */}
      <div className="bg-white border shadow rounded-xl overflow-hidden">
        <div className="p-5 border-b flex justify-between">
          <h2 className="font-semibold">Movimientos</h2>
          <span className="text-sm text-gray-500">
            {movimientos.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-left">Referencia</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3 text-right">Saldo</th>
              </tr>
            </thead>

            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{m.fecha}</td>
                  <td className="p-3">{m.descripcion}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        m.tipo === "Ingreso"
                          ? "bg-green-100 text-green-700"
                          : m.tipo === "Egreso"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </td>

                  <td className="p-3">{m.categoria}</td>
                  <td className="p-3">{m.referencia}</td>

                  <td className="p-3 text-right font-semibold">
                    ${m.monto.toLocaleString()}
                  </td>

                  <td className="p-3 text-right font-semibold">
                    ${m.saldo.toLocaleString()}
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
      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border">
        Plantilla ERP de flujo de caja (solo datos ficticios - sin backend).
      </div>
    </div>
  );
}

export default FlujoCajaPage;
