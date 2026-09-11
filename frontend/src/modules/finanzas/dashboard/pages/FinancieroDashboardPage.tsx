import { useCallback, useEffect, useMemo, useState } from "react";

import type { ReactNode } from "react";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  FileDown,
  Landmark,
  Loader2,
  PlusCircle,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import Swal from "sweetalert2";

import { getCuentas } from "../../cuentas/service/cuentaService";

import type { CuentaFinanciera } from "../../cuentas/service/cuentaService";

import { getFlujoCaja } from "../../flujocaja/service/flujoCajaService";

import type {
  MovimientoFlujoCaja,
  TipoMovimiento,
} from "../../flujocaja/service/flujoCajaService";

/* =====================================================
   TIPOS
===================================================== */

interface PeriodoDisponible {
  clave: string;
  nombre: string;
  anio: number;
  mes: number;
}

interface EgresoCategoria {
  categoria: string;
  valor: number;
  cantidad: number;
}

interface FlujoMensual {
  clave: string;
  mes: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
}

interface Variacion {
  porcentaje: number;
  texto: string;
  positiva: boolean;
  sinComparacion: boolean;
}

interface AlertaFinanciera {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: "advertencia" | "error" | "informacion" | "exito";
}

/* =====================================================
   RUTAS
===================================================== */

const RUTAS_FINANZAS = {
  cuentas: "/finanzas/cuentas",
  ingresos: "/finanzas/ingresos",
  egresos: "/finanzas/egresos",
  transferencias: "/finanzas/transferencias",
  cierres: "/finanzas/cierres",
  flujoCaja: "/finanzas/flujo-caja",
};

/* =====================================================
   CONFIGURACIÓN
===================================================== */

const SALDO_MINIMO_CAJA = 100;

const LIMITE_MOVIMIENTOS_RECIENTES = 6;

const COLORES_CATEGORIAS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#f59e0b",
  "#06b6d4",
];

/* =====================================================
   HELPERS
===================================================== */

