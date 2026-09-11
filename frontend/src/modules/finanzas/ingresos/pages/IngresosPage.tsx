import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  Plus,
  FileDown,
  TrendingUp,
  DollarSign,
  CalendarDays,
  Receipt,
  RotateCcw,
} from "lucide-react";

import { FaEye } from "react-icons/fa";

import RegistrarIngresoModal from "../components/RegistrarIngresoModal";

import { getIngresos, type Transaccion } from "../services/transaccionService";

import {
  getCuentas,
  type CuentaFinanciera,
} from "../../cuentas/service/cuentaService";

/* =====================================================
   FECHA LOCAL ACTUAL
===================================================== */
const obtenerFechaActual = (): string => {
  const hoy = new Date();

  const fechaLocal = new Date(
    hoy.getTime() - hoy.getTimezoneOffset() * 60 * 1000,
  );

  return fechaLocal.toISOString().split("T")[0];
};

/* =====================================================
   PRIMER DÍA DEL MES
===================================================== */
const obtenerPrimerDiaMes = (): string => {
  const hoy = new Date();

  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const fechaLocal = new Date(
    primerDia.getTime() - primerDia.getTimezoneOffset() * 60 * 1000,
  );

  return fechaLocal.toISOString().split("T")[0];
};

/* =====================================================
   FORMATEAR DINERO
===================================================== */
const formatMoney = (value: number | string | null | undefined): string => {
  return Number(value || 0).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
};

/* =====================================================
   FORMATEAR FECHA SIN CAMBIO DE ZONA HORARIA
===================================================== */
const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";

  const fecha = value.substring(0, 10);
  const [anio, mes, dia] = fecha.split("-");

  if (!anio || !mes || !dia) {
    return value;
  }

  return `${dia}/${mes}/${anio}`;
};

/* =====================================================
   FORMATEAR FECHA Y HORA
===================================================== */
const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";

  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

