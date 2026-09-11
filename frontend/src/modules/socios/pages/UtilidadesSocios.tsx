import { useCallback, useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileDown,
  Calculator,
  RefreshCw,
  Wallet,
  CheckCircle2,
  Clock3,
  Ban,
} from "lucide-react";

import { FaEye, FaMoneyBillWave, FaBan } from "react-icons/fa";

import {
  calcularDistribucionUtilidad,
  generarDistribucionUtilidad,
  getDistribucionesUtilidades,
  getResumenUtilidades,
  getUtilidadPeriodo,
  pagarDistribucionUtilidad,
  anularDistribucionUtilidad,
  type CalculoDistribucion,
  type DistribucionUtilidad,
  type ResumenUtilidades,
  type UtilidadPeriodo,
} from "../service/utilidadSocioService";

import {
  getCuentas,
  type CuentaFinanciera,
} from "../../finanzas/cuentas/service/cuentaService";

/* =====================================================
   FECHA / PERIODO ACTUAL
===================================================== */

const obtenerPeriodoActual = (): string => {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  return `${anio}-${mes}`;
};

const obtenerFechaActual = (): string => {
  return new Date().toISOString().split("T")[0];
};

/* =====================================================
   FORMATEADORES
===================================================== */

const formatearDinero = (valor: number | string | undefined): string => {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatearPeriodo = (periodo: string): string => {
  if (!periodo) {
    return "Sin período";
  }

  const [anio, mes] = periodo.split("-");

  const nombresMeses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const indiceMes = Number(mes) - 1;

  if (!anio || indiceMes < 0 || indiceMes > 11) {
    return periodo;
  }

  return `${nombresMeses[indiceMes]} ${anio}`;
};

const capitalizar = (texto?: string | null): string => {
  if (!texto) {
    return "No registrado";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/* =====================================================
   COMPONENTE
===================================================== */

function UtilidadesSocios() {
  const [periodo, setPeriodo] = useState<string>(obtenerPeriodoActual());

  const [montoDistribuir, setMontoDistribuir] = useState<string>("");

  const [observaciones, setObservaciones] = useState<string>("");

  const [utilidadPeriodo, setUtilidadPeriodo] =
    useState<UtilidadPeriodo | null>(null);

  const [calculo, setCalculo] = useState<CalculoDistribucion | null>(null);

  const [distribuciones, setDistribuciones] = useState<DistribucionUtilidad[]>(
    [],
  );

  const [resumen, setResumen] = useState<ResumenUtilidades>({
    total_distribuido: 0,
    total_pagado: 0,
    total_pendiente: 0,
    cantidad_pagadas: 0,
    cantidad_pendientes: 0,
  });

  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [consultando, setConsultando] = useState<boolean>(false);

  const [simulando, setSimulando] = useState<boolean>(false);

  const [generando, setGenerando] = useState<boolean>(false);

  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [error, setError] = useState<string>("");

  /* =====================================================
     CARGAR HISTÓRICO / RESUMEN / CUENTAS
  ===================================================== */

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const [lista, resumenData, cuentasData] = await Promise.all([
        getDistribucionesUtilidades(),

        getResumenUtilidades(),

        getCuentas(),
      ]);

      setDistribuciones(lista ?? []);

      setResumen({
        total_distribuido: Number(resumenData.total_distribuido || 0),

        total_pagado: Number(resumenData.total_pagado || 0),

        total_pendiente: Number(resumenData.total_pendiente || 0),

        cantidad_pagadas: Number(resumenData.cantidad_pagadas || 0),

        cantidad_pendientes: Number(resumenData.cantidad_pendientes || 0),
      });

      setCuentas((cuentasData ?? []).filter((cuenta) => cuenta.activo));
    } catch (errorCargar) {
      console.error("Error cargando utilidades:", errorCargar);

      setError("No se pudieron cargar las utilidades de socios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /* =====================================================
     CONSULTAR UTILIDAD
  ===================================================== */

  const handleConsultarUtilidad = async () => {
    if (!periodo) {
      await Swal.fire({
        icon: "warning",
        title: "Seleccione un período",
        text: "Debe seleccionar el período que desea consultar.",
      });

      return;
    }

    try {
      setConsultando(true);

      setError("");

      setCalculo(null);

      const resultado = await getUtilidadPeriodo(periodo);

      setUtilidadPeriodo(resultado);

      if (resultado.utilidad > 0) {
        setMontoDistribuir(resultado.utilidad.toFixed(2));
      } else {
        setMontoDistribuir("");
      }
    } catch (errorConsultar: any) {
      console.error("Error consultando utilidad:", errorConsultar);

      const mensaje =
        errorConsultar?.response?.data?.message ||
        "No se pudo calcular la utilidad del período.";

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: mensaje,
      });
    } finally {
      setConsultando(false);
    }
  };

  /* =====================================================
     SIMULAR DISTRIBUCIÓN
  ===================================================== */

  const handleSimular = async () => {
    const monto = Number(montoDistribuir);

    if (!periodo) {
      await Swal.fire("Atención", "Seleccione un período.", "warning");

      return;
    }

    if (!Number.isFinite(monto) || monto <= 0) {
      await Swal.fire(
        "Atención",
        "El monto a distribuir debe ser mayor que cero.",
        "warning",
      );

      return;
    }

    try {
      setSimulando(true);

      const resultado = await calcularDistribucionUtilidad(periodo, monto);

      setCalculo(resultado);

      setUtilidadPeriodo({
        periodo: resultado.periodo,

        fecha_inicio: "",

        fecha_fin: "",

        total_ingresos: resultado.total_ingresos,

        total_egresos: resultado.total_egresos,

        utilidad: resultado.utilidad_periodo,
      });
    } catch (errorSimular: any) {
      console.error("Error simulando distribución:", errorSimular);

      await Swal.fire({
        icon: "error",
        title: "No se pudo calcular",

        text:
          errorSimular?.response?.data?.message ||
          "No se pudo simular la distribución.",
      });
    } finally {
      setSimulando(false);
    }
  };

  /* =====================================================
     GENERAR DISTRIBUCIÓN
  ===================================================== */

  const handleGenerar = async () => {
    if (!calculo) {
      await Swal.fire({
        icon: "warning",
        title: "Primero simule la distribución",
        text: "Debe revisar el cálculo antes de generar las distribuciones.",
      });

      return;
    }

    const confirmacion = await Swal.fire({
      icon: "question",

      title: "¿Generar distribución?",

      html: `
            <div style="text-align:left">
              <p>
                <strong>Periodo:</strong>
                ${formatearPeriodo(periodo)}
              </p>

              <p>
                <strong>Utilidad:</strong>
                ${formatearDinero(calculo.utilidad_periodo)}
              </p>

              <p>
                <strong>Monto a distribuir:</strong>
                ${formatearDinero(calculo.monto_distribuir)}
              </p>

              <p>
                <strong>Socios:</strong>
                ${calculo.total_socios}
              </p>
            </div>
          `,

      showCancelButton: true,

      confirmButtonText: "Sí, generar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#16a34a",
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      setGenerando(true);

      await generarDistribucionUtilidad({
        periodo,

        monto_distribuir: Number(montoDistribuir),

        observaciones: observaciones.trim() || null,
      });

      await cargarDatos();

      setCalculo(null);

      setObservaciones("");

      await Swal.fire({
        icon: "success",

        title: "Distribución generada",

        text: "Las utilidades fueron distribuidas correctamente entre los socios.",

        timer: 2200,

        showConfirmButton: false,

        timerProgressBar: true,
      });
    } catch (errorGenerar: any) {
      console.error("Error generando distribución:", errorGenerar);

      await Swal.fire({
        icon: "error",

        title: "No se pudo generar",

        text:
          errorGenerar?.response?.data?.message ||
          "Ocurrió un error al generar la distribución.",
      });
    } finally {
      setGenerando(false);
    }
  };

  /* =====================================================
     VER DISTRIBUCIÓN
  ===================================================== */

  const handleVer = async (distribucion: DistribucionUtilidad) => {
    await Swal.fire({
      title: "Detalle de utilidad",

      html: `
        <div style="text-align:left; line-height:1.8">

          <p>
            <strong>Socio:</strong>
            ${distribucion.socio_nombre || "No disponible"}
          </p>

          <p>
            <strong>Periodo:</strong>
            ${formatearPeriodo(distribucion.periodo)}
          </p>

          <p>
            <strong>Utilidad del periodo:</strong>
            ${formatearDinero(distribucion.utilidad_periodo)}
          </p>

          <p>
            <strong>Base distribuida:</strong>
            ${formatearDinero(distribucion.utilidad_base)}
          </p>

          <p>
            <strong>Participación aplicada:</strong>
            ${Number(distribucion.porcentaje_aplicado || 0).toFixed(2)}%
          </p>

          <p>
            <strong>Monto:</strong>
            ${formatearDinero(distribucion.monto)}
          </p>

          <p>
            <strong>Estado:</strong>
            ${capitalizar(distribucion.estado)}
          </p>

          <p>
            <strong>Cuenta:</strong>
            ${distribucion.cuenta_nombre || "Sin cuenta asignada"}
          </p>

          <p>
            <strong>Método:</strong>
            ${capitalizar(distribucion.metodo_pago)}
          </p>

          <p>
            <strong>Fecha de pago:</strong>
            ${distribucion.fecha_pago || "Pendiente"}
          </p>

          <p>
            <strong>Referencia:</strong>
            ${distribucion.referencia || "Sin referencia"}
          </p>

        </div>
      `,

      icon: "info",

      confirmButtonText: "Cerrar",
    });
  };

  /* =====================================================
     PAGAR UTILIDAD
  ===================================================== */

  const handlePagar = async (distribucion: DistribucionUtilidad) => {
    if (distribucion.estado !== "pendiente") {
      return;
    }

    if (cuentas.length === 0) {
      await Swal.fire({
        icon: "warning",

        title: "No existen cuentas",

        text: "Debe existir al menos una cuenta financiera activa.",
      });

      return;
    }

    const opcionesCuentas = cuentas.reduce(
      (opciones, cuenta) => {
        opciones[cuenta.id] = `${cuenta.nombre} - ${formatearDinero(
          cuenta.saldo_actual,
        )}`;

        return opciones;
      },
      {} as Record<string, string>,
    );

    const cuentaResultado = await Swal.fire({
      icon: "question",

      title: "Seleccionar cuenta",

      text: `Pago de ${formatearDinero(distribucion.monto)} a ${
        distribucion.socio_nombre
      }`,

      input: "select",

      inputOptions: opcionesCuentas,

      inputPlaceholder: "Seleccione una cuenta",

      showCancelButton: true,

      confirmButtonText: "Continuar",

      cancelButtonText: "Cancelar",

      inputValidator: (value) => {
        if (!value) {
          return "Seleccione una cuenta financiera.";
        }

        return undefined;
      },
    });

    if (!cuentaResultado.isConfirmed || !cuentaResultado.value) {
      return;
    }

    const metodoResultado = await Swal.fire({
      title: "Método de pago",

      input: "select",

      inputOptions: {
        efectivo: "Efectivo",

        transferencia: "Transferencia",

        deposito: "Depósito",

        cheque: "Cheque",
      },

      inputPlaceholder: "Seleccione método",

      showCancelButton: true,

      confirmButtonText: "Continuar",

      inputValidator: (value) => {
        if (!value) {
          return "Seleccione el método de pago.";
        }

        return undefined;
      },
    });

    if (!metodoResultado.isConfirmed || !metodoResultado.value) {
      return;
    }

    const referenciaResultado = await Swal.fire({
      title: "Referencia",

      input: "text",

      inputLabel: "Referencia del pago (opcional)",

      inputPlaceholder: "Ejemplo: TRX-001",

      showCancelButton: true,

      confirmButtonText: "Continuar",

      cancelButtonText: "Cancelar",
    });

    if (!referenciaResultado.isConfirmed) {
      return;
    }

    const confirmacion = await Swal.fire({
      icon: "warning",

      title: "Confirmar pago",

      html: `
          <div style="text-align:left">
            <p>
              <strong>Socio:</strong>
              ${distribucion.socio_nombre}
            </p>

            <p>
              <strong>Monto:</strong>
              ${formatearDinero(distribucion.monto)}
            </p>

            <p>
              <strong>Periodo:</strong>
              ${formatearPeriodo(distribucion.periodo)}
            </p>
          </div>
        `,

      showCancelButton: true,

      confirmButtonText: "Sí, pagar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#16a34a",
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      setProcesandoId(distribucion.id);

      await pagarDistribucionUtilidad(distribucion.id, {
        cuenta_id: cuentaResultado.value,

        fecha_pago: obtenerFechaActual(),

        metodo_pago: metodoResultado.value,

        referencia: referenciaResultado.value || null,
      });

      await cargarDatos();

      await Swal.fire({
        icon: "success",

        title: "Utilidad pagada",

        text: "El pago fue registrado y la cuenta financiera fue actualizada.",

        timer: 2200,

        showConfirmButton: false,

        timerProgressBar: true,
      });
    } catch (errorPago: any) {
      console.error("Error pagando utilidad:", errorPago);

      await Swal.fire({
        icon: "error",

        title: "No se pudo pagar",

        text:
          errorPago?.response?.data?.message ||
          "Ocurrió un error al realizar el pago.",
      });
    } finally {
      setProcesandoId(null);
    }
  };

  /* =====================================================
     ANULAR
  ===================================================== */

  const handleAnular = async (distribucion: DistribucionUtilidad) => {
    if (distribucion.estado !== "pendiente") {
      return;
    }

    const resultado = await Swal.fire({
      icon: "warning",

      title: "¿Anular distribución?",

      text: `Se anulará la utilidad pendiente de ${distribucion.socio_nombre}.`,

      showCancelButton: true,

      confirmButtonText: "Sí, anular",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      setProcesandoId(distribucion.id);

      await anularDistribucionUtilidad(distribucion.id);

      await cargarDatos();

      await Swal.fire({
        icon: "success",

        title: "Distribución anulada",

        timer: 1800,

        showConfirmButton: false,
      });
    } catch (errorAnular: any) {
      await Swal.fire({
        icon: "error",

        title: "No se pudo anular",

        text: errorAnular?.response?.data?.message || "Ocurrió un error.",
      });
    } finally {
      setProcesandoId(null);
    }
  };

  /* =====================================================
     KPIs
  ===================================================== */

  const totalHistorico = useMemo(
    () =>
      distribuciones
        .filter((item) => item.estado !== "anulado")
        .reduce((total, item) => total + Number(item.monto || 0), 0),
    [distribuciones],
  );

  /* =====================================================
     EXPORTAR CSV
  ===================================================== */

  const handleExportar = () => {
    if (distribuciones.length === 0) {
      Swal.fire({
        icon: "info",

        title: "Sin registros",

        text: "No existen distribuciones para exportar.",
      });

      return;
    }

    const encabezados = [
      "Socio",
      "Periodo",
      "Utilidad periodo",
      "Base distribución",
      "Porcentaje",
      "Monto",
      "Estado",
      "Cuenta",
      "Método pago",
      "Fecha pago",
      "Referencia",
    ];

    const filas = distribuciones.map((item) => [
      item.socio_nombre,

      item.periodo,

      Number(item.utilidad_periodo || 0).toFixed(2),

      Number(item.utilidad_base || 0).toFixed(2),

      Number(item.porcentaje_aplicado || 0).toFixed(2),

      Number(item.monto || 0).toFixed(2),

      item.estado,

      item.cuenta_nombre || "",

      item.metodo_pago || "",

      item.fecha_pago || "",

      item.referencia || "",
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => {
            const texto = String(valor).replace(/"/g, '""');

            return `"${texto}"`;
          })
          .join(","),
      )
      .join("\n");

    const archivo = new Blob([`\uFEFF${contenido}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = `utilidades-socios-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Utilidades de Socios
          </h1>

          <p className="mt-1 text-gray-500">
            Consulta, cálculo, distribución y pago de utilidades según la
            participación real de cada socio.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={handleExportar}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <FileDown size={18} />
            Exportar
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPIs HISTÓRICOS */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total distribuido</p>

          <h2 className="mt-1 text-2xl font-bold text-blue-600">
            {formatearDinero(resumen.total_distribuido)}
          </h2>

          <PieChart className="mt-2 text-blue-600" />
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total pagado</p>

          <h2 className="mt-1 text-2xl font-bold text-green-600">
            {formatearDinero(resumen.total_pagado)}
          </h2>

          <CheckCircle2 className="mt-2 text-green-600" />
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total pendiente</p>

          <h2 className="mt-1 text-2xl font-bold text-yellow-600">
            {formatearDinero(resumen.total_pendiente)}
          </h2>

          <Clock3 className="mt-2 text-yellow-600" />
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Histórico distribuido</p>

          <h2 className="mt-1 text-2xl font-bold text-purple-600">
            {formatearDinero(totalHistorico)}
          </h2>

          <DollarSign className="mt-2 text-purple-600" />
        </div>
      </div>

      {/* CONSULTA DEL PERIODO */}

      <div className="rounded-xl border bg-white p-6 shadow">
        <div className="mb-5 flex items-center gap-2">
          <Calculator className="text-blue-600" />

          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Calcular distribución
            </h2>

            <p className="text-sm text-gray-500">
              Consulta la utilidad real del período antes de generar la
              distribución.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Período
            </label>

            <input
              type="month"
              value={periodo}
              onChange={(event) => {
                setPeriodo(event.target.value);

                setUtilidadPeriodo(null);

                setCalculo(null);
              }}
              className="w-full rounded-lg border px-4 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Monto a distribuir
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={montoDistribuir}
              onChange={(event) => setMontoDistribuir(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border px-4 py-2"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Observaciones
            </label>

            <input
              type="text"
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              placeholder="Ejemplo: Distribución aprobada por socios"
              className="w-full rounded-lg border px-4 py-2"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConsultarUtilidad}
            disabled={consultando}
            className="rounded-lg border bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {consultando ? "Consultando..." : "Consultar utilidad"}
          </button>

          <button
            type="button"
            onClick={handleSimular}
            disabled={simulando}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {simulando ? "Calculando..." : "Simular distribución"}
          </button>

          <button
            type="button"
            onClick={handleGenerar}
            disabled={generando || !calculo}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generando ? "Generando..." : "Generar distribución"}
          </button>
        </div>
      </div>

      {/* RESULTADO FINANCIERO */}

      {utilidadPeriodo && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-green-50 p-5">
            <p className="text-sm text-green-700">Ingresos del período</p>

            <h3 className="mt-1 text-2xl font-bold text-green-700">
              {formatearDinero(utilidadPeriodo.total_ingresos)}
            </h3>

            <TrendingUp className="mt-2 text-green-600" />
          </div>

          <div className="rounded-xl border bg-red-50 p-5">
            <p className="text-sm text-red-700">Egresos del período</p>

            <h3 className="mt-1 text-2xl font-bold text-red-700">
              {formatearDinero(utilidadPeriodo.total_egresos)}
            </h3>

            <TrendingDown className="mt-2 text-red-600" />
          </div>

          <div
            className={`rounded-xl border p-5 ${
              utilidadPeriodo.utilidad >= 0 ? "bg-blue-50" : "bg-red-50"
            }`}
          >
            <p className="text-sm text-gray-600">Utilidad neta</p>

            <h3
              className={`mt-1 text-2xl font-bold ${
                utilidadPeriodo.utilidad >= 0 ? "text-blue-700" : "text-red-700"
              }`}
            >
              {formatearDinero(utilidadPeriodo.utilidad)}
            </h3>

            <Wallet className="mt-2 text-blue-600" />
          </div>
        </div>
      )}

      {/* SIMULACIÓN */}

      {calculo && (
        <div className="overflow-hidden rounded-xl border bg-white shadow">
          <div className="border-b p-5">
            <h2 className="font-semibold text-gray-800">
              Simulación de distribución
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Capital total: {formatearDinero(calculo.capital_total)} · Monto a
              distribuir: {formatearDinero(calculo.monto_distribuir)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Socio</th>

                  <th className="p-3 text-right">Capital neto</th>

                  <th className="p-3 text-right">Participación</th>

                  <th className="p-3 text-right">Utilidad estimada</th>
                </tr>
              </thead>

              <tbody>
                {calculo.socios.map((socio) => (
                  <tr
                    key={socio.socio_id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium">{socio.nombre}</td>

                    <td className="p-3 text-right text-blue-600">
                      {formatearDinero(socio.capital_neto)}
                    </td>

                    <td className="p-3 text-right">
                      {Number(socio.porcentaje_participacion).toFixed(2)}%
                    </td>

                    <td className="p-3 text-right font-bold text-green-600">
                      {formatearDinero(socio.monto_estimado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HISTÓRICO */}

      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold text-gray-800">
              Histórico de distribuciones
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Distribuciones generadas y pagos realizados.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {distribuciones.length} registros
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-gray-500">
            <RefreshCw className="animate-spin" />
            Cargando...
          </div>
        ) : distribuciones.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center text-gray-500">
            <PieChart size={40} className="mb-3 text-gray-300" />
            No existen distribuciones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Socio</th>

                  <th className="p-3 text-left">Período</th>

                  <th className="p-3 text-right">%</th>

                  <th className="p-3 text-right">Monto</th>

                  <th className="p-3 text-center">Estado</th>

                  <th className="p-3 text-left">Cuenta</th>

                  <th className="p-3 text-left">Fecha pago</th>

                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {distribuciones.map((item) => {
                  const procesando = procesandoId === item.id;

                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.socio_nombre}</td>

                      <td className="p-3">{formatearPeriodo(item.periodo)}</td>

                      <td className="p-3 text-right">
                        {Number(item.porcentaje_aplicado || 0).toFixed(2)}%
                      </td>

                      <td className="p-3 text-right font-bold text-green-600">
                        {formatearDinero(item.monto)}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            item.estado === "pagado"
                              ? "bg-green-100 text-green-700"
                              : item.estado === "pendiente"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {capitalizar(item.estado)}
                        </span>
                      </td>

                      <td className="p-3 text-sm text-gray-600">
                        {item.cuenta_nombre || "—"}
                      </td>

                      <td className="p-3 text-sm text-gray-600">
                        {item.fecha_pago || "—"}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleVer(item)}
                            disabled={procesando}
                            title="Ver detalle"
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-40"
                          >
                            <FaEye />
                          </button>

                          {item.estado === "pendiente" && (
                            <button
                              type="button"
                              onClick={() => handlePagar(item)}
                              disabled={procesando}
                              title="Pagar utilidad"
                              className="text-green-600 hover:text-green-800 disabled:opacity-40"
                            >
                              <FaMoneyBillWave />
                            </button>
                          )}

                          {item.estado === "pendiente" && (
                            <button
                              type="button"
                              onClick={() => handleAnular(item)}
                              disabled={procesando}
                              title="Anular distribución"
                              className="text-red-600 hover:text-red-800 disabled:opacity-40"
                            >
                              <FaBan />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        La participación utilizada en cada distribución se guarda como dato
        histórico. Si el capital de los socios cambia después, las
        distribuciones anteriores no se modifican.
      </div>
    </div>
  );
}

export default UtilidadesSocios;
