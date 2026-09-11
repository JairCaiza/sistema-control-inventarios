import { useCallback, useEffect, useMemo, useState } from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
  BarChart3,
  Calendar,
  DollarSign,
  FileDown,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  getFlujoCaja,
  type MovimientoFlujoCaja,
} from "../../flujocaja/service/flujoCajaService";

/* =====================================================
   TIPOS
===================================================== */

interface UtilidadMensual {
  clave: string;
  mes: string;
  mes_corto: string;
  anio: number;
  numero_mes: number;
  ingresos: number;
  egresos: number;
  utilidad: number;
  cantidad_ingresos: number;
  cantidad_egresos: number;
}

type TendenciaUtilidad = "Creciente" | "Decreciente" | "Estable" | "Sin datos";

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

const obtenerFechaValida = (movimiento: MovimientoFlujoCaja): Date | null => {
  const fechaBase = movimiento.fecha_creacion || movimiento.fecha;

  if (!fechaBase) {
    return null;
  }

  const fechaNormalizada = fechaBase.includes("T")
    ? fechaBase
    : `${fechaBase}T00:00:00`;

  const fecha = new Date(fechaNormalizada);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
};

const capitalizarTexto = (texto: string): string => {
  if (!texto) {
    return texto;
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const escaparCsv = (valor: string | number | null | undefined): string => {
  const texto = String(valor ?? "");

  return `"${texto.replace(/"/g, '""')}"`;
};

/* =====================================================
   COMPONENTE
===================================================== */

function UtilidadMensualPage() {
  const [movimientos, setMovimientos] = useState<MovimientoFlujoCaja[]>([]);

  const [cargando, setCargando] = useState(true);

  const [actualizando, setActualizando] = useState(false);

  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");

  /* ===================================================
     CARGAR DATOS REALES
  =================================================== */

  const cargarDatos = useCallback(async (mostrarCargaPrincipal = true) => {
    try {
      if (mostrarCargaPrincipal) {
        setCargando(true);
      } else {
        setActualizando(true);
      }

      const movimientosBackend = await getFlujoCaja();

      setMovimientos(
        Array.isArray(movimientosBackend) ? movimientosBackend : [],
      );
    } catch (error) {
      console.error("Error al cargar utilidad mensual:", error);

      let mensaje = "No se pudo cargar la utilidad mensual.";

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
     AÑOS DISPONIBLES
  =================================================== */

  const aniosDisponibles = useMemo(() => {
    const anios = movimientos
      .map((movimiento) => obtenerFechaValida(movimiento))
      .filter((fecha): fecha is Date => fecha !== null)
      .map((fecha) => fecha.getFullYear());

    return [...new Set(anios)].sort((a, b) => b - a);
  }, [movimientos]);

  useEffect(() => {
    if (!anioSeleccionado && aniosDisponibles.length > 0) {
      setAnioSeleccionado(String(aniosDisponibles[0]));
    }
  }, [anioSeleccionado, aniosDisponibles]);

  /* ===================================================
     AGRUPAR MOVIMIENTOS POR MES
  =================================================== */

  const utilidadMensual = useMemo<UtilidadMensual[]>(() => {
    const agrupacion = new Map<string, UtilidadMensual>();

    movimientos.forEach((movimiento) => {
      if (movimiento.tipo === "transferencia") {
        return;
      }

      const fecha = obtenerFechaValida(movimiento);

      if (!fecha) {
        return;
      }

      const anio = fecha.getFullYear();

      if (anioSeleccionado && String(anio) !== anioSeleccionado) {
        return;
      }

      const numeroMes = fecha.getMonth();

      const clave = `${anio}-${String(numeroMes + 1).padStart(2, "0")}`;

      const nombreMes = capitalizarTexto(
        fecha.toLocaleDateString("es-EC", {
          month: "long",
        }),
      );

      const mesCorto = capitalizarTexto(
        fecha.toLocaleDateString("es-EC", {
          month: "short",
        }),
      );

      if (!agrupacion.has(clave)) {
        agrupacion.set(clave, {
          clave,
          mes: nombreMes,
          mes_corto: mesCorto,
          anio,
          numero_mes: numeroMes,
          ingresos: 0,
          egresos: 0,
          utilidad: 0,
          cantidad_ingresos: 0,
          cantidad_egresos: 0,
        });
      }

      const registro = agrupacion.get(clave);

      if (!registro) {
        return;
      }

      const monto = Number(movimiento.monto ?? 0);

      if (movimiento.tipo === "ingreso") {
        registro.ingresos += monto;
        registro.cantidad_ingresos += 1;
      }

      if (movimiento.tipo === "egreso") {
        registro.egresos += monto;
        registro.cantidad_egresos += 1;
      }

      registro.utilidad = registro.ingresos - registro.egresos;
    });

    return Array.from(agrupacion.values()).sort((a, b) => {
      if (a.anio !== b.anio) {
        return a.anio - b.anio;
      }

      return a.numero_mes - b.numero_mes;
    });
  }, [movimientos, anioSeleccionado]);

  /* ===================================================
     KPIs
  =================================================== */

  const totalIngresos = useMemo(
    () =>
      utilidadMensual.reduce(
        (acumulado, registro) => acumulado + registro.ingresos,
        0,
      ),
    [utilidadMensual],
  );

  const totalEgresos = useMemo(
    () =>
      utilidadMensual.reduce(
        (acumulado, registro) => acumulado + registro.egresos,
        0,
      ),
    [utilidadMensual],
  );

  const totalUtilidad = totalIngresos - totalEgresos;

  const promedioMensual =
    utilidadMensual.length > 0 ? totalUtilidad / utilidadMensual.length : 0;

  const mejorMes = useMemo(() => {
    if (utilidadMensual.length === 0) {
      return null;
    }

    return utilidadMensual.reduce((mejor, actual) =>
      actual.utilidad > mejor.utilidad ? actual : mejor,
    );
  }, [utilidadMensual]);

  const mesMasBajo = useMemo(() => {
    if (utilidadMensual.length === 0) {
      return null;
    }

    return utilidadMensual.reduce((menor, actual) =>
      actual.utilidad < menor.utilidad ? actual : menor,
    );
  }, [utilidadMensual]);

  const tendencia = useMemo<{
    nombre: TendenciaUtilidad;
    descripcion: string;
  }>(() => {
    if (utilidadMensual.length < 2) {
      return {
        nombre: "Sin datos",
        descripcion: "Se necesitan al menos dos meses.",
      };
    }

    const ultimoMes = utilidadMensual[utilidadMensual.length - 1];

    const mesAnterior = utilidadMensual[utilidadMensual.length - 2];

    const diferencia = ultimoMes.utilidad - mesAnterior.utilidad;

    const baseComparacion = Math.abs(mesAnterior.utilidad);

    const porcentaje =
      baseComparacion > 0
        ? (diferencia / baseComparacion) * 100
        : diferencia > 0
          ? 100
          : diferencia < 0
            ? -100
            : 0;

    if (porcentaje > 5) {
      return {
        nombre: "Creciente",
        descripcion: `Aumentó ${Math.abs(porcentaje).toFixed(
          1,
        )}% respecto al mes anterior.`,
      };
    }

    if (porcentaje < -5) {
      return {
        nombre: "Decreciente",
        descripcion: `Disminuyó ${Math.abs(porcentaje).toFixed(
          1,
        )}% respecto al mes anterior.`,
      };
    }

    return {
      nombre: "Estable",
      descripcion: "La variación mensual se mantiene controlada.",
    };
  }, [utilidadMensual]);

  /* ===================================================
     CLASIFICACIÓN DE UTILIDAD
  =================================================== */

  const obtenerEstado = (
    registro: UtilidadMensual,
  ): {
    texto: string;
    clase: string;
  } => {
    if (registro.utilidad < 0) {
      return {
        texto: "Pérdida",
        clase: "bg-red-100 text-red-700",
      };
    }

    if (registro.utilidad === 0) {
      return {
        texto: "Equilibrio",
        clase: "bg-gray-100 text-gray-700",
      };
    }

    const margen =
      registro.ingresos > 0 ? (registro.utilidad / registro.ingresos) * 100 : 0;

    if (margen >= 30) {
      return {
        texto: "Alta",
        clase: "bg-green-100 text-green-700",
      };
    }

    if (margen >= 10) {
      return {
        texto: "Media",
        clase: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      texto: "Baja",
      clase: "bg-orange-100 text-orange-700",
    };
  };

  /* ===================================================
     EXPORTAR CSV
  =================================================== */

  const handleExportar = async (): Promise<void> => {
    if (utilidadMensual.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin información",
        text: "No existen datos mensuales para exportar.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    const encabezados = [
      "Periodo",
      "Ingresos",
      "Egresos",
      "Utilidad",
      "Margen",
      "Cantidad de ingresos",
      "Cantidad de egresos",
      "Estado",
    ];

    const filas = utilidadMensual.map((registro) => {
      const margen =
        registro.ingresos > 0
          ? (registro.utilidad / registro.ingresos) * 100
          : 0;

      return [
        `${registro.mes} ${registro.anio}`,
        registro.ingresos.toFixed(2),
        registro.egresos.toFixed(2),
        registro.utilidad.toFixed(2),
        `${margen.toFixed(2)}%`,
        registro.cantidad_ingresos,
        registro.cantidad_egresos,
        obtenerEstado(registro).texto,
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

    enlace.download = `utilidad-mensual-${anioSeleccionado || "todos"}.csv`;

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
          <h1 className="text-3xl font-bold text-gray-800">Utilidad Mensual</h1>

          <p className="mt-1 text-gray-500">
            Análisis real de ingresos, egresos y rentabilidad por periodo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={anioSeleccionado}
            onChange={(event) => setAnioSeleccionado(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-[var(--color-primary)]"
          >
            {aniosDisponibles.length === 0 ? (
              <option value="">Sin años disponibles</option>
            ) : (
              aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  Año {anio}
                </option>
              ))
            )}
          </select>

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
              <p className="text-sm text-gray-500">Ingresos totales</p>

              <h2 className="mt-2 text-2xl font-bold text-green-600">
                {formatearMoneda(totalIngresos)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                Año {anioSeleccionado || "sin seleccionar"}
              </p>
            </div>

            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Egresos totales</p>

              <h2 className="mt-2 text-2xl font-bold text-red-600">
                {formatearMoneda(totalEgresos)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                Año {anioSeleccionado || "sin seleccionar"}
              </p>
            </div>

            <div className="rounded-full bg-red-100 p-3">
              <TrendingDown className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Utilidad total</p>

              <h2
                className={`mt-2 text-2xl font-bold ${
                  totalUtilidad >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatearMoneda(totalUtilidad)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                Ingresos menos egresos
              </p>
            </div>

            <div className="rounded-full bg-gray-100 p-3">
              <DollarSign
                className={
                  totalUtilidad >= 0 ? "text-green-600" : "text-red-600"
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Promedio mensual</p>

              <h2
                className={`mt-2 text-2xl font-bold ${
                  promedioMensual >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                {formatearMoneda(promedioMensual)}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                {utilidadMensual.length} mes
                {utilidadMensual.length === 1 ? "" : "es"} con movimientos
              </p>
            </div>

            <div className="rounded-full bg-blue-100 p-3">
              <Calendar className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* RESUMEN */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Mejor mes</h3>

            <BarChart3 className="text-green-600" />
          </div>

          <p className="mt-3 text-2xl font-bold text-gray-800">
            {mejorMes ? `${mejorMes.mes} ${mejorMes.anio}` : "Sin datos"}
          </p>

          <p
            className={`mt-1 text-sm ${
              mejorMes && mejorMes.utilidad < 0
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {mejorMes
              ? `${formatearMoneda(mejorMes.utilidad)} de utilidad`
              : "No existen movimientos registrados"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Mes más bajo</h3>

            <BarChart3 className="text-red-600" />
          </div>

          <p className="mt-3 text-2xl font-bold text-gray-800">
            {mesMasBajo ? `${mesMasBajo.mes} ${mesMasBajo.anio}` : "Sin datos"}
          </p>

          <p
            className={`mt-1 text-sm ${
              mesMasBajo && mesMasBajo.utilidad < 0
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {mesMasBajo
              ? `${formatearMoneda(mesMasBajo.utilidad)} de utilidad`
              : "No existen movimientos registrados"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Tendencia</h3>

            {tendencia.nombre === "Decreciente" ? (
              <TrendingDown className="text-red-600" />
            ) : (
              <TrendingUp className="text-blue-600" />
            )}
          </div>

          <p
            className={`mt-3 text-2xl font-bold ${
              tendencia.nombre === "Creciente"
                ? "text-green-600"
                : tendencia.nombre === "Decreciente"
                  ? "text-red-600"
                  : "text-gray-800"
            }`}
          >
            {tendencia.nombre}
          </p>

          <p className="mt-1 text-sm text-gray-500">{tendencia.descripcion}</p>
        </div>
      </div>

      {/* TABLA */}

      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Detalle mensual</h2>

            <p className="mt-1 text-sm text-gray-500">
              Rentabilidad calculada con las transacciones reales.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {utilidadMensual.length} mes
            {utilidadMensual.length === 1 ? "" : "es"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">
                  Periodo
                </th>

                <th className="p-3 text-right text-sm font-semibold text-gray-600">
                  Ingresos
                </th>

                <th className="p-3 text-right text-sm font-semibold text-gray-600">
                  Egresos
                </th>

                <th className="p-3 text-right text-sm font-semibold text-gray-600">
                  Utilidad
                </th>

                <th className="p-3 text-right text-sm font-semibold text-gray-600">
                  Margen
                </th>

                <th className="p-3 text-center text-sm font-semibold text-gray-600">
                  Movimientos
                </th>

                <th className="p-3 text-center text-sm font-semibold text-gray-600">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <RefreshCw
                      size={28}
                      className="mx-auto animate-spin text-[var(--color-primary)]"
                    />

                    <p className="mt-3">Calculando utilidad mensual...</p>
                  </td>
                </tr>
              ) : utilidadMensual.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <BarChart3 size={38} className="mx-auto text-gray-400" />

                    <h3 className="mt-3 font-semibold text-gray-700">
                      No existen datos mensuales
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      No se encontraron ingresos o egresos para el año
                      seleccionado.
                    </p>
                  </td>
                </tr>
              ) : (
                utilidadMensual.map((registro) => {
                  const estado = obtenerEstado(registro);

                  const margen =
                    registro.ingresos > 0
                      ? (registro.utilidad / registro.ingresos) * 100
                      : 0;

                  return (
                    <tr
                      key={registro.clave}
                      className="border-t transition hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <p className="font-medium text-gray-800">
                          {registro.mes}
                        </p>

                        <p className="text-xs text-gray-500">{registro.anio}</p>
                      </td>

                      <td className="whitespace-nowrap p-3 text-right font-semibold text-green-600">
                        {formatearMoneda(registro.ingresos)}
                      </td>

                      <td className="whitespace-nowrap p-3 text-right font-semibold text-red-600">
                        {formatearMoneda(registro.egresos)}
                      </td>

                      <td
                        className={`whitespace-nowrap p-3 text-right font-bold ${
                          registro.utilidad >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {formatearMoneda(registro.utilidad)}
                      </td>

                      <td
                        className={`whitespace-nowrap p-3 text-right font-semibold ${
                          margen >= 0 ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        {margen.toFixed(2)}%
                      </td>

                      <td className="p-3 text-center text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span>
                            {registro.cantidad_ingresos} ingreso
                            {registro.cantidad_ingresos === 1 ? "" : "s"}
                          </span>

                          <span>
                            {registro.cantidad_egresos} egreso
                            {registro.cantidad_egresos === 1 ? "" : "s"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>
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
        <strong>Nota:</strong> la utilidad mensual se calcula restando los
        egresos de los ingresos. Las transferencias entre cuentas no se
        incluyen, ya que no representan una ganancia ni una pérdida para la
        empresa.
      </div>
    </div>
  );
}

export default UtilidadMensualPage;
