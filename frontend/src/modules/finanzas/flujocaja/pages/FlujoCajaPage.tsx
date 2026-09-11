import { useCallback, useEffect, useMemo, useState } from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
  ArrowLeftRight,
  DollarSign,
  FileDown,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import {
  getFlujoCaja,
  type MovimientoFlujoCaja,
  type TipoMovimiento,
} from "../service/flujoCajaService";

import {
  getCuentas,
  type CuentaFinanciera,
} from "../../cuentas/service/cuentaService";

/* =====================================================
   TIPOS AUXILIARES
===================================================== */

interface FiltrosFlujoCaja {
  busqueda: string;
  tipo: "" | TipoMovimiento;
  cuenta_id: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface MovimientoConSaldo extends MovimientoFlujoCaja {
  saldo_acumulado: number;
}

const filtrosIniciales: FiltrosFlujoCaja = {
  busqueda: "",
  tipo: "",
  cuenta_id: "",
  fecha_inicio: "",
  fecha_fin: "",
};

/* =====================================================
   FUNCIONES AUXILIARES
===================================================== */

const formatearMoneda = (valor: number | string | null | undefined): string => {
  const numero = Number(valor ?? 0);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) {
    return "Sin fecha";
  }

  const valorFecha = fecha.includes("T") ? fecha : `${fecha}T00:00:00`;

  const objetoFecha = new Date(valorFecha);

  if (Number.isNaN(objetoFecha.getTime())) {
    return fecha;
  }

