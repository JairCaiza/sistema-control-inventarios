import {
  Wallet,
  DollarSign,
  TrendingDown,
  Receipt,
  Clock,
  FileDown,
  Plus,
} from "lucide-react";

import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

interface Egreso {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string;
  beneficiario: string;
  cuenta: string;
  metodo_pago: string;
  valor: number;
  usuario: string;
  estado: "Confirmado" | "Pendiente" | "Anulado";
}

function EgresosPage() {
  /* =========================
     DATOS FICTICIOS
  ========================= */

  const egresos: Egreso[] = [
    {
      id: "EGR-001",
      fecha: "12/06/2026",
      concepto: "Compra cemento",
      categoria: "Materiales",
      beneficiario: "Ferretería Central",
      cuenta: "Banco Pichincha",
      metodo_pago: "Transferencia",
      valor: 1250,
      usuario: "Administrador",
      estado: "Confirmado",
    },
    {
      id: "EGR-002",
      fecha: "11/06/2026",
      concepto: "Pago cuadrilla",
      categoria: "Nómina",
      beneficiario: "Juan Pérez",
      cuenta: "Caja General",
      metodo_pago: "Efectivo",
      valor: 850,
      usuario: "Administrador",
      estado: "Confirmado",
    },
    {
      id: "EGR-003",
      fecha: "10/06/2026",
      concepto: "Internet oficina",
      categoria: "Servicios",
      beneficiario: "CNT",
      cuenta: "Banco Guayaquil",
      metodo_pago: "Transferencia",
      valor: 80,
      usuario: "Administrador",
      estado: "Pendiente",
    },
    {
      id: "EGR-004",
      fecha: "09/06/2026",
      concepto: "Combustible maquinaria",
      categoria: "Transporte",
      beneficiario: "Petroecuador",
      cuenta: "Banco Pichincha",
      metodo_pago: "Tarjeta",
      valor: 320,
      usuario: "Administrador",
      estado: "Confirmado",
    },
    {
      id: "EGR-005",
      fecha: "08/06/2026",
      concepto: "Mantenimiento equipo",
      categoria: "Mantenimiento",
      beneficiario: "TecniEquipos",
      cuenta: "Caja General",
      metodo_pago: "Efectivo",
      valor: 450,
      usuario: "Administrador",
      estado: "Anulado",
    },
  ];

  /* =========================
     KPIs
  ========================= */

  const totalMes = egresos.reduce((acc, item) => acc + item.valor, 0);

  const totalHoy = 1150;

  const promedio = egresos.length > 0 ? totalMes / egresos.length : 0;

  const pendientes = egresos.filter((e) => e.estado === "Pendiente").length;

  /* =========================
     CRUD SIMULADO
  ========================= */

  const handleCreate = () => {
    console.log("Nuevo egreso");
  };

  const handleView = (id: string) => {
    console.log("Ver", id);
  };

  const handleEdit = (id: string) => {
    console.log("Editar", id);
  };

  const handleDelete = (id: string) => {
    console.log("Eliminar", id);
  };

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Egresos
          </h1>

          <p className="text-gray-500 mt-1">
            Control y seguimiento de todos los gastos registrados.
          </p>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-wrap gap-3">
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
            onClick={handleCreate}
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
            <Plus size={18} />
            Registrar Egreso
          </button>
        </div>
      </div>

      {/* =========================
          KPIs
      ========================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* EGRESOS MES */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Egresos del Mes</p>

              <h2 className="text-3xl font-bold mt-2">
                ${totalMes.toLocaleString()}
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

        {/* EGRESOS HOY */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Egresos de Hoy</p>

              <h2 className="text-3xl font-bold mt-2">
                ${totalHoy.toLocaleString()}
              </h2>

              <p className="text-gray-500 text-sm mt-2">Movimientos del día</p>
            </div>

            <div className="bg-orange-100 p-3 rounded-full">
              <Receipt className="text-orange-600" />
            </div>
          </div>
        </div>

        {/* PROMEDIO */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Promedio por Egreso</p>

              <h2 className="text-3xl font-bold mt-2">
                ${promedio.toFixed(0)}
              </h2>

              <p className="text-gray-500 text-sm mt-2">
                Basado en registros actuales
              </p>
            </div>

            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* PENDIENTES */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>

              <h2 className="text-3xl font-bold mt-2">{pendientes}</h2>

              <p className="text-yellow-600 text-sm mt-2">Requieren revisión</p>
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

      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Filtros de Búsqueda
            </h2>

            <p className="text-sm text-gray-500">
              Encuentra rápidamente los egresos registrados.
            </p>
          </div>

          <button
            className="
              px-4
              py-2
              border
              rounded-lg
              hover:bg-gray-100
              transition
            "
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          {/* BUSCAR */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Buscar
            </label>

            <input
              type="text"
              placeholder="Concepto o beneficiario..."
              className="
                w-full
                border
                rounded-lg
                px-4
                py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          {/* CATEGORÍA */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Categoría
            </label>

            <select
              className="
                w-full
                border
                rounded-lg
                px-4
                py-2
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            >
              <option>Todas</option>
              <option>Materiales</option>
              <option>Nómina</option>
              <option>Servicios</option>
              <option>Transporte</option>
              <option>Mantenimiento</option>
            </select>
          </div>

          {/* CUENTA */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Cuenta
            </label>

            <select
              className="
                w-full
                border
                rounded-lg
                px-4
                py-2
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            >
              <option>Todas</option>
              <option>Caja General</option>
              <option>Banco Pichincha</option>
              <option>Banco Guayaquil</option>
            </select>
          </div>

          {/* ESTADO */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Estado
            </label>

            <select
              className="
                w-full
                border
                rounded-lg
                px-4
                py-2
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            >
              <option>Todos</option>
              <option>Confirmado</option>
              <option>Pendiente</option>
              <option>Anulado</option>
            </select>
          </div>

          {/* DESDE */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Desde
            </label>

            <input
              type="date"
              className="
                w-full
                border
                rounded-lg
                px-4
                py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          {/* HASTA */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Hasta
            </label>

            <input
              type="date"
              className="
                w-full
                border
                rounded-lg
                px-4
                py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>
        </div>
      </div>

      {/* =========================
          HISTORIAL
      ========================= */}

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Historial de Egresos
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Registro completo de gastos del sistema.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {egresos.length} registros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Fecha
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Concepto
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Categoría
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Beneficiario
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Cuenta
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Método Pago
                </th>

                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Valor
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Usuario
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Estado
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {egresos.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500">
                    No existen egresos registrados.
                  </td>
                </tr>
              )}

              {egresos.map((egreso) => (
                <tr
                  key={egreso.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  {/* FECHA */}
                  <td className="px-4 py-4 text-sm">{egreso.fecha}</td>

                  {/* CONCEPTO */}
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-800">
                      {egreso.concepto}
                    </div>
                  </td>

                  {/* CATEGORIA */}
                  <td className="px-4 py-4 text-sm">{egreso.categoria}</td>

                  {/* BENEFICIARIO */}
                  <td className="px-4 py-4 text-sm">{egreso.beneficiario}</td>

                  {/* CUENTA */}
                  <td className="px-4 py-4 text-sm">{egreso.cuenta}</td>

                  {/* METODO */}
                  <td className="px-4 py-4 text-sm">{egreso.metodoPago}</td>

                  {/* VALOR */}
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-red-600">
                      $
                      {egreso.valor.toLocaleString("es-EC", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>

                  {/* USUARIO */}
                  <td className="px-4 py-4 text-sm">{egreso.usuario}</td>

                  {/* ESTADO */}
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        egreso.estado === "Confirmado"
                          ? "bg-green-100 text-green-700"
                          : egreso.estado === "Pendiente"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {egreso.estado}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-3">
                      {/* VER */}
                      <button
                        title="Ver detalle"
                        className="
                          p-2
                          rounded-lg
                          text-cyan-600
                          hover:bg-cyan-50
                          transition
                        "
                      >
                        <FaEye size={18} />
                      </button>

                      {/* EDITAR */}
                      <button
                        title="Editar"
                        className="
                          p-2
                          rounded-lg
                          text-blue-600
                          hover:bg-blue-50
                          transition
                        "
                      >
                        <FaEdit size={18} />
                      </button>

                      {/* ELIMINAR */}
                      <button
                        title="Eliminar"
                        className="
                          p-2
                          rounded-lg
                          text-red-600
                          hover:bg-red-50
                          transition
                        "
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* =========================
          FOOTER TABLA
      ========================= */}

        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* RESUMEN */}
            <div className="text-sm text-gray-600">
              Mostrando
              <span className="font-semibold mx-1">{egresos.length}</span>
              egresos registrados.
            </div>

            {/* PAGINACION */}
            <div className="flex items-center gap-2">
              <button
                className="
                px-3
                py-2
                border
                rounded-lg
                bg-white
                hover:bg-gray-100
                transition
              "
              >
                Anterior
              </button>

              <button
                className="
                w-10
                h-10
                rounded-lg
                bg-[var(--color-primary)]
                text-white
                font-semibold
              "
              >
                1
              </button>

              <button
                className="
                w-10
                h-10
                rounded-lg
                border
                bg-white
                hover:bg-gray-100
                transition
              "
              >
                2
              </button>

              <button
                className="
                w-10
                h-10
                rounded-lg
                border
                bg-white
                hover:bg-gray-100
                transition
              "
              >
                3
              </button>

              <button
                className="
                px-3
                py-2
                border
                rounded-lg
                bg-white
                hover:bg-gray-100
                transition
              "
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* =========================
          MODAL NUEVO EGRESO
      ========================= */}

      {false && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Registrar Egreso</h2>

              <button className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="text-gray-500">
              Aquí irá el formulario de registro de egresos.
            </div>
          </div>
        </div>
      )}

      {/* =========================
          MODAL EDITAR EGRESO
      ========================= */}

      {false && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Editar Egreso</h2>

              <button className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="text-gray-500">
              Aquí irá el formulario de edición.
            </div>
          </div>
        </div>
      )}
      <tr>
        <td colSpan={10} className="py-14">
          <div className="flex flex-col items-center justify-center">
            <Wallet size={50} className="text-gray-300 mb-4" />

            <p className="font-semibold text-gray-600">
              No existen egresos registrados
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Comienza registrando el primer gasto del sistema.
            </p>
          </div>
        </td>
      </tr>
    </div>
  );
}

export default EgresosPage;