function IngresosPage() {
  const [ingresos, setIngresos] = useState<Transaccion[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [cuentaFiltro, setCuentaFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  /* =====================================================
     CARGAR DATOS REALES
  ===================================================== */
  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [ingresosData, cuentasData] = await Promise.all([
        getIngresos(),
        getCuentas(),
      ]);

      setIngresos(ingresosData);
      setCuentas(cuentasData);
    } catch (error: unknown) {
      let mensaje = "No se pudieron cargar los ingresos.";

      if (axios.isAxiosError(error)) {
        mensaje =
          error.response?.data?.message ??
          error.response?.data?.error ??
          mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: mensaje,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  /* =====================================================
     FILTRAR INGRESOS
  ===================================================== */
  const ingresosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return ingresos.filter((ingreso) => {
      const descripcion = ingreso.descripcion?.toLowerCase() ?? "";

      const cuentaNombre = ingreso.cuenta_nombre?.toLowerCase() ?? "";

      const origen = ingreso.origen_modulo?.toLowerCase() ?? "";

      const referencia = ingreso.referencia_id?.toLowerCase() ?? "";

      const coincideBusqueda =
        !texto ||
        descripcion.includes(texto) ||
        cuentaNombre.includes(texto) ||
        origen.includes(texto) ||
        referencia.includes(texto) ||
        ingreso.id.toLowerCase().includes(texto);

      const coincideCuenta =
        !cuentaFiltro || ingreso.cuenta_id === cuentaFiltro;

      const fechaIngreso = ingreso.fecha?.substring(0, 10) ?? "";

      const coincideDesde = !fechaDesde || fechaIngreso >= fechaDesde;

      const coincideHasta = !fechaHasta || fechaIngreso <= fechaHasta;

      return (
        coincideBusqueda && coincideCuenta && coincideDesde && coincideHasta
      );
    });
  }, [ingresos, busqueda, cuentaFiltro, fechaDesde, fechaHasta]);

  /* =====================================================
     INDICADORES
  ===================================================== */
  const resumen = useMemo(() => {
    const hoy = obtenerFechaActual();
    const primerDiaMes = obtenerPrimerDiaMes();

    const ingresosMes = ingresos.filter((ingreso) => {
      const fecha = ingreso.fecha?.substring(0, 10) ?? "";

      return fecha >= primerDiaMes && fecha <= hoy;
    });

    const ingresosHoy = ingresos.filter(
      (ingreso) => ingreso.fecha?.substring(0, 10) === hoy,
    );

    const totalMes = ingresosMes.reduce(
      (acumulado, ingreso) => acumulado + Number(ingreso.monto || 0),
      0,
    );

    const totalHoy = ingresosHoy.reduce(
      (acumulado, ingreso) => acumulado + Number(ingreso.monto || 0),
      0,
    );

    const diaActual = new Date().getDate();

    const promedioDiario = diaActual > 0 ? totalMes / diaActual : 0;

    return {
      ingresosMes: totalMes,
      ingresosHoy: totalHoy,
      promedioDiario,
      transacciones: ingresos.length,
    };
  }, [ingresos]);

  const totalFiltrado = useMemo(() => {
    return ingresosFiltrados.reduce(
      (acumulado, ingreso) => acumulado + Number(ingreso.monto || 0),
      0,
    );
  }, [ingresosFiltrados]);

  /* =====================================================
     LIMPIAR FILTROS
  ===================================================== */
  const limpiarFiltros = () => {
    setBusqueda("");
    setCuentaFiltro("");
    setFechaDesde("");
    setFechaHasta("");
  };

  /* =====================================================
     VER DETALLE
  ===================================================== */
  const handleView = async (ingreso: Transaccion) => {
    await Swal.fire({
      icon: "info",
      title: "Detalle del ingreso",
      html: `
        <div style="text-align:left; line-height:1.8">
          <p>
            <strong>Cuenta:</strong>
            ${ingreso.cuenta_nombre ?? "—"}
          </p>

          <p>
            <strong>Fecha:</strong>
            ${formatDate(ingreso.fecha)}
          </p>

          <p>
            <strong>Monto:</strong>
            ${formatMoney(ingreso.monto)}
          </p>

          <p>
            <strong>Descripción:</strong>
            ${ingreso.descripcion ?? "—"}
          </p>

          <p>
            <strong>Origen:</strong>
            ${ingreso.origen_modulo ?? "manual"}
          </p>

          <p>
            <strong>Referencia:</strong>
            ${ingreso.referencia_id ?? "—"}
          </p>

          <p>
            <strong>Registrado:</strong>
            ${formatDateTime(ingreso.fecha_creacion)}
          </p>
        </div>
      `,
      confirmButtonText: "Cerrar",
    });
  };

  /* =====================================================
     EXPORTAR PDF PENDIENTE
  ===================================================== */
  const handleExportarPDF = async () => {
    await Swal.fire({
      icon: "info",
      title: "Exportación PDF",
      text: "La exportación del historial se implementará en la sección de reportes financieros.",
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ingresos</h1>

          <p className="mt-1 text-gray-500">
            Gestión y control de ingresos registrados en el sistema.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportarPDF}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition hover:opacity-90"
          >
            <Plus size={18} />
            Nuevo ingreso
          </button>
        </div>
      </div>

      {/* INDICADORES */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ingresos del mes</p>

              <h2 className="mt-2 text-3xl font-bold">
                {formatMoney(resumen.ingresosMes)}
              </h2>

              <p className="mt-2 text-sm text-green-600">
                Acumulado del mes actual
              </p>
            </div>

            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ingresos de hoy</p>

              <h2 className="mt-2 text-3xl font-bold">
                {formatMoney(resumen.ingresosHoy)}
              </h2>

              <p className="mt-2 text-sm text-blue-600">
                Actualizado con los registros
              </p>
            </div>

            <div className="rounded-full bg-blue-100 p-3">
              <DollarSign className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Promedio diario</p>

              <h2 className="mt-2 text-3xl font-bold">
                {formatMoney(resumen.promedioDiario)}
              </h2>

              <p className="mt-2 text-sm text-purple-600">
                Basado en el mes actual
              </p>
            </div>

            <div className="rounded-full bg-purple-100 p-3">
              <CalendarDays className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transacciones</p>

              <h2 className="mt-2 text-3xl font-bold">
                {resumen.transacciones}
              </h2>

              <p className="mt-2 text-sm text-orange-600">
                Ingresos registrados
              </p>
            </div>

            <div className="rounded-full bg-orange-100 p-3">
              <Receipt className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="rounded-xl border bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>

            <p className="mt-1 text-sm text-gray-500">
              Filtra ingresos por descripción, cuenta o fechas.
            </p>
          </div>

          <button
            onClick={limpiarFiltros}
            className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 transition hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Buscar
            </label>

            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Descripción o referencia..."
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Cuenta
            </label>

            <select
              value={cuentaFiltro}
              onChange={(event) => setCuentaFiltro(event.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Todas las cuentas</option>

              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Fecha desde
            </label>

            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Fecha hasta
            </label>

            <input
              type="date"
              value={fechaHasta}
              onChange={(event) => setFechaHasta(event.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex flex-col gap-3 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Historial de ingresos
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Ingresos reales registrados en la tabla de transacciones.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {ingresosFiltrados.length} registros
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Cargando ingresos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Fecha
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Descripción
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Cuenta
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Origen
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Referencia
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Monto
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Registrado
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {ingresosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">
                      No existen ingresos registrados.
                    </td>
                  </tr>
                )}

                {ingresosFiltrados.map((ingreso) => (
                  <tr
                    key={ingreso.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      {formatDate(ingreso.fecha)}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800">
                        {ingreso.descripcion ?? "Ingreso sin descripción"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {ingreso.id.substring(0, 8)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {ingreso.cuenta_nombre ?? "—"}
                      </p>

                      {ingreso.cuenta_tipo && (
                        <p className="text-xs capitalize text-gray-500">
                          {ingreso.cuenta_tipo}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 capitalize">
                      {ingreso.origen_modulo ?? "manual"}
                    </td>

                    <td className="px-4 py-4">
                      {ingreso.referencia_id
                        ? ingreso.referencia_id.substring(0, 8)
                        : "—"}
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-green-600">
                      {formatMoney(ingreso.monto)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {formatDateTime(ingreso.fecha_creacion)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <button
                          title="Ver detalle"
                          onClick={() => handleView(ingreso)}
                          className="text-cyan-600 transition hover:scale-110"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t bg-gray-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <strong>{ingresosFiltrados.length}</strong> registros.
          </p>

          <p className="text-sm text-gray-600">
            Total mostrado:{" "}
            <strong className="text-green-700">
              {formatMoney(totalFiltrado)}
            </strong>
          </p>
        </div>
      </div>

      {/* RESUMEN DEL LISTADO */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total mostrado</p>

          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {formatMoney(totalFiltrado)}
          </h3>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Registros mostrados</p>

          <h3 className="mt-2 text-2xl font-bold">
            {ingresosFiltrados.length}
          </h3>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Cuentas utilizadas</p>

          <h3 className="mt-2 text-2xl font-bold text-blue-600">
            {
              new Set(ingresosFiltrados.map((ingreso) => ingreso.cuenta_id))
                .size
            }
          </h3>
        </div>
      </div>

      {/* MODAL DE REGISTRO */}
      <RegistrarIngresoModal
        open={modalOpen}
        cuenta={null}
        cuentas={cuentas.filter((cuenta) => cuenta.activo)}
        onClose={() => setModalOpen(false)}
        onRegistered={cargarDatos}
      />
    </div>
  );
}

export default IngresosPage;