const formatearMoneda = (valor: number | string | null | undefined): string => {
  const numero = Number(valor ?? 0);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

const capitalizar = (texto: string): string => {
  if (!texto) {
    return texto;
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const obtenerFechaMovimiento = (
  movimiento: MovimientoFlujoCaja,
): Date | null => {
  const valor = movimiento.fecha_creacion || movimiento.fecha;

  if (!valor) {
    return null;
  }

  const fechaNormalizada = valor.includes("T") ? valor : `${valor}T00:00:00`;

  const fecha = new Date(fechaNormalizada);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const obtenerClavePeriodo = (fecha: Date): string =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

const obtenerNombrePeriodo = (fecha: Date): string => {
  const nombre = fecha.toLocaleDateString("es-EC", {
    month: "long",
    year: "numeric",
  });

  return capitalizar(nombre);
};

const formatearFecha = (movimiento: MovimientoFlujoCaja): string => {
  const fecha = obtenerFechaMovimiento(movimiento);

  if (!fecha) {
    return "Sin fecha";
  }

  return fecha.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatearTipo = (tipo: TipoMovimiento): string => {
  if (tipo === "ingreso") {
    return "Ingreso";
  }

  if (tipo === "egreso") {
    return "Egreso";
  }

  return "Transferencia";
};

const obtenerNombreCategoria = (movimiento: MovimientoFlujoCaja): string => {
  const origen = movimiento.origen_modulo?.trim().replace(/_/g, " ");

  if (origen) {
    return capitalizar(origen);
  }

  return "Registro manual";
};

const calcularVariacion = (
  actual: number,
  anterior: number,
  crecimientoEsPositivo = true,
): Variacion => {
  if (anterior === 0) {
    if (actual === 0) {
      return {
        porcentaje: 0,

        texto: "Sin cambios respecto al mes anterior",

        positiva: true,

        sinComparacion: true,
      };
    }

    return {
      porcentaje: 100,

      texto: "Sin base anterior para comparar",

      positiva: crecimientoEsPositivo,

      sinComparacion: true,
    };
  }

  const porcentaje = ((actual - anterior) / Math.abs(anterior)) * 100;

  const aumento = porcentaje >= 0;

  return {
    porcentaje,

    texto: `${aumento ? "↑" : "↓"} ${Math.abs(porcentaje).toFixed(
      1,
    )}% respecto al mes anterior`,

    positiva: crecimientoEsPositivo ? aumento : !aumento,

    sinComparacion: false,
  };
};

const escaparCsv = (valor: string | number | null | undefined): string => {
  const texto = String(valor ?? "");

  return `"${texto.replace(/"/g, '""')}"`;
};

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

function FinancieroDashboardPage() {
  const navigate = useNavigate();

  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [movimientos, setMovimientos] = useState<MovimientoFlujoCaja[]>([]);

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("");

  const [cargando, setCargando] = useState(true);

  const [actualizando, setActualizando] = useState(false);

  /* ===================================================
     CARGAR DATOS
  =================================================== */

  const cargarDatos = useCallback(async (cargaPrincipal = true) => {
    try {
      if (cargaPrincipal) {
        setCargando(true);
      } else {
        setActualizando(true);
      }

      const [cuentasBackend, movimientosBackend] = await Promise.all([
        getCuentas(),
        getFlujoCaja(),
      ]);

      setCuentas(Array.isArray(cuentasBackend) ? cuentasBackend : []);

      setMovimientos(
        Array.isArray(movimientosBackend) ? movimientosBackend : [],
      );
    } catch (error) {
      console.error("Error al cargar dashboard financiero:", error);

      let mensaje = "No se pudo cargar la información financiera.";

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

        confirmButtonColor: "#4f46e5",
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
     PERIODOS
  =================================================== */

  const periodosDisponibles = useMemo<PeriodoDisponible[]>(() => {
    const periodos = new Map<string, PeriodoDisponible>();

    movimientos.forEach((movimiento) => {
      const fecha = obtenerFechaMovimiento(movimiento);

      if (!fecha) {
        return;
      }

      const clave = obtenerClavePeriodo(fecha);

      if (!periodos.has(clave)) {
        periodos.set(clave, {
          clave,

          nombre: obtenerNombrePeriodo(fecha),

          anio: fecha.getFullYear(),

          mes: fecha.getMonth(),
        });
      }
    });

    return Array.from(periodos.values()).sort((a, b) =>
      b.clave.localeCompare(a.clave),
    );
  }, [movimientos]);

  useEffect(() => {
    if (!periodoSeleccionado && periodosDisponibles.length > 0) {
      setPeriodoSeleccionado(periodosDisponibles[0].clave);
    }
  }, [periodoSeleccionado, periodosDisponibles]);

  const periodoActual = useMemo(
    () =>
      periodosDisponibles.find(
        (periodo) => periodo.clave === periodoSeleccionado,
      ) ?? null,
    [periodosDisponibles, periodoSeleccionado],
  );

  const clavePeriodoAnterior = useMemo(() => {
    if (!periodoActual) {
      return "";
    }

    const fechaAnterior = new Date(
      periodoActual.anio,
      periodoActual.mes - 1,
      1,
    );

    return obtenerClavePeriodo(fechaAnterior);
  }, [periodoActual]);

  /* ===================================================
     MOVIMIENTOS DEL PERIODO
  =================================================== */

  const movimientosPeriodo = useMemo(
    () =>
      movimientos.filter((movimiento) => {
        const fecha = obtenerFechaMovimiento(movimiento);

        return (
          fecha !== null && obtenerClavePeriodo(fecha) === periodoSeleccionado
        );
      }),
    [movimientos, periodoSeleccionado],
  );

  const movimientosPeriodoAnterior = useMemo(
    () =>
      movimientos.filter((movimiento) => {
        const fecha = obtenerFechaMovimiento(movimiento);

        return (
          fecha !== null && obtenerClavePeriodo(fecha) === clavePeriodoAnterior
        );
      }),
    [movimientos, clavePeriodoAnterior],
  );

  /* ===================================================
     CUENTAS
  =================================================== */

  const cuentasActivas = useMemo(
    () => cuentas.filter((cuenta) => cuenta.activo),
    [cuentas],
  );

  const saldoTotal = useMemo(
    () =>
      cuentasActivas.reduce(
        (acumulado, cuenta) => acumulado + Number(cuenta.saldo_actual ?? 0),
        0,
      ),
    [cuentasActivas],
  );

  /* ===================================================
     KPI
  =================================================== */

  const ingresosMes = useMemo(
    () =>
      movimientosPeriodo
        .filter((movimiento) => movimiento.tipo === "ingreso")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        ),
    [movimientosPeriodo],
  );

  const egresosMes = useMemo(
    () =>
      movimientosPeriodo
        .filter((movimiento) => movimiento.tipo === "egreso")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        ),
    [movimientosPeriodo],
  );

  const utilidadMes = ingresosMes - egresosMes;

  const ingresosMesAnterior = useMemo(
    () =>
      movimientosPeriodoAnterior
        .filter((movimiento) => movimiento.tipo === "ingreso")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        ),
    [movimientosPeriodoAnterior],
  );

  const egresosMesAnterior = useMemo(
    () =>
      movimientosPeriodoAnterior
        .filter((movimiento) => movimiento.tipo === "egreso")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        ),
    [movimientosPeriodoAnterior],
  );

  const utilidadMesAnterior = ingresosMesAnterior - egresosMesAnterior;

  const saldoEstimadoMesAnterior = saldoTotal - utilidadMes;

  const variacionSaldo = calcularVariacion(
    saldoTotal,
    saldoEstimadoMesAnterior,
    true,
  );

  const variacionIngresos = calcularVariacion(
    ingresosMes,
    ingresosMesAnterior,
    true,
  );

  const variacionEgresos = calcularVariacion(
    egresosMes,
    egresosMesAnterior,
    false,
  );

  const variacionUtilidad = calcularVariacion(
    utilidadMes,
    utilidadMesAnterior,
    true,
  );

  /* ===================================================
     EGRESOS POR CATEGORIA
  =================================================== */

  const egresosCategoria = useMemo<EgresoCategoria[]>(() => {
    const agrupados = new Map<string, EgresoCategoria>();

    movimientosPeriodo
      .filter((movimiento) => movimiento.tipo === "egreso")
      .forEach((movimiento) => {
        const categoria = obtenerNombreCategoria(movimiento);

        const registro = agrupados.get(categoria) ?? {
          categoria,
          valor: 0,
          cantidad: 0,
        };

        registro.valor += Number(movimiento.monto ?? 0);

        registro.cantidad += 1;

        agrupados.set(categoria, registro);
      });

    return Array.from(agrupados.values()).sort((a, b) => b.valor - a.valor);
  }, [movimientosPeriodo]);

  /* ===================================================
     MOVIMIENTOS RECIENTES
  =================================================== */

  const movimientosRecientes = useMemo(
    () =>
      [...movimientos]
        .sort((a, b) => {
          const fechaA = obtenerFechaMovimiento(a)?.getTime() ?? 0;

          const fechaB = obtenerFechaMovimiento(b)?.getTime() ?? 0;

          return fechaB - fechaA;
        })
        .slice(0, LIMITE_MOVIMIENTOS_RECIENTES),
    [movimientos],
  );

  /* ===================================================
     FLUJO 6 MESES
  =================================================== */

  const flujoCaja = useMemo<FlujoMensual[]>(() => {
    if (!periodoActual) {
      return [];
    }

    const meses: FlujoMensual[] = [];

    for (let indice = 5; indice >= 0; indice -= 1) {
      const fecha = new Date(periodoActual.anio, periodoActual.mes - indice, 1);

      const clave = obtenerClavePeriodo(fecha);

      const movimientosMes = movimientos.filter((movimiento) => {
        const fechaMovimiento = obtenerFechaMovimiento(movimiento);

        return (
          fechaMovimiento !== null &&
          obtenerClavePeriodo(fechaMovimiento) === clave
        );
      });

      const ingresos = movimientosMes
        .filter((movimiento) => movimiento.tipo === "ingreso")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        );

      const egresos = movimientosMes
        .filter((movimiento) => movimiento.tipo === "egreso")
        .reduce(
          (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
          0,
        );

      meses.push({
        clave,

        mes: capitalizar(
          fecha.toLocaleDateString("es-EC", {
            month: "short",
          }),
        ),

        ingresos,

        egresos,

        utilidad: ingresos - egresos,
      });
    }

    return meses;
  }, [movimientos, periodoActual]);

  const mayorFlujo = useMemo(
    () =>
      Math.max(
        1,
        ...flujoCaja.flatMap((registro) => [
          registro.ingresos,
          registro.egresos,
        ]),
      ),
    [flujoCaja],
  );

  /* ===================================================
     ACUMULADO ANUAL
  =================================================== */

  const acumuladoAnual = useMemo(() => {
    if (!periodoActual) {
      return {
        ingresos: 0,
        egresos: 0,
        utilidad: 0,
      };
    }

    const movimientosAnio = movimientos.filter((movimiento) => {
      const fecha = obtenerFechaMovimiento(movimiento);

      return (
        fecha !== null &&
        fecha.getFullYear() === periodoActual.anio &&
        fecha.getMonth() <= periodoActual.mes
      );
    });

    const ingresos = movimientosAnio
      .filter((movimiento) => movimiento.tipo === "ingreso")
      .reduce(
        (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
        0,
      );

    const egresos = movimientosAnio
      .filter((movimiento) => movimiento.tipo === "egreso")
      .reduce(
        (acumulado, movimiento) => acumulado + Number(movimiento.monto ?? 0),
        0,
      );

    return {
      ingresos,
      egresos,
      utilidad: ingresos - egresos,
    };
  }, [movimientos, periodoActual]);

  /* ===================================================
     ALERTAS
  =================================================== */

  const alertas = useMemo<AlertaFinanciera[]>(() => {
    const resultado: AlertaFinanciera[] = [];

    const cuentasNegativas = cuentasActivas.filter(
      (cuenta) => Number(cuenta.saldo_actual ?? 0) < 0,
    );

    cuentasNegativas.forEach((cuenta) => {
      resultado.push({
        id: `negativa-${cuenta.id}`,

        titulo: `${cuenta.nombre} presenta saldo negativo`,

        descripcion: `Saldo actual: ${formatearMoneda(cuenta.saldo_actual)}.`,

        tipo: "error",
      });
    });

    const cajasBajas = cuentasActivas.filter(
      (cuenta) =>
        (cuenta.tipo === "caja" || cuenta.tipo === "efectivo") &&
        Number(cuenta.saldo_actual ?? 0) >= 0 &&
        Number(cuenta.saldo_actual ?? 0) < SALDO_MINIMO_CAJA,
    );

    cajasBajas.forEach((cuenta) => {
      resultado.push({
        id: `baja-${cuenta.id}`,

        titulo: `${cuenta.nombre} está por debajo del mínimo`,

        descripcion: `Tiene ${formatearMoneda(
          cuenta.saldo_actual,
        )}. El mínimo configurado es ${formatearMoneda(SALDO_MINIMO_CAJA)}.`,

        tipo: "advertencia",
      });
    });

    if (utilidadMes < 0) {
      resultado.push({
        id: "perdida-mensual",

        titulo: "El periodo presenta pérdida",

        descripcion: `Los egresos superan los ingresos en ${formatearMoneda(
          Math.abs(utilidadMes),
        )}.`,

        tipo: "error",
      });
    }

    if (movimientosPeriodo.length === 0 && periodoSeleccionado) {
      resultado.push({
        id: "sin-movimientos",

        titulo: "Periodo sin movimientos",

        descripcion:
          "No existen ingresos, egresos o transferencias en el periodo seleccionado.",

        tipo: "informacion",
      });
    }

    if (resultado.length === 0) {
      resultado.push({
        id: "sin-alertas",

        titulo: "Estado financiero estable",

        descripcion:
          "No se detectaron saldos negativos, cajas bajas ni pérdidas en el periodo.",

        tipo: "exito",
      });
    }

    return resultado.slice(0, 5);
  }, [cuentasActivas, utilidadMes, movimientosPeriodo, periodoSeleccionado]);

  /* ===================================================
     EXPORTAR
  =================================================== */

  const handleExportar = async () => {
    if (!periodoActual) {
      await Swal.fire({
        icon: "info",

        title: "Sin periodo",

        text: "No existe información financiera para exportar.",

        confirmButtonText: "Aceptar",

        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    const encabezados = [
      "Fecha",
      "Tipo",
      "Descripción",
      "Cuenta",
      "Cuenta destino",
      "Categoría",
      "Monto",
    ];

    const filas = movimientosPeriodo.map((movimiento) => [
      formatearFecha(movimiento),

      formatearTipo(movimiento.tipo),

      movimiento.descripcion,

      movimiento.cuenta_nombre,

      movimiento.cuenta_destino_nombre ?? "",

      obtenerNombreCategoria(movimiento),

      Number(movimiento.monto ?? 0).toFixed(2),
    ]);

    const resumen = [
      [],
      ["RESUMEN DEL PERIODO"],
      ["Periodo", periodoActual.nombre],
      ["Saldo total", saldoTotal.toFixed(2)],
      ["Ingresos", ingresosMes.toFixed(2)],
      ["Egresos", egresosMes.toFixed(2)],
      ["Utilidad", utilidadMes.toFixed(2)],
    ];

    const contenido = [
      encabezados.map(escaparCsv).join(","),

      ...filas.map((fila) => fila.map(escaparCsv).join(",")),

      ...resumen.map((fila) => fila.map(escaparCsv).join(",")),
    ].join("\n");

    const blob = new Blob([`\uFEFF${contenido}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = `dashboard-financiero-${periodoSeleccionado}.csv`;

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  /* ===================================================
     LOADING
  =================================================== */

  if (cargando) {
    return (
      <div
        className="
          flex
          min-h-[520px]
          items-center
          justify-center
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-indigo-600
              to-violet-600
              shadow-xl
              shadow-indigo-500/20
            "
          >
            <Loader2
              size={30}
              className="
                animate-spin
                text-white
              "
            />
          </div>

          <p
            className="
              mt-4
              text-sm
              font-semibold
              text-slate-500
            "
          >
            Cargando información financiera...
          </p>
        </div>
      </div>
    );
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div
      className="
        space-y-6
        pb-8
      "
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          flex
          flex-col
          gap-5
          xl:flex-row
          xl:items-center
          xl:justify-between
        "
      >
        <div>
          <div
            className="
              mb-2
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                h-2.5
                w-2.5
                rounded-full
                bg-emerald-500
                shadow-[0_0_0_5px_rgba(16,185,129,0.12)]
              "
            />

            <span
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.17em]
                text-emerald-600
              "
            >
              Finanzas actualizadas
            </span>
          </div>

          <h1
            className="
              text-3xl
              font-black
              tracking-tight
              text-slate-900
              md:text-4xl
            "
          >
            Dashboard Financiero
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
              md:text-base
            "
          >
            Control de saldos, ingresos, egresos, utilidad y flujo financiero.
          </p>
        </div>

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-3
              py-2
              shadow-sm
            "
          >
            <CalendarDays size={18} className="text-indigo-500" />

            <select
              value={periodoSeleccionado}
              onChange={(event) => setPeriodoSeleccionado(event.target.value)}
              disabled={periodosDisponibles.length === 0}
              className="
                bg-transparent
                pr-2
                text-sm
                font-semibold
                text-slate-700
                outline-none
                disabled:opacity-50
              "
            >
              {periodosDisponibles.length === 0 ? (
                <option value="">Sin periodos</option>
              ) : (
                periodosDisponibles.map((periodo) => (
                  <option key={periodo.clave} value={periodo.clave}>
                    {periodo.nombre}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void cargarDatos(false)}
            disabled={actualizando}
            className="
              inline-flex
              items-center
              gap-2
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-50
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={17}
              className={actualizando ? "animate-spin" : ""}
            />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => void handleExportar()}
            className="
              inline-flex
              items-center
              gap-2
              rounded-2xl
              bg-gradient-to-r
              from-violet-600
              to-indigo-600
              px-4
              py-2.5
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-indigo-500/20
              transition
              hover:-translate-y-0.5
            "
          >
            <FileDown size={17} />
            Exportar
          </button>

          <button
            type="button"
            onClick={() => navigate(RUTAS_FINANZAS.flujoCaja)}
            className="
              inline-flex
              items-center
              gap-2
              rounded-2xl
              bg-slate-900
              px-4
              py-2.5
              text-sm
              font-bold
              text-white
              shadow-lg
              transition
              hover:bg-slate-800
            "
          >
            <BarChart3 size={17} />
            Flujo Caja
          </button>
        </div>
      </div>

      {/* =================================================
          KPIS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <TarjetaKpi
          titulo="Saldo total"
          valor={saldoTotal}
          variacion={variacionSaldo}
          icono={<Wallet size={22} />}
          variante="indigo"
        />

        <TarjetaKpi
          titulo="Ingresos del periodo"
          valor={ingresosMes}
          variacion={variacionIngresos}
          icono={<TrendingUp size={22} />}
          variante="emerald"
        />

        <TarjetaKpi
          titulo="Egresos del periodo"
          valor={egresosMes}
          variacion={variacionEgresos}
          icono={<TrendingDown size={22} />}
          variante="rose"
        />

        <TarjetaKpi
          titulo="Utilidad del periodo"
          valor={utilidadMes}
          variacion={variacionUtilidad}
          icono={<DollarSign size={22} />}
          variante={utilidadMes >= 0 ? "blue" : "rose"}
        />
      </div>

      {/* =================================================
          CUENTAS + DONUT EGRESOS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          xl:grid-cols-2
        "
      >
        {/* CUENTAS */}

        <div
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(15,23,42,0.05)]
          "
        >
          <PanelHeader
            titulo="Saldo por cuentas"
            descripcion={`${cuentasActivas.length} cuenta${
              cuentasActivas.length === 1 ? "" : "s"
            } activa${cuentasActivas.length === 1 ? "" : "s"}`}
            icono={<Landmark size={19} />}
          />

          {cuentasActivas.length === 0 ? (
            <EstadoVacio texto="No existen cuentas financieras activas." />
          ) : (
            <div
              className="
                mt-6
                space-y-4
              "
            >
              {cuentasActivas.map((cuenta, index) => {
                const saldo = Number(cuenta.saldo_actual ?? 0);

                const porcentaje =
                  saldoTotal > 0
                    ? Math.max(0, Math.min(100, (saldo / saldoTotal) * 100))
                    : 0;

                const gradientes = [
                  "from-indigo-500 to-blue-500",
                  "from-emerald-500 to-teal-500",
                  "from-violet-500 to-fuchsia-500",
                  "from-orange-500 to-amber-500",
                ];

                return (
                  <div
                    key={cuenta.id}
                    className="
                        rounded-2xl
                        border
                        border-slate-100
                        bg-slate-50/70
                        p-4
                        transition
                        hover:border-slate-200
                        hover:bg-slate-50
                      "
                  >
                    <div
                      className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                    >
                      <div
                        className="
                            flex
                            items-center
                            gap-3
                          "
                      >
                        <div
                          className={`
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-xl
                              bg-gradient-to-br
                              text-white
                              shadow-sm
                              ${gradientes[index % gradientes.length]}
                            `}
                        >
                          <Wallet size={18} />
                        </div>

                        <div>
                          <p
                            className="
                                font-bold
                                text-slate-800
                              "
                          >
                            {cuenta.nombre}
                          </p>

                          <p
                            className="
                                mt-0.5
                                text-xs
                                capitalize
                                text-slate-400
                              "
                          >
                            {cuenta.tipo}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`
                            text-lg
                            font-black

                            ${saldo < 0 ? "text-rose-600" : "text-slate-900"}
                          `}
                      >
                        {formatearMoneda(saldo)}
                      </p>
                    </div>

                    <div
                      className="
                          mt-4
                          h-2
                          overflow-hidden
                          rounded-full
                          bg-white
                          shadow-inner
                        "
                    >
                      <div
                        className={`
                            h-full
                            rounded-full
                            bg-gradient-to-r
                            transition-all

                            ${
                              saldo < 0
                                ? "from-rose-400 to-red-600"
                                : gradientes[index % gradientes.length]
                            }
                          `}
                        style={{
                          width: `${porcentaje}%`,
                        }}
                      />
                    </div>

                    <div
                      className="
                          mt-2
                          flex
                          justify-between
                          text-[11px]
                          text-slate-400
                        "
                    >
                      <span>Participación del saldo</span>

                      <span
                        className="
                            font-bold
                            text-slate-500
                          "
                      >
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DONUT EGRESOS */}

        <div
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(15,23,42,0.05)]
          "
        >
          <PanelHeader
            titulo="Distribución de egresos"
            descripcion="Gastos agrupados por origen"
            icono={<TrendingDown size={19} />}
          />

          {egresosCategoria.length === 0 ? (
            <EstadoVacio texto="No existen egresos en este periodo." />
          ) : (
            <div
              className="
                mt-6
                grid
                gap-6
                lg:grid-cols-[210px_1fr]
                lg:items-center
              "
            >
              <DonutEgresos datos={egresosCategoria} total={egresosMes} />

              <div
                className="
                  space-y-3
                "
              >
                {egresosCategoria.slice(0, 6).map((item, index) => {
                  const porcentaje =
                    egresosMes > 0 ? (item.valor / egresosMes) * 100 : 0;

                  return (
                    <div
                      key={item.categoria}
                      className="
                            flex
                            items-center
                            justify-between
                            gap-3
                          "
                    >
                      <div
                        className="
                              flex
                              min-w-0
                              items-center
                              gap-2.5
                            "
                      >
                        <span
                          className="
                                h-2.5
                                w-2.5
                                shrink-0
                                rounded-full
                              "
                          style={{
                            backgroundColor:
                              COLORES_CATEGORIAS[
                                index % COLORES_CATEGORIAS.length
                              ],
                          }}
                        />

                        <div
                          className="
                                min-w-0
                              "
                        >
                          <p
                            className="
                                  truncate
                                  text-sm
                                  font-semibold
                                  text-slate-700
                                "
                          >
                            {item.categoria}
                          </p>

                          <p
                            className="
                                  text-[11px]
                                  text-slate-400
                                "
                          >
                            {item.cantidad} movimiento
                            {item.cantidad === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                              text-right
                            "
                      >
                        <p
                          className="
                                text-sm
                                font-black
                                text-slate-800
                              "
                        >
                          {formatearMoneda(item.valor)}
                        </p>

                        <p
                          className="
                                text-[11px]
                                font-semibold
                                text-slate-400
                              "
                        >
                          {porcentaje.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          FLUJO 6 MESES
      ================================================= */}

      <div
        className="
          rounded-[24px]
          border
          border-slate-200
          bg-white
          p-6
          shadow-[0_10px_35px_rgba(15,23,42,0.05)]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            md:flex-row
            md:items-start
            md:justify-between
          "
        >
          <PanelHeader
            titulo="Flujo financiero de los últimos 6 meses"
            descripcion="Comparación mensual de ingresos y egresos"
            icono={<BarChart3 size={19} />}
          />

          <div
            className="
              flex
              flex-wrap
              gap-4
              text-xs
              font-semibold
              text-slate-500
            "
          >
            <Leyenda color="bg-emerald-500" texto="Ingresos" />

            <Leyenda color="bg-rose-500" texto="Egresos" />
          </div>
        </div>

        <div
          className="
            mt-8
            overflow-x-auto
            pb-2
          "
        >
          <div
            className="
              grid
              min-w-[760px]
              grid-cols-6
              gap-6
            "
          >
            {flujoCaja.map((registro) => {
              const altoIngreso =
                registro.ingresos > 0
                  ? Math.max(8, (registro.ingresos / mayorFlujo) * 180)
                  : 0;

              const altoEgreso =
                registro.egresos > 0
                  ? Math.max(8, (registro.egresos / mayorFlujo) * 180)
                  : 0;

              return (
                <div
                  key={registro.clave}
                  className="
                      flex
                      flex-col
                      items-center
                    "
                >
                  <div
                    className="
                        flex
                        h-[210px]
                        w-full
                        items-end
                        justify-center
                        gap-2
                        rounded-2xl
                        border
                        border-slate-100
                        bg-gradient-to-t
                        from-slate-50
                        to-white
                        px-4
                        pt-4
                      "
                  >
                    <div
                      className="
                          flex
                          h-full
                          flex-1
                          items-end
                          justify-center
                        "
                    >
                      <div
                        title={`Ingresos: ${formatearMoneda(
                          registro.ingresos,
                        )}`}
                        className="
                            w-full
                            max-w-[34px]
                            rounded-t-lg
                            bg-gradient-to-t
                            from-emerald-600
                            via-emerald-500
                            to-emerald-300
                            shadow-[0_5px_15px_rgba(16,185,129,0.20)]
                            transition-all
                            hover:brightness-105
                          "
                        style={{
                          height: `${altoIngreso}px`,
                        }}
                      />
                    </div>

                    <div
                      className="
                          flex
                          h-full
                          flex-1
                          items-end
                          justify-center
                        "
                    >
                      <div
                        title={`Egresos: ${formatearMoneda(registro.egresos)}`}
                        className="
                            w-full
                            max-w-[34px]
                            rounded-t-lg
                            bg-gradient-to-t
                            from-rose-600
                            via-rose-500
                            to-rose-300
                            shadow-[0_5px_15px_rgba(244,63,94,0.18)]
                            transition-all
                            hover:brightness-105
                          "
                        style={{
                          height: `${altoEgreso}px`,
                        }}
                      />
                    </div>
                  </div>

                  <p
                    className="
                        mt-3
                        text-sm
                        font-black
                        text-slate-700
                      "
                  >
                    {registro.mes}
                  </p>

                  <p
                    className={`
                        mt-1
                        text-xs
                        font-bold

                        ${
                          registro.utilidad >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }
                      `}
                  >
                    {formatearMoneda(registro.utilidad)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =================================================
          MOVIMIENTOS RECIENTES
      ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-[24px]
          border
          border-slate-200
          bg-white
          shadow-[0_10px_35px_rgba(15,23,42,0.05)]
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            border-b
            border-slate-100
            px-6
            py-5
          "
        >
          <PanelHeader
            titulo="Movimientos recientes"
            descripcion="Últimas transacciones registradas"
            icono={<ArrowLeftRight size={19} />}
          />

          <button
            type="button"
            onClick={() => navigate(RUTAS_FINANZAS.flujoCaja)}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-indigo-50
              px-3
              py-2
              text-xs
              font-bold
              text-indigo-600
              transition
              hover:bg-indigo-100
            "
          >
            Ver todos
            <ArrowRight size={14} />
          </button>
        </div>

        <div
          className="
            overflow-x-auto
          "
        >
          <table
            className="
              w-full
              min-w-[850px]
              border-collapse
            "
          >
            <thead>
              <tr
                className="
                  bg-slate-50/80
                "
              >
                <th
                  className="
                    px-6
                    py-4
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Fecha
                </th>

                <th
                  className="
                    px-6
                    py-4
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Tipo
                </th>

                <th
                  className="
                    px-6
                    py-4
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Descripción
                </th>

                <th
                  className="
                    px-6
                    py-4
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Cuenta
                </th>

                <th
                  className="
                    px-6
                    py-4
                    text-right
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Valor
                </th>
              </tr>
            </thead>

            <tbody
              className="
                divide-y
                divide-slate-100
              "
            >
              {movimientosRecientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="
                      p-10
                    "
                  >
                    <EstadoVacio texto="No existen movimientos financieros." />
                  </td>
                </tr>
              ) : (
                movimientosRecientes.map((movimiento) => {
                  const monto = Number(movimiento.monto ?? 0);

                  return (
                    <tr
                      key={`${movimiento.tipo}-${movimiento.id}`}
                      className="
                          transition
                          hover:bg-indigo-50/30
                        "
                    >
                      <td
                        className="
                            whitespace-nowrap
                            px-6
                            py-4
                            text-sm
                            font-medium
                            text-slate-600
                          "
                      >
                        {formatearFecha(movimiento)}
                      </td>

                      <td
                        className="
                            px-6
                            py-4
                          "
                      >
                        <TipoBadge tipo={movimiento.tipo} />
                      </td>

                      <td
                        className="
                            max-w-[300px]
                            px-6
                            py-4
                          "
                      >
                        <p
                          className="
                              truncate
                              text-sm
                              font-semibold
                              text-slate-700
                            "
                          title={movimiento.descripcion}
                        >
                          {movimiento.descripcion}
                        </p>

                        <p
                          className="
                              mt-1
                              text-[11px]
                              text-slate-400
                            "
                        >
                          {obtenerNombreCategoria(movimiento)}
                        </p>
                      </td>

                      <td
                        className="
                            px-6
                            py-4
                          "
                      >
                        <div
                          className="
                              flex
                              items-center
                              gap-2
                            "
                        >
                          <div
                            className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                bg-slate-100
                                text-slate-500
                              "
                          >
                            <Wallet size={15} />
                          </div>

                          <div>
                            <p
                              className="
                                  text-sm
                                  font-medium
                                  text-slate-700
                                "
                            >
                              {movimiento.cuenta_nombre}
                            </p>

                            {movimiento.tipo === "transferencia" &&
                              movimiento.cuenta_destino_nombre && (
                                <p
                                  className="
                                      mt-0.5
                                      text-[11px]
                                      text-slate-400
                                    "
                                >
                                  hacia {movimiento.cuenta_destino_nombre}
                                </p>
                              )}
                          </div>
                        </div>
                      </td>

                      <td
                        className={`
                            whitespace-nowrap
                            px-6
                            py-4
                            text-right
                            text-sm
                            font-black

                            ${
                              movimiento.tipo === "ingreso"
                                ? "text-emerald-600"
                                : movimiento.tipo === "egreso"
                                  ? "text-rose-600"
                                  : "text-blue-600"
                            }
                          `}
                      >
                        {movimiento.tipo === "ingreso"
                          ? "+"
                          : movimiento.tipo === "egreso"
                            ? "-"
                            : ""}

                        {formatearMoneda(monto)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          ACUMULADO ANUAL
      ================================================= */}

      <div
        className="
          relative
          overflow-hidden
          rounded-[24px]
          bg-gradient-to-br
          from-slate-950
          via-indigo-950
          to-violet-950
          p-6
          text-white
          shadow-xl
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-60
            w-60
            rounded-full
            bg-indigo-500/20
            blur-3xl
          "
        />

        <div
          className="
            relative
            z-10
          "
        >
          <div>
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-indigo-300
              "
            >
              Acumulado anual
            </p>

            <h2
              className="
                mt-1
                text-xl
                font-black
              "
            >
              Rendimiento financiero
            </h2>
          </div>

          <div
            className="
              mt-6
              grid
              gap-4
              md:grid-cols-3
            "
          >
            <AcumuladoCard
              titulo="Ingresos acumulados"
              valor={acumuladoAnual.ingresos}
              icono={<ArrowUpRight size={20} />}
              clase="text-emerald-300"
            />

            <AcumuladoCard
              titulo="Egresos acumulados"
              valor={acumuladoAnual.egresos}
              icono={<ArrowDownRight size={20} />}
              clase="text-rose-300"
            />

            <AcumuladoCard
              titulo="Utilidad acumulada"
              valor={acumuladoAnual.utilidad}
              icono={<CircleDollarSign size={20} />}
              clase={
                acumuladoAnual.utilidad >= 0 ? "text-cyan-300" : "text-rose-300"
              }
            />
          </div>
        </div>
      </div>

      {/* =================================================
          ALERTAS + ACCESOS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          xl:grid-cols-2
        "
      >
        {/* ALERTAS */}

        <div
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(15,23,42,0.05)]
          "
        >
          <PanelHeader
            titulo="Alertas financieras"
            descripcion="Situaciones que requieren revisión"
            icono={<AlertTriangle size={19} />}
          />

          <div
            className="
              mt-6
              space-y-3
            "
          >
            {alertas.map((alerta) => (
              <AlertaCard key={alerta.id} alerta={alerta} />
            ))}
          </div>
        </div>

        {/* ACCESOS */}

        <div
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(15,23,42,0.05)]
          "
        >
          <PanelHeader
            titulo="Accesos rápidos"
            descripcion="Operaciones frecuentes de finanzas"
            icono={<ArrowRight size={19} />}
          />

          <div
            className="
              mt-6
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-2
            "
          >
            <AccesoRapido
              titulo="Nueva cuenta"
              descripcion="Crear cuenta financiera"
              icono={<Landmark size={20} />}
              variante="indigo"
              onClick={() => navigate(RUTAS_FINANZAS.cuentas)}
            />

            <AccesoRapido
              titulo="Registrar ingreso"
              descripcion="Nuevo movimiento de ingreso"
              icono={<PlusCircle size={20} />}
              variante="emerald"
              onClick={() => navigate(RUTAS_FINANZAS.ingresos)}
            />

            <AccesoRapido
              titulo="Registrar egreso"
              descripcion="Nuevo movimiento de egreso"
              icono={<Receipt size={20} />}
              variante="rose"
              onClick={() => navigate(RUTAS_FINANZAS.egresos)}
            />

            <AccesoRapido
              titulo="Transferencia"
              descripcion="Mover fondos entre cuentas"
              icono={<ArrowLeftRight size={20} />}
              variante="blue"
              onClick={() => navigate(RUTAS_FINANZAS.transferencias)}
            />

            <AccesoRapido
              titulo="Cierre diario"
              descripcion="Gestionar cierres financieros"
              icono={<CalendarDays size={20} />}
              variante="violet"
              onClick={() => navigate(RUTAS_FINANZAS.cierres)}
            />

            <AccesoRapido
              titulo="Flujo de caja"
              descripcion="Analizar movimientos"
              icono={<BarChart3 size={20} />}
              variante="cyan"
              onClick={() => navigate(RUTAS_FINANZAS.flujoCaja)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   KPI CARD
===================================================== */

interface TarjetaKpiProps {
  titulo: string;
  valor: number;
  variacion: Variacion;
  icono: ReactNode;
  variante: "indigo" | "emerald" | "rose" | "blue";
}

function TarjetaKpi({
  titulo,
  valor,
  variacion,
  icono,
  variante,
}: TarjetaKpiProps) {
  const estilos = {
    indigo: {
      icono: "bg-indigo-50 text-indigo-600",

      linea: "from-indigo-400 via-indigo-500 to-violet-600",

      glow: "bg-indigo-400/10",

      spark: "#6366f1",
    },

    emerald: {
      icono: "bg-emerald-50 text-emerald-600",

      linea: "from-emerald-400 via-emerald-500 to-teal-500",

      glow: "bg-emerald-400/10",

      spark: "#10b981",
    },

    rose: {
      icono: "bg-rose-50 text-rose-600",

      linea: "from-rose-400 via-rose-500 to-red-500",

      glow: "bg-rose-400/10",

      spark: "#f43f5e",
    },

    blue: {
      icono: "bg-blue-50 text-blue-600",

      linea: "from-blue-400 via-blue-500 to-cyan-500",

      glow: "bg-blue-400/10",

      spark: "#3b82f6",
    },
  }[variante];

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(15,23,42,0.05)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]
      "
    >
      <div
        className={`
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-28
          w-28
          rounded-full
          blur-2xl
          ${estilos.glow}
        `}
      />

      <div
        className="
          relative
          z-10
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-sm
              font-semibold
              text-slate-500
            "
          >
            {titulo}
          </p>

          <h2
            className="
              mt-2
              text-3xl
              font-black
              tracking-tight
              text-slate-900
            "
          >
            {formatearMoneda(valor)}
          </h2>
        </div>

        <div
          className={`
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            ${estilos.icono}
          `}
        >
          {icono}
        </div>
      </div>

      <div
        className="
          relative
          z-10
          mt-5
          flex
          items-end
          justify-between
          gap-3
        "
      >
        <div
          className={`
            inline-flex
            max-w-[70%]
            items-center
            gap-1
            rounded-full
            px-2.5
            py-1
            text-[10px]
            font-bold

            ${
              variacion.positiva
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }
          `}
        >
          {variacion.positiva ? (
            <ArrowUpRight size={12} />
          ) : (
            <ArrowDownRight size={12} />
          )}

          <span
            className="
              truncate
            "
          >
            {variacion.texto}
          </span>
        </div>

        <MiniSparkline color={estilos.spark} positiva={variacion.positiva} />
      </div>

      <div
        className={`
          absolute
          bottom-0
          left-0
          h-[3px]
          w-full
          bg-gradient-to-r
          ${estilos.linea}
        `}
      />
    </div>
  );
}

/* =====================================================
   MINI SPARKLINE
===================================================== */

function MiniSparkline({
  color,
  positiva,
}: {
  color: string;
  positiva: boolean;
}) {
  const path = positiva
    ? "M2 25 C8 23 11 16 16 18 C22 20 26 9 32 12 C39 15 42 6 49 9 C56 11 59 4 68 3"
    : "M2 5 C10 7 12 12 18 10 C24 8 28 18 34 15 C40 13 45 21 51 19 C58 17 61 26 68 25";

  return (
    <svg width="70" height="30" viewBox="0 0 70 30" fill="none">
      <path
        d={path}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* =====================================================
   HEADER PANEL
===================================================== */

function PanelHeader({
  titulo,
  descripcion,
  icono,
}: {
  titulo: string;
  descripcion: string;
  icono: ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
      "
    >
      <div>
        <h2
          className="
            text-lg
            font-black
            tracking-tight
            text-slate-900
          "
        >
          {titulo}
        </h2>

        <p
          className="
            mt-1
            text-xs
            text-slate-400
          "
        >
          {descripcion}
        </p>
      </div>

      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-slate-50
          text-slate-500
        "
      >
        {icono}
      </div>
    </div>
  );
}

/* =====================================================
   DONUT EGRESOS
===================================================== */

function DonutEgresos({
  datos,
  total,
}: {
  datos: EgresoCategoria[];
  total: number;
}) {
  const radio = 58;

  const circunferencia = 2 * Math.PI * radio;

  let acumulado = 0;

  const visibles = datos.slice(0, 6);

  return (
    <div
      className="
        mx-auto
        flex
        items-center
        justify-center
      "
    >
      <div
        className="
          relative
          h-[190px]
          w-[190px]
        "
      >
        <svg
          viewBox="0 0 160 160"
          className="
            h-full
            w-full
            -rotate-90
          "
        >
          <circle
            cx="80"
            cy="80"
            r={radio}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="20"
          />

          {visibles.map((item, index) => {
            const porcentaje = total > 0 ? item.valor / total : 0;

            const longitud = porcentaje * circunferencia;

            const offset = -acumulado;

            acumulado += longitud;

            return (
              <circle
                key={item.categoria}
                cx="80"
                cy="80"
                r={radio}
                fill="none"
                stroke={COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length]}
                strokeWidth="20"
                strokeDasharray={`${longitud} ${circunferencia - longitud}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>

        <div
          className="
            absolute
            inset-0
            flex
            flex-col
            items-center
            justify-center
          "
        >
          <span
            className="
              text-2xl
              font-black
              text-slate-900
            "
          >
            {formatearMoneda(total)}
          </span>

          <span
            className="
              mt-1
              text-[11px]
              font-semibold
              text-slate-400
            "
          >
            Egresos
          </span>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   LEYENDA
===================================================== */

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <span
      className="
        flex
        items-center
        gap-2
      "
    >
      <span
        className={`
          h-2.5
          w-2.5
          rounded-full
          ${color}
        `}
      />

      {texto}
    </span>
  );
}

/* =====================================================
   TIPO BADGE
===================================================== */

function TipoBadge({ tipo }: { tipo: TipoMovimiento }) {
  if (tipo === "ingreso") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-emerald-50
          px-2.5
          py-1
          text-xs
          font-bold
          text-emerald-600
        "
      >
        <ArrowUpRight size={13} />
        Ingreso
      </span>
    );
  }

  if (tipo === "egreso") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-rose-50
          px-2.5
          py-1
          text-xs
          font-bold
          text-rose-600
        "
      >
        <ArrowDownRight size={13} />
        Egreso
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-blue-50
        px-2.5
        py-1
        text-xs
        font-bold
        text-blue-600
      "
    >
      <ArrowLeftRight size={13} />
      Transferencia
    </span>
  );
}

/* =====================================================
   ACUMULADO
===================================================== */

function AcumuladoCard({
  titulo,
  valor,
  icono,
  clase,
}: {
  titulo: string;
  valor: number;
  icono: ReactNode;
  clase: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/10
        p-5
        backdrop-blur
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
        "
      >
        <div>
          <p
            className="
              text-xs
              font-semibold
              text-slate-300
            "
          >
            {titulo}
          </p>

          <p
            className={`
              mt-2
              text-2xl
              font-black
              ${clase}
            `}
          >
            {formatearMoneda(valor)}
          </p>
        </div>

        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-white/10
          "
        >
          {icono}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   ALERTA
===================================================== */

function AlertaCard({ alerta }: { alerta: AlertaFinanciera }) {
  const estilos =
    alerta.tipo === "error"
      ? {
          contenedor: "border-rose-200 bg-gradient-to-r from-rose-50 to-red-50",

          icono: "bg-rose-100 text-rose-600",
        }
      : alerta.tipo === "advertencia"
        ? {
            contenedor:
              "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50",

            icono: "bg-amber-100 text-amber-600",
          }
        : alerta.tipo === "informacion"
          ? {
              contenedor:
                "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50",

              icono: "bg-blue-100 text-blue-600",
            }
          : {
              contenedor:
                "border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50",

              icono: "bg-emerald-100 text-emerald-600",
            };

  return (
    <div
      className={`
        flex
        gap-3
        rounded-2xl
        border
        p-4
        ${estilos.contenedor}
      `}
    >
      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${estilos.icono}
        `}
      >
        {alerta.tipo === "exito" ? (
          <CheckCircle2 size={19} />
        ) : (
          <AlertTriangle size={19} />
        )}
      </div>

      <div>
        <p
          className="
            text-sm
            font-bold
            text-slate-800
          "
        >
          {alerta.titulo}
        </p>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-slate-500
          "
        >
          {alerta.descripcion}
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   ACCESO RAPIDO
===================================================== */

function AccesoRapido({
  titulo,
  descripcion,
  icono,
  variante,
  onClick,
}: {
  titulo: string;
  descripcion: string;
  icono: ReactNode;
  variante: "indigo" | "emerald" | "rose" | "blue" | "violet" | "cyan";
  onClick: () => void;
}) {
  const estilos = {
    indigo: "from-indigo-500 to-violet-600",

    emerald: "from-emerald-500 to-teal-500",

    rose: "from-rose-500 to-red-500",

    blue: "from-blue-500 to-cyan-500",

    violet: "from-violet-500 to-fuchsia-500",

    cyan: "from-cyan-500 to-blue-500",
  }[variante];

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        flex
        items-center
        gap-4
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        text-left
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:shadow-lg
      "
    >
      <div
        className={`
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-gradient-to-br
          text-white
          shadow-md
          ${estilos}
        `}
      >
        {icono}
      </div>

      <div
        className="
          min-w-0
          flex-1
        "
      >
        <p
          className="
            text-sm
            font-bold
            text-slate-800
          "
        >
          {titulo}
        </p>

        <p
          className="
            mt-0.5
            text-xs
            text-slate-400
          "
        >
          {descripcion}
        </p>
      </div>

      <ArrowRight
        size={17}
        className="
          text-slate-300
          transition
          group-hover:translate-x-1
          group-hover:text-indigo-500
        "
      />
    </button>
  );
}

/* =====================================================
   ESTADO VACIO
===================================================== */

function EstadoVacio({ texto }: { texto: string }) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        py-12
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-slate-50
          text-slate-300
        "
      >
        <CreditCard size={26} />
      </div>

      <p
        className="
          mt-3
          text-sm
          font-medium
          text-slate-400
        "
      >
        {texto}
      </p>
    </div>
  );
}

export default FinancieroDashboardPage;
