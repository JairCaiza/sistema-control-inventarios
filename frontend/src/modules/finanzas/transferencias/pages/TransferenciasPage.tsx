import { useCallback, useEffect, useMemo, useState } from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
  ArrowLeftRight,
  FileDown,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import { FaEye } from "react-icons/fa";

/*
 * Ajusta estas rutas si tus archivos se encuentran
 * en otra ubicación.
 */
import RegistrarTransferenciaModal from "../components/RegistrarTransferenciaModal";

import {
  getTransferencias,
  type Transferencia,
} from "../service/transferenciaService";

import {
  getCuentas,
  type CuentaFinanciera,
} from "../../cuentas/service/cuentaService";

/* =====================================================
   TIPOS AUXILIARES
===================================================== */

interface FiltrosFormulario {
  busqueda: string;
  cuenta_id: string;
  fecha_inicio: string;
  fecha_fin: string;
}

const filtrosIniciales: FiltrosFormulario = {
  busqueda: "",
  cuenta_id: "",
  fecha_inicio: "",
  fecha_fin: "",
};

/* =====================================================
   FUNCIONES AUXILIARES
===================================================== */

const formatearMoneda = (valor: number | string | null | undefined): string =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));

const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaNormalizada = fecha.includes("T") ? fecha : `${fecha}T00:00:00`;

  const objetoFecha = new Date(fechaNormalizada);

  if (Number.isNaN(objetoFecha.getTime())) {
    return fecha;
  }

  return objetoFecha.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const escaparCsv = (valor: string | number | null | undefined): string => {
  const texto = String(valor ?? "");

  return `"${texto.replace(/"/g, '""')}"`;
};

/* =====================================================
   COMPONENTE
===================================================== */

