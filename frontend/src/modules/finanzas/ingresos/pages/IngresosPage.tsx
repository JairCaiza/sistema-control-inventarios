import { useState } from "react";

import Swal from "sweetalert2";

import {
  Plus,
  FileDown,
  TrendingUp,
  DollarSign,
  CalendarDays,
  Receipt,
} from "lucide-react";

import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

interface Ingreso {
  id: string;
  fecha: string;
  concepto: string;
  cuenta: string;
  metodo_pago: string;
  referencia: string;
  valor: number;
  usuario: string;
  estado: "Confirmado" | "Pendiente" | "Anulado";
}

function IngresosPage() {
  /* =========================
     DATOS FICTICIOS
  ========================= */

  const [ingresos] = useState<Ingreso[]>([
    {
      id: "ING-001",
      fecha: "12/06/2026",
      concepto: "Pago contrato #025",
      cuenta: "Banco Pichincha",
      metodo_pago: "Transferencia",
      referencia: "TRX001",
      valor: 2500,
      usuario: "Administrador",
      estado: "Confirmado",
    },
    {
      id: "ING-002",
      fecha: "11/06/2026",
      concepto: "Venta de activo",
      cuenta: "Caja Chica",
      metodo_pago: "Efectivo",
      referencia: "REC145",
      valor: 350,
      usuario: "María López",
      estado: "Confirmado",
    },
    {
      id: "ING-003",
      fecha: "10/06/2026",
      concepto: "Abono cliente",
      cuenta: "Produbanco",
      metodo_pago: "Cheque",
      referencia: "CH002",
      valor: 1100,
      usuario: "Carlos Pérez",
      estado: "Pendiente",
    },
    {
      id: "ING-004",
      fecha: "09/06/2026",
      concepto: "Pago alquiler maquinaria",
      cuenta: "Banco Guayaquil",
      metodo_pago: "Transferencia",
      referencia: "TRX058",
      valor: 4200,
      usuario: "Administrador",
      estado: "Confirmado",
    },
    {
      id: "ING-005",
      fecha: "08/06/2026",
      concepto: "Ingreso anulado",
      cuenta: "Caja Chica",
      metodo_pago: "Efectivo",
      referencia: "REC102",
      valor: 180,
      usuario: "María López",
      estado: "Anulado",
    },
  ]);

  /* =========================
     KPIs FICTICIOS
  ========================= */

  const resumen = {
    ingresosMes: 18900,
    ingresosHoy: 1250,
    promedioDiario: 630,
    transacciones: ingresos.length,
  };

  /* =========================
     ACCIONES (PLANTILLA)
  ========================= */

  const handleNuevoIngreso = () => {
    Swal.fire("Plantilla", "Aquí se abrirá el modal de nuevo ingreso.", "info");
  };

  const handleExportarPDF = () => {
    Swal.fire("Plantilla", "Aquí irá la exportación PDF.", "info");
  };

  const handleView = (id: string) => {
    Swal.fire("Detalle", `Ver detalle del ingreso ${id}`, "info");
  };

  const handleEdit = (id: string) => {
    Swal.fire("Editar", `Editar ingreso ${id}`, "info");
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: "¿Eliminar ingreso?",
      text: `Ingreso ${id}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
  };

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ingresos</h1>

          <p className="text-gray-500 mt-1">
            Gestión y control de ingresos registrados en el sistema.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportarPDF}
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
            onClick={handleNuevoIngreso}
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
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* =========================
          KPIs
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* INGRESOS MES */}
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

        {/* INGRESOS HOY */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Ingresos Hoy</p>

              <h2 className="text-3xl font-bold mt-2">
                ${resumen.ingresosHoy.toLocaleString()}
              </h2>

              <p className="text-blue-600 text-sm mt-2">
                Actualizado en tiempo real
              </p>
            </div>

            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* PROMEDIO */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Promedio Diario</p>

              <h2 className="text-3xl font-bold mt-2">
                ${resumen.promedioDiario.toLocaleString()}
              </h2>

              <p className="text-purple-600 text-sm mt-2">
                Basado en el mes actual
              </p>
            </div>

            <div className="bg-purple-100 p-3 rounded-full">
              <CalendarDays className="text-purple-600" />
            </div>
          </div>
        </div>

        {/* TRANSACCIONES */}
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Transacciones</p>

              <h2 className="text-3xl font-bold mt-2">
                {resumen.transacciones}
              </h2>

              <p className="text-orange-600 text-sm mt-2">
                Registros encontrados
              </p>
            </div>

            <div className="bg-orange-100 p-3 rounded-full">
              <Receipt className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      {/* =========================
          FILTROS ERP
      ========================= */}
      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>

            <p className="text-sm text-gray-500 mt-1">
              Filtra ingresos por concepto, cuenta o fechas.
            </p>
          </div>

          <button
            className="
              px-4
              py-2
              rounded-lg
              border
              hover:bg-gray-50
              transition
            "
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {/* BUSCADOR */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Buscar
            </label>

            <input
              type="text"
              placeholder="Concepto o referencia..."
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
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            >
              <option>Todas</option>
              <option>Banco Pichincha</option>
              <option>Produbanco</option>
              <option>Banco Guayaquil</option>
              <option>Caja Chica</option>
            </select>
          </div>

          {/* METODO */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Método Pago
            </label>

            <select
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
            >
              <option>Todos</option>
              <option>Efectivo</option>
              <option>Transferencia</option>
              <option>Cheque</option>
            </select>
          </div>

          {/* FECHA DESDE */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Fecha Desde
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

          {/* FECHA HASTA */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Fecha Hasta
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
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Historial de Ingresos
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Listado de ingresos registrados en el sistema.
            </p>
          </div>

          <span
            className="
              px-3
              py-1
              rounded-full
              bg-gray-100
              text-sm
              text-gray-700
            "
          >
            {ingresos.length} registros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Fecha
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Concepto
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Cuenta
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Método
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Referencia
                </th>

                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Valor
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Registrado por
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Estado
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {ingresos.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-500">
                    No existen ingresos registrados.
                  </td>
                </tr>
              )}

              {ingresos.map((ingreso) => (
                <tr
                  key={ingreso.id}
                  className="
                    border-t
                    hover:bg-gray-50
                    transition
                  "
                >
                  {/* FECHA */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {ingreso.fecha}
                  </td>

                  {/* CONCEPTO */}
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-800">
                        {ingreso.concepto}
                      </p>

                      <p className="text-xs text-gray-500">{ingreso.id}</p>
                    </div>
                  </td>

                  {/* CUENTA */}
                  <td className="px-4 py-4">{ingreso.cuenta}</td>

                  {/* METODO */}
                  <td className="px-4 py-4">{ingreso.metodo_pago}</td>

                  {/* REFERENCIA */}
                  <td className="px-4 py-4">{ingreso.referencia}</td>

                  {/* VALOR */}
                  <td
                    className="
                      px-4
                      py-4
                      text-right
                      font-bold
                      text-green-600
                    "
                  >
                    ${ingreso.valor.toLocaleString()}
                  </td>

                  {/* USUARIO */}
                  <td className="px-4 py-4">{ingreso.usuario}</td>

                  {/* ESTADO */}
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-medium
                        ${
                          ingreso.estado === "Confirmado"
                            ? "bg-green-100 text-green-700"
                            : ingreso.estado === "Pendiente"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }
                      `}
                    >
                      {ingreso.estado}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-4 py-4">
                    <div className="flex justify-center items-center gap-4">
                      {/* VER */}
                      <button
                        title="Ver detalle"
                        onClick={() => handleView(ingreso.id)}
                        className="
                          text-cyan-600
                          hover:scale-110
                          transition
                        "
                      >
                        <FaEye />
                      </button>

                      {/* EDITAR */}
                      <button
                        title="Editar"
                        onClick={() => handleEdit(ingreso.id)}
                        className="
                          text-blue-600
                          hover:scale-110
                          transition
                        "
                      >
                        <FaEdit />
                      </button>

                      {/* ELIMINAR */}
                      <button
                        title="Eliminar"
                        onClick={() => handleDelete(ingreso.id)}
                        className="
                          text-red-600
                          hover:scale-110
                          transition
                        "
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
        {/* =========================
            PAGINACIÓN
        ========================= */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Mostrando <strong>1</strong> a <strong>{ingresos.length}</strong>{" "}
            registros.
          </p>

          <div className="flex items-center gap-2">
            <button
              className="
                px-3 py-2
                border
                rounded-lg
                hover:bg-gray-100
                transition
              "
            >
              Anterior
            </button>

            <button
              className="
                px-4 py-2
                rounded-lg
                bg-[var(--color-primary)]
                text-white
              "
            >
              1
            </button>

            <button
              className="
                px-4 py-2
                border
                rounded-lg
                hover:bg-gray-100
                transition
              "
            >
              2
            </button>

            <button
              className="
                px-4 py-2
                border
                rounded-lg
                hover:bg-gray-100
                transition
              "
            >
              3
            </button>

            <button
              className="
                px-3 py-2
                border
                rounded-lg
                hover:bg-gray-100
                transition
              "
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* =========================
          RESUMEN DEL LISTADO
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <p className="text-sm text-gray-500">Total Mostrado</p>

          <h3 className="text-2xl font-bold mt-2">
            $
            {ingresos
              .reduce((acc, item) => acc + item.valor, 0)
              .toLocaleString()}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <p className="text-sm text-gray-500">Confirmados</p>

          <h3 className="text-2xl font-bold mt-2 text-green-600">
            {ingresos.filter((i) => i.estado === "Confirmado").length}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <p className="text-sm text-gray-500">Pendientes</p>

          <h3 className="text-2xl font-bold mt-2 text-yellow-600">
            {ingresos.filter((i) => i.estado === "Pendiente").length}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <p className="text-sm text-gray-500">Anulados</p>

          <h3 className="text-2xl font-bold mt-2 text-red-600">
            {ingresos.filter((i) => i.estado === "Anulado").length}
          </h3>
        </div>
      </div>

      {/* =========================
          ACCESOS RÁPIDOS
      ========================= */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Accesos Rápidos
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            <p className="font-medium">Nuevo Ingreso</p>
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
            <div className="text-3xl mb-2">📄</div>

            <p className="font-medium">Exportar PDF</p>
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
            <div className="text-3xl mb-2">🖨️</div>

            <p className="font-medium">Imprimir</p>
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
            <div className="text-3xl mb-2">📊</div>

            <p className="font-medium">Reporte Mensual</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default IngresosPage;
