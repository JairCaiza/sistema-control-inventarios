import { useEffect, useMemo, useState } from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
  Wallet,
  DollarSign,
  TrendingDown,
  Receipt,
  FileDown,
  Plus,
  RotateCcw,
} from "lucide-react";

import { FaEye } from "react-icons/fa";

import RegistrarEgresoModal from "../components/RegistrarEgresoModal";

import { getEgresos, type Egreso } from "../service/egresoService";

import {
  getCuentas,
  type CuentaFinanciera,
} from "../../cuentas/service/cuentaService";

/* =====================================================
   UTILIDADES
===================================================== */

const obtenerFechaActual = (): string => {
  const hoy = new Date();

  const fechaLocal = new Date(
    hoy.getTime() - hoy.getTimezoneOffset() * 60 * 1000,
  );

  return fechaLocal.toISOString().split("T")[0];
};

const obtenerPrimerDiaMes = (): string => {
  const hoy = new Date();

  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const fechaLocal = new Date(
    primerDia.getTime() - primerDia.getTimezoneOffset() * 60 * 1000,
  );

  return fechaLocal.toISOString().split("T")[0];
};

const formatearMoneda = (valor: number | string | null | undefined): string => {
  return Number(valor || 0).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
};

const formatearFecha = (valor: string | null | undefined): string => {
  if (!valor) {
    return "—";
  }

  const fecha = valor.substring(0, 10);
  const [anio, mes, dia] = fecha.split("-");

  if (!anio || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${anio}`;
};

const formatearFechaHora = (valor: string | null | undefined): string => {
  if (!valor) {
    return "—";
  }

  return new Date(valor).toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

function EgresosPage() {
  const [egresos, setEgresos] = useState<Egreso[]>([]);

  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);

  const [busqueda, setBusqueda] = useState("");

  const [cuentaFiltro, setCuentaFiltro] = useState("");

  const [origenFiltro, setOrigenFiltro] = useState("");

  const [fechaDesde, setFechaDesde] = useState("");

  const [fechaHasta, setFechaHasta] = useState("");

  /* =====================================================
     CARGAR DATOS
  ===================================================== */

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const [egresosData, cuentasData] = await Promise.all([
        getEgresos(),
        getCuentas(),
      ]);

      setEgresos(egresosData);
      setCuentas(cuentasData);
    } catch (error: unknown) {
      let mensaje = "No se pudieron cargar los egresos.";

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
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  /* =====================================================
     FILTRADO
  ===================================================== */

  const egresosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return egresos.filter((egreso) => {
      const descripcion = egreso.descripcion?.toLowerCase().trim() ?? "";

      const cuenta = egreso.cuenta_nombre?.toLowerCase().trim() ?? "";

      const origen = egreso.origen_modulo?.toLowerCase().trim() ?? "";

      const referencia = egreso.referencia_id?.toLowerCase().trim() ?? "";

      const coincideBusqueda =
        !texto ||
        descripcion.includes(texto) ||
        cuenta.includes(texto) ||
        origen.includes(texto) ||
        referencia.includes(texto) ||
        egreso.id.toLowerCase().includes(texto);

      const coincideCuenta = !cuentaFiltro || egreso.cuenta_id === cuentaFiltro;

      const coincideOrigen =
        !origenFiltro || egreso.origen_modulo === origenFiltro;

      const fecha = egreso.fecha?.substring(0, 10) ?? "";

      const coincideDesde = !fechaDesde || fecha >= fechaDesde;

      const coincideHasta = !fechaHasta || fecha <= fechaHasta;

      return (
        coincideBusqueda &&
        coincideCuenta &&
        coincideOrigen &&
        coincideDesde &&
        coincideHasta
      );
    });
  }, [egresos, busqueda, cuentaFiltro, origenFiltro, fechaDesde, fechaHasta]);

  /* =====================================================
     KPIs
  ===================================================== */

  const indicadores = useMemo(() => {
    const hoy = obtenerFechaActual();
    const primerDiaMes = obtenerPrimerDiaMes();

    const registrosMes = egresos.filter((egreso) => {
      const fecha = egreso.fecha.substring(0, 10);

      return fecha >= primerDiaMes && fecha <= hoy;
    });

    const registrosHoy = egresos.filter(
      (egreso) => egreso.fecha.substring(0, 10) === hoy,
    );

    const totalMes = registrosMes.reduce(
      (acumulado, egreso) => acumulado + Number(egreso.monto || 0),
      0,
    );

    const totalHoy = registrosHoy.reduce(
      (acumulado, egreso) => acumulado + Number(egreso.monto || 0),
      0,
    );

    const totalGeneral = egresos.reduce(
      (acumulado, egreso) => acumulado + Number(egreso.monto || 0),
      0,
    );

    const promedio = egresos.length > 0 ? totalGeneral / egresos.length : 0;

    return {
      totalMes,
      totalHoy,
      promedio,
      cantidad: egresos.length,
    };
  }, [egresos]);

  const totalFiltrado = useMemo(() => {
    return egresosFiltrados.reduce(
      (acumulado, egreso) => acumulado + Number(egreso.monto || 0),
      0,
    );
  }, [egresosFiltrados]);

  const origenesDisponibles = useMemo(() => {
    return Array.from(
      new Set(
        egresos
          .map((egreso) => egreso.origen_modulo)
          .filter((origen): origen is string => Boolean(origen)),
      ),
    ).sort();
  }, [egresos]);

  /* =====================================================
     ACCIONES
  ===================================================== */

  const limpiarFiltros = () => {
    setBusqueda("");
    setCuentaFiltro("");
    setOrigenFiltro("");
    setFechaDesde("");
    setFechaHasta("");
  };

  const verDetalle = async (egreso: Egreso) => {
    await Swal.fire({
      title: "Detalle del egreso",
      icon: "info",
      html: `
        <div style="text-align:left; line-height:1.9">
          <p>
            <strong>Cuenta:</strong>
            ${egreso.cuenta_nombre ?? "—"}
          </p>

          <p>
            <strong>Tipo de cuenta:</strong>
            ${egreso.cuenta_tipo ?? "—"}
          </p>

          <p>
            <strong>Fecha:</strong>
            ${formatearFecha(egreso.fecha)}
          </p>

          <p>
            <strong>Descripción:</strong>
            ${egreso.descripcion ?? "—"}
          </p>

          <p>
            <strong>Monto:</strong>
            ${formatearMoneda(egreso.monto)}
          </p>

          <p>
            <strong>Origen:</strong>
            ${egreso.origen_modulo ?? "manual"}
          </p>

          <p>
            <strong>Referencia:</strong>
            ${egreso.referencia_id ?? "—"}
          </p>

          <p>
            <strong>Fecha de registro:</strong>
            ${formatearFechaHora(egreso.fecha_creacion)}
          </p>
        </div>
      `,
      confirmButtonText: "Cerrar",
    });
  };

  const exportarPDF = async () => {
    await Swal.fire({
      icon: "info",
      title: "Exportación pendiente",
      text: "La exportación PDF se implementará en el módulo de reportes financieros.",
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Egresos
          </h1>

          <p className="mt-1 text-gray-500">
            Control y seguimiento de las salidas de dinero registradas.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportarPDF}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-red-600
              px-4
              py-2
              text-white
              transition
              hover:bg-red-700
            "
          >
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-[var(--color-primary)]
              px-4
              py-2
              text-white
              transition
              hover:opacity-90
            "
          >
            <Plus size={18} />
            Registrar Egreso
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div
        className="
          grid
          grid-cols-1
          gap-6
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Egresos del Mes</p>

              <h2 className="mt-2 text-3xl font-bold">
                {formatearMoneda(indicadores.totalMes)}
              </h2>

              <p className="mt-2 text-sm text-red-600">
                Acumulado del mes actual
              </p>
            </div>

            <div className="rounded-full bg-red-100 p-3">
              <TrendingDown className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Egresos de Hoy</p>

              <h2 className="mt-2 text-3xl font-bold">
                {formatearMoneda(indicadores.totalHoy)}
              </h2>

              <p className="mt-2 text-sm text-gray-500">Movimientos del día</p>
            </div>

            <div className="rounded-full bg-orange-100 p-3">
              <Receipt className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Promedio por Egreso</p>

              <h2 className="mt-2 text-3xl font-bold">
                {formatearMoneda(indicadores.promedio)}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Basado en registros actuales
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
              <p className="text-sm text-gray-500">Transacciones</p>

              <h2 className="mt-2 text-3xl font-bold">
                {indicadores.cantidad}
              </h2>

              <p className="mt-2 text-sm text-gray-500">Egresos registrados</p>
            </div>

            <div className="rounded-full bg-gray-100 p-3">
              <Wallet className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="rounded-xl border bg-white p-6 shadow">
        <div
          className="
            mb-6
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Filtros de Búsqueda
            </h2>

            <p className="text-sm text-gray-500">
              Encuentra rápidamente los egresos registrados.
            </p>
          </div>

          <button
            type="button"
            onClick={limpiarFiltros}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              px-4
              py-2
              transition
              hover:bg-gray-100
            "
          >
            <RotateCcw size={17} />
            Limpiar filtros
          </button>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-5
          "
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Buscar
            </label>

            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Descripción o referencia..."
              className="
                w-full
                rounded-lg
                border
                px-4
                py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Cuenta
            </label>

            <select
              value={cuentaFiltro}
              onChange={(event) => setCuentaFiltro(event.target.value)}
              className="
                w-full
                rounded-lg
                border
                bg-white
                px-4
                py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
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
              Origen
            </label>

            <select
              value={origenFiltro}
              onChange={(event) => setOrigenFiltro(event.target.value)}
              className="
                w-full
                rounded-lg
                border
                bg-white
                px-4
                py-2
                capitalize
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            >
              <option value="">Todos los orígenes</option>

              {origenesDisponibles.map((origen) => (
                <option key={origen} value={origen}>
                  {origen}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Desde
            </label>

            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              className="
                w-full
                rounded-lg
                border
                px-4
                py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Hasta
            </label>

            <input
              type="date"
              value={fechaHasta}
              onChange={(event) => setFechaHasta(event.target.value)}
              className="
                w-full
                rounded-lg
                border
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

      {/* HISTORIAL */}
      <div
        className="
          overflow-hidden
          rounded-xl
          border
          bg-white
          shadow
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            px-6
            py-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Historial de Egresos
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Registro completo de salidas de dinero.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {egresosFiltrados.length} registros
          </span>
        </div>

        {cargando ? (
          <div className="py-14 text-center text-gray-500">
            Cargando egresos...
          </div>
        ) : egresosFiltrados.length === 0 ? (
          <div className="py-14">
            <div className="flex flex-col items-center justify-center">
              <Wallet size={50} className="mb-4 text-gray-300" />

              <p className="font-semibold text-gray-600">
                No existen egresos registrados
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Registra el primer egreso financiero del sistema.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Fecha
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Descripción
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Cuenta
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Origen
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Referencia
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Monto
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Registrado
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {egresosFiltrados.map((egreso) => (
                  <tr
                    key={egreso.id}
                    className="
                        border-t
                        transition
                        hover:bg-gray-50
                      "
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      {formatearFecha(egreso.fecha)}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800">
                        {egreso.descripcion || "Egreso sin descripción"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        ID: {egreso.id.substring(0, 8)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800">
                        {egreso.cuenta_nombre || "—"}
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {egreso.cuenta_tipo || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm capitalize">
                      {egreso.origen_modulo || "manual"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {egreso.referencia_id
                        ? egreso.referencia_id.substring(0, 8)
                        : "—"}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-red-600">
                        -{formatearMoneda(egreso.monto)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {formatearFechaHora(egreso.fecha_creacion)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          title="Ver detalle"
                          onClick={() => void verDetalle(egreso)}
                          className="
                              rounded-lg
                              p-2
                              text-cyan-600
                              transition
                              hover:bg-cyan-50
                            "
                        >
                          <FaEye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t bg-gray-50 px-6 py-4">
          <div
            className="
              flex
              flex-col
              gap-3
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <p className="text-sm text-gray-600">
              Mostrando{" "}
              <span className="font-semibold">{egresosFiltrados.length}</span>{" "}
              egresos registrados.
            </p>

            <p className="text-sm text-gray-600">
              Total mostrado:{" "}
              <span className="font-bold text-red-600">
                {formatearMoneda(totalFiltrado)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <RegistrarEgresoModal
        open={modalAbierto}
        cuentas={cuentas}
        onClose={() => setModalAbierto(false)}
        onRegistered={cargarDatos}
      />
    </div>
  );
}

export default EgresosPage;
