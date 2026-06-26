import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileDown,
  BarChart3,
} from "lucide-react";

function FinancieroDashboardPage() {
  /* =========================
     DATOS FICTICIOS
  ========================= */

  const resumen = {
    saldoTotal: 52430,
    ingresosMes: 18900,
    egresosMes: 11250,
    utilidadMes: 7650,
  };
  const cuentas = [
    { nombre: "Banco Pichincha", saldo: 25000 },
    { nombre: "Banco Guayaquil", saldo: 12500 },
    { nombre: "Caja Chica", saldo: 2430 },
    { nombre: "Produbanco", saldo: 12500 },
  ];

  const egresosCategoria = [
    { categoria: "Nómina", valor: 4200 },
    { categoria: "Compras", valor: 2800 },
    { categoria: "Combustible", valor: 1350 },
    { categoria: "Obras", valor: 1900 },
    { categoria: "Otros", valor: 1000 },
  ];
  const movimientos = [
    {
      fecha: "12/06/2026",
      tipo: "Ingreso",
      cuenta: "Banco Pichincha",
      valor: 2500,
    },
    {
      fecha: "12/06/2026",
      tipo: "Egreso",
      cuenta: "Caja Chica",
      valor: 120,
    },
    {
      fecha: "11/06/2026",
      tipo: "Transferencia",
      cuenta: "Produbanco",
      valor: 1000,
    },
    {
      fecha: "11/06/2026",
      tipo: "Transferencia",
      cuenta: "Banco Guayaquil",
      valor: 1000,
    },
    {
      fecha: "10/06/2026",
      tipo: "Ingreso",
      cuenta: "Banco Pichincha",
      valor: 850,
    },
  ];

  const flujoCaja = [
    { mes: "Enero", valor: 12000 },
    { mes: "Febrero", valor: 15000 },
    { mes: "Marzo", valor: 11000 },
    { mes: "Abril", valor: 17000 },
    { mes: "Mayo", valor: 19000 },
    { mes: "Junio", valor: 16000 },
  ];

  const acumulado = {
    ingresos: 96400,
    egresos: 71300,
    utilidad: 25100,
  };

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard Financiero
          </h1>

          <p className="text-gray-500 mt-1">
            Resumen general del estado financiero del negocio.
          </p>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-wrap gap-3">
          <select
            className="
              border
              rounded-lg
              px-4
              py-2
              bg-white
              shadow-sm
              text-sm
            "
          >
            <option>Junio 2026</option>
            <option>Mayo 2026</option>
            <option>Abril 2026</option>
          </select>

          <button
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              bg-red-600
              text-white
              hover:bg-red-700
              transition
            "
          >
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              bg-[var(--color-primary)]
              text-white
              hover:opacity-90
              transition
            "
          >
            <BarChart3 size={18} />
            Flujo Caja
          </button>
        </div>
      </div>

      {/* =========================
          KPIs
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* SALDO */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Saldo Total</p>

              <h2 className="text-3xl font-bold mt-2">
                ${resumen.saldoTotal.toLocaleString()}
              </h2>

              <p className="text-green-600 text-sm mt-2">
                ↑ 8% respecto al mes anterior
              </p>
            </div>

            <div className="bg-green-100 p-3 rounded-full">
              <Wallet className="text-green-600" />
            </div>
          </div>
        </div>

        {/* INGRESOS */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Ingresos del Mes</p>

              <h2 className="text-3xl font-bold mt-2">
                ${resumen.ingresosMes.toLocaleString()}
              </h2>

              <p className="text-green-600 text-sm mt-2">
                ↑ 12% respecto al mes anterior
              </p>
            </div>

            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" />
            </div>
          </div>
        </div>

        {/* EGRESOS */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Egresos del Mes</p>

              <h2 className="text-3xl font-bold mt-2">
                ${resumen.egresosMes.toLocaleString()}
              </h2>

              <p className="text-red-600 text-sm mt-2">
                ↓ 5% respecto al mes anterior
              </p>
            </div>

            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="text-red-600" />
            </div>
          </div>
        </div>

        {/* UTILIDAD */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Utilidad del Mes</p>

              <h2 className="text-3xl font-bold mt-2">
                ${resumen.utilidadMes.toLocaleString()}
              </h2>

              <p className="text-green-600 text-sm mt-2">
                ↑ 18% respecto al mes anterior
              </p>
            </div>

            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
      {/* =========================
          SALDO POR CUENTAS + EGRESOS
      ========================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SALDO POR CUENTAS */}
        <div className="bg-white rounded-xl shadow border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Saldo por Cuentas
            </h2>

            <Wallet className="text-[var(--color-primary)]" />
          </div>

          <div className="space-y-5">
            {cuentas.map((cuenta) => {
              const porcentaje = (cuenta.saldo / resumen.saldoTotal) * 100;

              return (
                <div key={cuenta.nombre}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      {cuenta.nombre}
                    </span>

                    <span className="font-semibold">
                      ${cuenta.saldo.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="
                        bg-[var(--color-primary)]
                        h-3
                        rounded-full
                        transition-all
                      "
                      style={{
                        width: `${porcentaje}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* EGRESOS POR CATEGORÍA */}
        <div className="bg-white rounded-xl shadow border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Egresos del Mes
            </h2>

            <TrendingDown className="text-red-500" />
          </div>

          <div className="space-y-4">
            {egresosCategoria.map((item) => (
              <div
                key={item.categoria}
                className="
                  flex
                  items-center
                  justify-between
                  p-4
                  rounded-lg
                  bg-gray-50
                  hover:bg-gray-100
                  transition
                "
              >
                <div>
                  <p className="font-medium text-gray-800">{item.categoria}</p>

                  <p className="text-sm text-gray-500">Categoría de gasto</p>
                </div>

                <span className="font-bold text-red-600">
                  ${item.valor.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* =========================
    MOVIMIENTOS RECIENTES
========================= */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Movimientos Recientes
          </h2>

          <button
            className="
        text-sm
        text-[var(--color-primary)]
        font-medium
        hover:underline
      "
          >
            Ver todos
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Fecha
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Tipo
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Cuenta
                </th>

                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Valor
                </th>
              </tr>
            </thead>

            <tbody>
              {movimientos.map((mov, index) => (
                <tr
                  key={index}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">{mov.fecha}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${
                    mov.tipo === "Ingreso"
                      ? "bg-green-100 text-green-700"
                      : mov.tipo === "Egreso"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                  }
                `}
                    >
                      {mov.tipo}
                    </span>
                  </td>

                  <td className="px-4 py-3">{mov.cuenta}</td>

                  <td
                    className={`
                px-4 py-3 text-right font-semibold
                ${
                  mov.tipo === "Ingreso"
                    ? "text-green-600"
                    : mov.tipo === "Egreso"
                      ? "text-red-600"
                      : "text-blue-600"
                }
              `}
                  >
                    {mov.tipo === "Ingreso"
                      ? "+"
                      : mov.tipo === "Egreso"
                        ? "-"
                        : ""}
                    ${mov.valor.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* =========================
          ALERTAS + ACCESOS RÁPIDOS
      ========================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ALERTAS */}
        <div className="bg-white rounded-xl shadow border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Alertas Financieras
            </h2>

            <span className="text-2xl">⚠️</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <span className="text-yellow-600 text-xl">⚠️</span>

              <div>
                <p className="font-semibold text-yellow-800">
                  Caja chica por debajo del mínimo.
                </p>

                <p className="text-sm text-yellow-700">
                  El saldo disponible es inferior al límite recomendado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
              <span className="text-orange-600 text-xl">📅</span>

              <div>
                <p className="font-semibold text-orange-800">
                  Periodo Mayo pendiente de cierre.
                </p>

                <p className="text-sm text-orange-700">
                  Se recomienda realizar el cierre mensual.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <span className="text-green-600 text-xl">✅</span>

              <div>
                <p className="font-semibold text-green-800">
                  No existen transferencias pendientes.
                </p>

                <p className="text-sm text-green-700">
                  Todos los movimientos están conciliados.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Accesos Rápidos
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              className="
                p-5
                rounded-xl
                border
                hover:border-[var(--color-primary)]
                hover:bg-gray-50
                transition
              "
            >
              <div className="text-3xl mb-2">🏦</div>

              <p className="font-semibold">Nueva Cuenta</p>
            </button>

            <button
              className="
                p-5
                rounded-xl
                border
                hover:border-green-500
                hover:bg-green-50
                transition
              "
            >
              <div className="text-3xl mb-2">💰</div>

              <p className="font-semibold">Registrar Ingreso</p>
            </button>

            <button
              className="
                p-5
                rounded-xl
                border
                hover:border-red-500
                hover:bg-red-50
                transition
              "
            >
              <div className="text-3xl mb-2">💸</div>

              <p className="font-semibold">Registrar Egreso</p>
            </button>

            <button
              className="
                p-5
                rounded-xl
                border
                hover:border-blue-500
                hover:bg-blue-50
                transition
              "
            >
              <div className="text-3xl mb-2">🔄</div>

              <p className="font-semibold">Transferencia</p>
            </button>

            <button
              className="
                p-5
                rounded-xl
                border
                hover:border-purple-500
                hover:bg-purple-50
                transition
              "
            >
              <div className="text-3xl mb-2">📅</div>

              <p className="font-semibold">Cierre Diario</p>
            </button>

            <button
              className="
                p-5
                rounded-xl
                border
                hover:border-[var(--color-primary)]
                hover:bg-gray-50
                transition
              "
            >
              <div className="text-3xl mb-2">📊</div>

              <p className="font-semibold">Flujo Caja</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancieroDashboardPage;