  return objetoFecha.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatearTipo = (tipo: TipoMovimiento): string => {
  switch (tipo) {
    case "ingreso":
      return "Ingreso";

    case "egreso":
      return "Egreso";

    case "transferencia":
      return "Transferencia";

    default:
      return tipo;
  }
};

const escaparCsv = (valor: string | number | null | undefined): string => {
  const texto = String(valor ?? "");

  return `"${texto.replace(/"/g, '""')}"`;
};

const obtenerFechaMovimiento = (movimiento: MovimientoFlujoCaja): number => {
  const fecha =
    movimiento.fecha_creacion ||
    (movimiento.fecha ? `${movimiento.fecha}T00:00:00` : "");

  const tiempo = new Date(fecha).getTime();

  return Number.isNaN(tiempo) ? 0 : tiempo;
};

/* =====================================================
   COMPONENTE
===================================================== */

function FlujoCajaPage() {
  const [movimientos, setMovimientos] = useState<MovimientoFlujoCaja[]>([]);

  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [cargando, setCargando] = useState(true);

  const [actualizando, setActualizando] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosFlujoCaja>(filtrosIniciales);

  /* ===================================================
     CARGAR DATOS REALES DEL BACKEND
  =================================================== */

  const cargarDatos = useCallback(async (mostrarCargaPrincipal = true) => {
    try {
      if (mostrarCargaPrincipal) {
        setCargando(true);
      } else {
        setActualizando(true);
      }

      const [movimientosBackend, cuentasBackend] = await Promise.all([
        getFlujoCaja(),
        getCuentas(),
      ]);

      setMovimientos(
        Array.isArray(movimientosBackend) ? movimientosBackend : [],
      );

      setCuentas(Array.isArray(cuentasBackend) ? cuentasBackend : []);
    } catch (error) {
      console.error("Error al cargar flujo de caja:", error);

      let mensaje = "No se pudo cargar el flujo de caja";

      if (axios.isAxiosError(error)) {
        mensaje =
          error.response?.data?.message ??
          error.response?.data?.error ??
          mensaje;
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
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  /* ===================================================
     FILTROS
  =================================================== */

  const movimientosFiltrados = useMemo(() => {
    const busqueda = filtros.busqueda.trim().toLowerCase();

    return movimientos.filter((movimiento) => {
      const descripcion = movimiento.descripcion?.toLowerCase() ?? "";

      const cuentaNombre = movimiento.cuenta_nombre?.toLowerCase() ?? "";

      const cuentaDestino =
        movimiento.cuenta_destino_nombre?.toLowerCase() ?? "";

      const origenModulo = movimiento.origen_modulo?.toLowerCase() ?? "";

      const referencia = movimiento.referencia_id?.toLowerCase() ?? "";

      const coincideBusqueda =
        !busqueda ||
        descripcion.includes(busqueda) ||
        cuentaNombre.includes(busqueda) ||
        cuentaDestino.includes(busqueda) ||
        origenModulo.includes(busqueda) ||
        referencia.includes(busqueda);

      const coincideTipo = !filtros.tipo || movimiento.tipo === filtros.tipo;

      const coincideCuenta =
        !filtros.cuenta_id ||
        movimiento.cuenta_id === filtros.cuenta_id ||
        movimiento.cuenta_destino_id === filtros.cuenta_id;

      const fechaMovimiento = movimiento.fecha?.slice(0, 10) ?? "";

      const coincideFechaInicio =
        !filtros.fecha_inicio || fechaMovimiento >= filtros.fecha_inicio;

      const coincideFechaFin =
        !filtros.fecha_fin || fechaMovimiento <= filtros.fecha_fin;

      return (
        coincideBusqueda &&
        coincideTipo &&
        coincideCuenta &&
        coincideFechaInicio &&
        coincideFechaFin
      );
    });
  }, [movimientos, filtros]);

  /* ===================================================
     SALDO ACUMULADO DEL PERIODO
  =================================================== */

  const movimientosConSaldo = useMemo<MovimientoConSaldo[]>(() => {
    const ordenAscendente = [...movimientosFiltrados].sort(
      (a, b) => obtenerFechaMovimiento(a) - obtenerFechaMovimiento(b),
    );

    let saldoAcumulado = 0;

    const calculados = ordenAscendente.map((movimiento) => {
      const monto = Number(movimiento.monto ?? 0);

      if (movimiento.tipo === "ingreso") {
        saldoAcumulado += monto;
      }

      if (movimiento.tipo === "egreso") {
        saldoAcumulado -= monto;
      }

      return {
        ...movimiento,
        saldo_acumulado: saldoAcumulado,
      };
    });

    return calculados.reverse();
  }, [movimientosFiltrados]);

  /* ===================================================
     KPIs
  =================================================== */

  const totalIngresos = useMemo(
    () =>
      movimientosFiltrados
        .filter((movimiento) => movimiento.tipo === "ingreso")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        ),
    [movimientosFiltrados],
  );

  const totalEgresos = useMemo(
    () =>
      movimientosFiltrados
        .filter((movimiento) => movimiento.tipo === "egreso")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        ),
    [movimientosFiltrados],
  );

  const totalTransferencias = useMemo(
    () =>
      movimientosFiltrados
        .filter((movimiento) => movimiento.tipo === "transferencia")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        ),
    [movimientosFiltrados],
  );

  const saldoNeto = totalIngresos - totalEgresos;

  /* ===================================================
     EVENTOS DE FILTROS
  =================================================== */

  const actualizarFiltro = (campo: keyof FiltrosFlujoCaja, valor: string) => {
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
    filtros.tipo !== "" ||
    filtros.cuenta_id !== "" ||
    filtros.fecha_inicio !== "" ||
    filtros.fecha_fin !== "";

  /* ===================================================
     EXPORTAR CSV
  =================================================== */

  const handleExportar = async (): Promise<void> => {
    if (movimientosConSaldo.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin movimientos",
        text: "No existen movimientos para exportar.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    const encabezados = [
      "Fecha",
      "Descripción",
      "Tipo",
      "Cuenta origen",
      "Cuenta destino",
      "Origen del registro",
      "Referencia",
      "Monto",
      "Impacto neto",
      "Saldo acumulado del periodo",
    ];

    const filas = movimientosConSaldo.map((movimiento) => {
      const monto = Number(movimiento.monto ?? 0);

      const impacto =
        movimiento.tipo === "ingreso"
          ? monto
          : movimiento.tipo === "egreso"
            ? -monto
            : 0;

      return [
        movimiento.fecha,
        movimiento.descripcion,
        formatearTipo(movimiento.tipo),
        movimiento.cuenta_nombre,
        movimiento.cuenta_destino_nombre ?? "",
        movimiento.origen_modulo ?? "manual",
        movimiento.referencia_id ?? "",
        monto.toFixed(2),
        impacto.toFixed(2),
        movimiento.saldo_acumulado.toFixed(2),
      ];
    });

    const contenidoCsv = [
      encabezados.map(escaparCsv).join(","),
      ...filas.map((fila) => fila.map(escaparCsv).join(",")),
    ].join("\n");

    const blob = new Blob([`\uFEFF${contenidoCsv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = `flujo-caja-${new Date().toISOString().slice(0, 10)}.csv`;

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
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Flujo de Caja</h1>

          <p className="mt-1 text-gray-500">
            Consolidado real de ingresos, egresos y transferencias.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void cargarDatos(false)}
            disabled={actualizando}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={actualizando ? "animate-spin" : ""}
            />
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
        </div>
      </div>

      {/* KPIs */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Ingresos</p>

              <h2 className="mt-2 text-2xl font-bold text-green-600">
                {formatearMoneda(totalIngresos)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">Entradas del periodo</p>
            </div>

            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Egresos</p>

              <h2 className="mt-2 text-2xl font-bold text-red-600">
                {formatearMoneda(totalEgresos)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">Salidas del periodo</p>
            </div>

            <div className="rounded-full bg-red-100 p-3">
              <TrendingDown className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Transferencias</p>

              <h2 className="mt-2 text-2xl font-bold text-blue-600">
                {formatearMoneda(totalTransferencias)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">Movimientos internos</p>
            </div>

            <div className="rounded-full bg-blue-100 p-3">
              <Wallet className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Saldo neto</p>

              <h2
                className={`mt-2 text-2xl font-bold ${
                  saldoNeto >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatearMoneda(saldoNeto)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                Ingresos menos egresos
              </p>
            </div>

            <div className="rounded-full bg-gray-100 p-3">
              <DollarSign className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}

      <div className="rounded-xl border bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>

          {existenFiltros && (
            <span className="text-sm text-blue-600">Filtros activos</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
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
              placeholder="Buscar descripción, cuenta o referencia..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={filtros.tipo}
            onChange={(event) => actualizarFiltro("tipo", event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todos los tipos</option>

            <option value="ingreso">Ingresos</option>

            <option value="egreso">Egresos</option>

            <option value="transferencia">Transferencias</option>
          </select>

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

          <input
            type="date"
            value={filtros.fecha_inicio}
            onChange={(event) =>
              actualizarFiltro("fecha_inicio", event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
          />

          <input
            type="date"
            min={filtros.fecha_inicio || undefined}
            value={filtros.fecha_fin}
            onChange={(event) =>
              actualizarFiltro("fecha_fin", event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={!existenFiltros}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* TABLA */}

      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">
              Movimientos financieros
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Historial consolidado de transacciones.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {movimientosConSaldo.length} registro
            {movimientosConSaldo.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Fecha
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Descripción
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Tipo
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Cuenta
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Destino
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Origen
                </th>

                <th className="p-3 text-right text-sm font-semibold text-gray-600">
                  Monto
                </th>

                <th className="p-3 text-right text-sm font-semibold text-gray-600">
                  Impacto neto
                </th>

                <th className="p-3 text-right text-sm font-semibold text-gray-600">
                  Saldo periodo
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw
                        size={28}
                        className="animate-spin text-[var(--color-primary)]"
                      />

                      <span>Cargando movimientos...</span>
                    </div>
                  </td>
                </tr>
              ) : movimientosConSaldo.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 rounded-full bg-gray-100 p-4">
                        <ArrowLeftRight size={34} className="text-gray-400" />
                      </div>

                      <h3 className="font-semibold text-gray-700">
                        No existen movimientos
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {existenFiltros
                          ? "No se encontraron movimientos con los filtros seleccionados."
                          : "Todavía no existen movimientos financieros registrados."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                movimientosConSaldo.map((movimiento) => {
                  const monto = Number(movimiento.monto ?? 0);

                  const impacto =
                    movimiento.tipo === "ingreso"
                      ? monto
                      : movimiento.tipo === "egreso"
                        ? -monto
                        : 0;

                  return (
                    <tr
                      key={`${movimiento.tipo}-${movimiento.id}`}
                      className="border-t transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap p-3 text-sm text-gray-700">
                        {formatearFecha(movimiento.fecha)}
                      </td>

                      <td className="max-w-[280px] p-3">
                        <p
                          className="truncate text-sm text-gray-700"
                          title={movimiento.descripcion}
                        >
                          {movimiento.descripcion}
                        </p>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            movimiento.tipo === "ingreso"
                              ? "bg-green-100 text-green-700"
                              : movimiento.tipo === "egreso"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {formatearTipo(movimiento.tipo)}
                        </span>
                      </td>

                      <td className="p-3">
                        <p className="text-sm font-medium text-gray-800">
                          {movimiento.cuenta_nombre}
                        </p>

                        {movimiento.cuenta_tipo && (
                          <p className="mt-1 text-xs capitalize text-gray-500">
                            {movimiento.cuenta_tipo}
                          </p>
                        )}
                      </td>

                      <td className="p-3">
                        {movimiento.tipo === "transferencia" ? (
                          <>
                            <p className="text-sm font-medium text-gray-800">
                              {movimiento.cuenta_destino_nombre ??
                                "No disponible"}
                            </p>

                            {movimiento.cuenta_destino_tipo && (
                              <p className="mt-1 text-xs capitalize text-gray-500">
                                {movimiento.cuenta_destino_tipo}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No aplica
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {movimiento.origen_modulo ?? "manual"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap p-3 text-right font-semibold text-gray-800">
                        {formatearMoneda(monto)}
                      </td>

                      <td
                        className={`whitespace-nowrap p-3 text-right font-bold ${
                          impacto > 0
                            ? "text-green-600"
                            : impacto < 0
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {impacto > 0 ? "+" : impacto < 0 ? "-" : ""}

                        {formatearMoneda(Math.abs(impacto))}
                      </td>

                      <td
                        className={`whitespace-nowrap p-3 text-right font-bold ${
                          movimiento.saldo_acumulado >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {formatearMoneda(movimiento.saldo_acumulado)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        <strong>Nota:</strong> las transferencias no modifican el saldo neto
        general, porque el dinero sale de una cuenta financiera y entra en otra.
        El saldo del periodo representa ingresos menos egresos dentro de los
        filtros seleccionados.
      </div>
    </div>
  );
}

export default FlujoCajaPage;