function TransferenciasPage() {
  /* ===================================================
     ESTADOS
  =================================================== */

  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);

  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosFormulario>(filtrosIniciales);

  /* ===================================================
     CARGAR TRANSFERENCIAS Y CUENTAS
  =================================================== */

  const cargarDatos = useCallback(async (mostrarCargaPrincipal = true) => {
    try {
      if (mostrarCargaPrincipal) {
        setCargando(true);
      } else {
        setRecargando(true);
      }

      const [transferenciasResponse, cuentasResponse] = await Promise.all([
        getTransferencias(),
        getCuentas(),
      ]);

      setTransferencias(
        Array.isArray(transferenciasResponse) ? transferenciasResponse : [],
      );

      /*
       * Este bloque permite trabajar tanto si getCuentas()
       * devuelve directamente un arreglo como si devuelve
       * un objeto con data.
       */
      if (Array.isArray(cuentasResponse)) {
        setCuentas(cuentasResponse);
      } else {
        const respuesta = cuentasResponse as unknown as {
          data?: CuentaFinanciera[];
        };

        setCuentas(Array.isArray(respuesta.data) ? respuesta.data : []);
      }
    } catch (error) {
      let mensaje = "No se pudieron cargar las transferencias";

      if (axios.isAxiosError(error)) {
        mensaje = error.response?.data?.message ?? mensaje;
      } else if (error instanceof Error) {
        mensaje = error.message;
      }

      await Swal.fire({
        icon: "error",
        title: "Error al cargar",
        text: mensaje,
        confirmButtonText: "Aceptar",
      });
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  /* ===================================================
     TRANSFERENCIAS FILTRADAS
  =================================================== */

  const transferenciasFiltradas = useMemo(() => {
    const textoBusqueda = filtros.busqueda.trim().toLowerCase();

    return transferencias.filter((transferencia) => {
      const coincideBusqueda =
        !textoBusqueda ||
        transferencia.descripcion?.toLowerCase().includes(textoBusqueda) ||
        transferencia.cuenta_origen_nombre
          ?.toLowerCase()
          .includes(textoBusqueda) ||
        transferencia.cuenta_destino_nombre
          ?.toLowerCase()
          .includes(textoBusqueda) ||
        transferencia.origen_modulo?.toLowerCase().includes(textoBusqueda);

      const coincideCuenta =
        !filtros.cuenta_id ||
        transferencia.cuenta_id === filtros.cuenta_id ||
        transferencia.cuenta_destino_id === filtros.cuenta_id;

      const fechaTransferencia = transferencia.fecha?.slice(0, 10) ?? "";

      const coincideFechaInicio =
        !filtros.fecha_inicio || fechaTransferencia >= filtros.fecha_inicio;

      const coincideFechaFin =
        !filtros.fecha_fin || fechaTransferencia <= filtros.fecha_fin;

      return (
        coincideBusqueda &&
        coincideCuenta &&
        coincideFechaInicio &&
        coincideFechaFin
      );
    });
  }, [transferencias, filtros]);

  /* ===================================================
     KPIs
  =================================================== */

  const totalTransferido = useMemo(
    () =>
      transferenciasFiltradas.reduce(
        (acumulado, transferencia) =>
          acumulado + Number(transferencia.monto || 0),
        0,
      ),
    [transferenciasFiltradas],
  );

  const promedioTransferido =
    transferenciasFiltradas.length > 0
      ? totalTransferido / transferenciasFiltradas.length
      : 0;

  const cuentasInvolucradas = useMemo(() => {
    const ids = new Set<string>();

    transferenciasFiltradas.forEach((transferencia) => {
      if (transferencia.cuenta_id) {
        ids.add(transferencia.cuenta_id);
      }

      if (transferencia.cuenta_destino_id) {
        ids.add(transferencia.cuenta_destino_id);
      }
    });

    return ids.size;
  }, [transferenciasFiltradas]);

  /* ===================================================
     MANEJO DE FILTROS
  =================================================== */

  const actualizarFiltro = (campo: keyof FiltrosFormulario, valor: string) => {
    setFiltros((anteriores) => ({
      ...anteriores,
      [campo]: valor,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros(filtrosIniciales);
  };

  const existenFiltros =
    filtros.busqueda !== "" ||
    filtros.cuenta_id !== "" ||
    filtros.fecha_inicio !== "" ||
    filtros.fecha_fin !== "";

  /* ===================================================
     REGISTRAR TRANSFERENCIA
  =================================================== */

  const handleCreate = () => {
    setModalAbierto(true);
  };

  const handleTransferenciaRegistrada = async () => {
    await cargarDatos(false);
  };

  /* ===================================================
     VER DETALLE
  =================================================== */

  const handleView = async (transferencia: Transferencia) => {
    await Swal.fire({
      title: "Detalle de transferencia",
      width: 650,
      confirmButtonText: "Cerrar",
      html: `
        <div style="
          text-align: left;
          font-size: 14px;
          line-height: 1.7;
        ">
          <div style="
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 16px;
          ">
            <p style="
              color: #1d4ed8;
              font-size: 13px;
              margin: 0 0 5px 0;
            ">
              Monto transferido
            </p>

            <p style="
              color: #1e3a8a;
              font-size: 26px;
              font-weight: bold;
              margin: 0;
            ">
              ${formatearMoneda(transferencia.monto)}
            </p>
          </div>

          <table style="
            width: 100%;
            border-collapse: collapse;
          ">
            <tr>
              <td style="
                padding: 8px 0;
                color: #6b7280;
                width: 38%;
              ">
                Fecha
              </td>

              <td style="
                padding: 8px 0;
                font-weight: 600;
              ">
                ${formatearFecha(transferencia.fecha)}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 8px 0;
                color: #6b7280;
              ">
                Cuenta de origen
              </td>

              <td style="
                padding: 8px 0;
                font-weight: 600;
              ">
                ${transferencia.cuenta_origen_nombre}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 8px 0;
                color: #6b7280;
              ">
                Tipo de cuenta origen
              </td>

              <td style="
                padding: 8px 0;
                text-transform: capitalize;
              ">
                ${transferencia.cuenta_origen_tipo ?? "No especificado"}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 8px 0;
                color: #6b7280;
              ">
                Cuenta de destino
              </td>

              <td style="
                padding: 8px 0;
                font-weight: 600;
              ">
                ${transferencia.cuenta_destino_nombre}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 8px 0;
                color: #6b7280;
              ">
                Tipo de cuenta destino
              </td>

              <td style="
                padding: 8px 0;
                text-transform: capitalize;
              ">
                ${transferencia.cuenta_destino_tipo ?? "No especificado"}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 8px 0;
                color: #6b7280;
              ">
                Descripción
              </td>

              <td style="
                padding: 8px 0;
              ">
                ${transferencia.descripcion ?? "Sin descripción"}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 8px 0;
                color: #6b7280;
              ">
                Origen del registro
              </td>

              <td style="
                padding: 8px 0;
              ">
                ${transferencia.origen_modulo ?? "transferencia_manual"}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 8px 0;
                color: #6b7280;
              ">
                Fecha de creación
              </td>

              <td style="
                padding: 8px 0;
              ">
                ${
                  transferencia.fecha_creacion
                    ? new Date(transferencia.fecha_creacion).toLocaleString(
                        "es-EC",
                      )
                    : "No disponible"
                }
              </td>
            </tr>
          </table>
        </div>
      `,
    });
  };

  /* ===================================================
     EXPORTAR CSV
  =================================================== */

  const handleExportar = async () => {
    if (transferenciasFiltradas.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin información",
        text: "No existen transferencias para exportar.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    const encabezados = [
      "Fecha",
      "Cuenta origen",
      "Tipo cuenta origen",
      "Cuenta destino",
      "Tipo cuenta destino",
      "Descripción",
      "Monto",
      "Origen del registro",
      "Fecha de creación",
    ];

    const filas = transferenciasFiltradas.map((transferencia) => [
      transferencia.fecha,
      transferencia.cuenta_origen_nombre,
      transferencia.cuenta_origen_tipo,
      transferencia.cuenta_destino_nombre,
      transferencia.cuenta_destino_tipo,
      transferencia.descripcion,
      Number(transferencia.monto || 0).toFixed(2),
      transferencia.origen_modulo ?? "transferencia_manual",
      transferencia.fecha_creacion,
    ]);

    const contenidoCsv = [
      encabezados.map(escaparCsv).join(","),
      ...filas.map((fila) => fila.map(escaparCsv).join(",")),
    ].join("\n");

    /*
     * BOM UTF-8 para que Excel muestre
     * correctamente tildes y caracteres especiales.
     */
    const blob = new Blob([`\uFEFF${contenidoCsv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    const fechaActual = new Date().toISOString().slice(0, 10);

    enlace.href = url;
    enlace.download = `transferencias-${fechaActual}.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Transferencias
          </h1>

          <p className="mt-1 text-gray-500">
            Control de movimientos entre cuentas bancarias y caja.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void cargarDatos(false)}
            disabled={recargando}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={18} className={recargando ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => void handleExportar()}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <FileDown size={18} />
            Exportar
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition hover:opacity-90"
          >
            <Plus size={18} />
            Nueva Transferencia
          </button>
        </div>
      </div>

      {/* =================================================
          KPIs
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* TOTAL TRANSFERIDO */}

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Total transferido</p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {formatearMoneda(totalTransferido)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                Según los filtros aplicados
              </p>
            </div>

            <div className="h-fit rounded-full bg-blue-100 p-3">
              <ArrowLeftRight className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* PROMEDIO */}

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Promedio por transferencia
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {formatearMoneda(promedioTransferido)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                Promedio de los registros mostrados
              </p>
            </div>

            <div className="h-fit rounded-full bg-green-100 p-3">
              <TrendingUp className="text-green-600" />
            </div>
          </div>
        </div>

        {/* CUENTAS INVOLUCRADAS */}

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Cuentas involucradas</p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {cuentasInvolucradas}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                {transferenciasFiltradas.length} transferencia
                {transferenciasFiltradas.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="h-fit rounded-full bg-purple-100 p-3">
              <WalletCards className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="rounded-xl border bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>

          {existenFiltros && (
            <span className="text-sm text-blue-600">Filtros activos</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {/* BÚSQUEDA */}

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={filtros.busqueda}
              onChange={(event) =>
                actualizarFiltro("busqueda", event.target.value)
              }
              placeholder="Buscar descripción o cuenta..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* CUENTA */}

          <select
            value={filtros.cuenta_id}
            onChange={(event) =>
              actualizarFiltro("cuenta_id", event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todas las cuentas</option>

            {cuentas.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre}
              </option>
            ))}
          </select>

          {/* FECHA INICIO */}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Desde
            </label>

            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(event) =>
                actualizarFiltro("fecha_inicio", event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* FECHA FIN */}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Hasta
            </label>

            <input
              type="date"
              value={filtros.fecha_fin}
              min={filtros.fecha_inicio || undefined}
              onChange={(event) =>
                actualizarFiltro("fecha_fin", event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* LIMPIAR */}

          <div className="flex items-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!existenFiltros}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Historial de Transferencias
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Movimientos de fondos registrados entre cuentas.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {transferenciasFiltradas.length} registro
            {transferenciasFiltradas.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Fecha
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Cuenta origen
                </th>

                <th className="p-3 text-center text-sm font-semibold text-gray-600">
                  Movimiento
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Cuenta destino
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Descripción
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Origen
                </th>

                <th className="p-3 text-right text-sm font-semibold text-gray-600">
                  Monto
                </th>

                <th className="p-3 text-center text-sm font-semibold text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw
                        size={28}
                        className="animate-spin text-[var(--color-primary)]"
                      />

                      <span>Cargando transferencias...</span>
                    </div>
                  </td>
                </tr>
              ) : transferenciasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 rounded-full bg-gray-100 p-4">
                        <ArrowLeftRight size={34} className="text-gray-400" />
                      </div>

                      <h3 className="font-semibold text-gray-700">
                        No existen transferencias
                      </h3>

                      <p className="mt-1 max-w-md text-sm text-gray-500">
                        {existenFiltros
                          ? "No se encontraron transferencias que coincidan con los filtros aplicados."
                          : "Todavía no se han registrado transferencias entre cuentas financieras."}
                      </p>

                      {!existenFiltros && (
                        <button
                          type="button"
                          onClick={handleCreate}
                          className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          <Plus size={17} />
                          Registrar transferencia
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                transferenciasFiltradas.map((transferencia) => (
                  <tr
                    key={transferencia.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    {/* FECHA */}

                    <td className="whitespace-nowrap p-3 text-sm text-gray-700">
                      {formatearFecha(transferencia.fecha)}
                    </td>

                    {/* CUENTA ORIGEN */}

                    <td className="p-3">
                      <p className="font-medium text-gray-800">
                        {transferencia.cuenta_origen_nombre}
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {transferencia.cuenta_origen_tipo}
                      </p>
                    </td>

                    {/* FLECHA */}

                    <td className="p-3 text-center">
                      <div className="inline-flex rounded-full bg-blue-100 p-2">
                        <ArrowLeftRight size={18} className="text-blue-600" />
                      </div>
                    </td>

                    {/* CUENTA DESTINO */}

                    <td className="p-3">
                      <p className="font-medium text-gray-800">
                        {transferencia.cuenta_destino_nombre}
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {transferencia.cuenta_destino_tipo}
                      </p>
                    </td>

                    {/* DESCRIPCIÓN */}

                    <td className="max-w-[280px] p-3">
                      <p
                        className="truncate text-sm text-gray-700"
                        title={transferencia.descripcion}
                      >
                        {transferencia.descripcion || "Sin descripción"}
                      </p>
                    </td>

                    {/* ORIGEN MÓDULO */}

                    <td className="p-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {transferencia.origen_modulo ?? "manual"}
                      </span>
                    </td>

                    {/* MONTO */}

                    <td className="whitespace-nowrap p-3 text-right font-bold text-blue-600">
                      {formatearMoneda(transferencia.monto)}
                    </td>

                    {/* ACCIONES */}

                    <td className="p-3">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => void handleView(transferencia)}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Ver detalle"
                        >
                          <FaEye size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          MODAL REGISTRAR TRANSFERENCIA
      ================================================= */}

      <RegistrarTransferenciaModal
        open={modalAbierto}
        cuentas={cuentas}
        onClose={() => setModalAbierto(false)}
        onRegistered={handleTransferenciaRegistrada}
      />
    </div>
  );
}

export default TransferenciasPage;
