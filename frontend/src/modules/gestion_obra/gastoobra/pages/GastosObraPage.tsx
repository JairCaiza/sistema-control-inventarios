import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Edit,
  Eye,
  FileDown,
  FilterX,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  WalletCards,
  XCircle,
} from "lucide-react";

import Swal from "sweetalert2";

import api from "../../../../services/api";

import CreateGastoObraModal, {
  type ObraOption,
  type ControlDiarioOption,
} from "../components/CreateGastoObraModal";

import EditGastoObraModal from "../components/EditGastoObraModal";

import ConfirmarGastoObraModal, {
  type CuentaFinancieraOption,
} from "../components/ConfirmarGastoObraModal";

import GastoObraDetailModal from "../components/GastoObraDetailModal";

import {
  anularGastoObra,
  listarGastosObra,
  obtenerResumenGastos,
  type EstadoGastoObra,
  type FiltrosGastosObra,
  type GastoObra,
  type TipoGastoObra,
} from "../services/gastoObraService";

/* =====================================================
   CONFIG
===================================================== */

const LIMITE_POR_PAGINA = 10;

/* =====================================================
   TIPOS DE GASTO
===================================================== */

const TIPOS_GASTO: Array<{
  value: TipoGastoObra;
  label: string;
}> = [
  {
    value: "materiales",
    label: "Materiales",
  },
  {
    value: "transporte",
    label: "Transporte",
  },
  {
    value: "alimentacion",
    label: "Alimentación",
  },
  {
    value: "combustible",
    label: "Combustible",
  },
  {
    value: "herramientas",
    label: "Herramientas",
  },
  {
    value: "servicios",
    label: "Servicios",
  },
  {
    value: "mantenimiento",
    label: "Mantenimiento",
  },
  {
    value: "administrativo",
    label: "Administrativo",
  },
  {
    value: "otro",
    label: "Otro",
  },
];

/* =====================================================
   RESPUESTAS AUXILIARES
===================================================== */

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface ObraApi {
  id: string;
  codigo?: string | null;
  nombre?: string | null;
  estado?: string | null;
}

interface ControlApi {
  id: string;
  obra_id: string;
  fecha?: string | null;
  actividad?: string | null;
  descripcion?: string | null;
}

interface CuentaApi {
  id: string;
  nombre: string;
  tipo: string;
  saldo_actual: number | string;
  activo?: boolean;
  observaciones?: string | null;
}

/* =====================================================
   HELPERS
===================================================== */

const obtenerMensajeError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: {
          message?: string;
          errors?: Array<{
            mensaje?: string;
            message?: string;
          }>;
        };
      };
    };

    const errores = axiosError.response?.data?.errors;

    if (Array.isArray(errores) && errores.length > 0) {
      return errores
        .map((item) => item.mensaje || item.message)
        .filter(Boolean)
        .join("\n");
    }

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
};

const esError404 = (error: unknown): boolean => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        status?: number;
      };
    };

    return axiosError.response?.status === 404;
  }

  return false;
};

const extraerArray = <T,>(valor: unknown): T[] => {
  if (Array.isArray(valor)) {
    return valor as T[];
  }

  if (typeof valor === "object" && valor !== null) {
    const objeto = valor as Record<string, unknown>;

    if (Array.isArray(objeto.data)) {
      return objeto.data as T[];
    }

    if (typeof objeto.data === "object" && objeto.data !== null) {
      const dataObjeto = objeto.data as Record<string, unknown>;

      const candidatos = [
        "data",
        "items",
        "results",
        "obras",
        "cuentas",
        "controles",
      ];

      for (const candidato of candidatos) {
        if (Array.isArray(dataObjeto[candidato])) {
          return dataObjeto[candidato] as T[];
        }
      }
    }

    const candidatos = ["items", "results", "obras", "cuentas", "controles"];

    for (const candidato of candidatos) {
      if (Array.isArray(objeto[candidato])) {
        return objeto[candidato] as T[];
      }
    }
  }

  return [];
};

const intentarGet = async <T,>(rutas: string[]): Promise<T[]> => {
  let ultimoError: unknown = null;

  for (const ruta of rutas) {
    try {
      const response = await api.get<
        ApiResponse<T[]> | T[] | Record<string, unknown>
      >(ruta);

      return extraerArray<T>(response.data);
    } catch (error) {
      ultimoError = error;

      if (!esError404(error)) {
        throw error;
      }
    }
  }

  if (ultimoError) {
    throw ultimoError;
  }

  return [];
};

const formatearMoneda = (valor: number | string | null | undefined) => {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(numero);
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) {
    return "-";
  }

  const limpia = fecha.split("T")[0];

  const partes = limpia.split("-");

  if (partes.length !== 3) {
    return limpia;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const capitalizar = (valor?: string | null) => {
  if (!valor) {
    return "-";
  }

  return valor
    .replace(/_/g, " ")
    .split(" ")
    .map((palabra) =>
      palabra
        ? palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
        : palabra,
    )
    .join(" ");
};

const obtenerClaseEstado = (estado: EstadoGastoObra) => {
  switch (estado) {
    case "pagado":
      return `
                border-emerald-200
                bg-emerald-100
                text-emerald-700
            `;

    case "anulado":
      return `
                border-red-200
                bg-red-100
                text-red-700
            `;

    default:
      return `
                border-amber-200
                bg-amber-100
                text-amber-700
            `;
  }
};

const obtenerIconoEstado = (estado: EstadoGastoObra) => {
  switch (estado) {
    case "pagado":
      return CheckCircle2;

    case "anulado":
      return XCircle;

    default:
      return AlertCircle;
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

const GastosObraPage = () => {
  /* =================================================
       DATA PRINCIPAL
    ================================================= */

  const [gastos, setGastos] = useState<GastoObra[]>([]);

  const [obras, setObras] = useState<ObraOption[]>([]);

  const [controlesDiarios, setControlesDiarios] = useState<
    ControlDiarioOption[]
  >([]);

  const [cuentas, setCuentas] = useState<CuentaFinancieraOption[]>([]);

  /* =================================================
       LOADING
    ================================================= */

  const [cargando, setCargando] = useState(true);

  const [cargandoAuxiliares, setCargandoAuxiliares] = useState(false);

  /* =================================================
       FILTROS
    ================================================= */

  const [buscar, setBuscar] = useState("");

  const [filtroObra, setFiltroObra] = useState("");

  const [filtroTipo, setFiltroTipo] = useState<TipoGastoObra | "">("");

  const [filtroEstado, setFiltroEstado] = useState<EstadoGastoObra | "">("");

  const [fechaDesde, setFechaDesde] = useState("");

  const [fechaHasta, setFechaHasta] = useState("");

  /* =================================================
       PAGINACIÓN
    ================================================= */

  const [pagina, setPagina] = useState(1);

  const [totalPaginas, setTotalPaginas] = useState(1);

  const [totalRegistros, setTotalRegistros] = useState(0);

  /* =================================================
       KPIs
    ================================================= */

  const [resumenGeneral, setResumenGeneral] = useState({
    total_registros: 0,
    obras_con_gastos: 0,
    gastos_pendientes: 0,
    gastos_pagados: 0,
    gastos_anulados: 0,
    total_pagado: 0 as number | string,
    total_pendiente: 0 as number | string,
  });

  const [distribucionTipos, setDistribucionTipos] = useState<
    Array<{
      tipo: string;
      cantidad: number;
      total: number | string;
    }>
  >([]);

  /* =================================================
       MODALES
    ================================================= */

  const [createOpen, setCreateOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);

  const [confirmarOpen, setConfirmarOpen] = useState(false);

  const [gastoSeleccionadoId, setGastoSeleccionadoId] = useState<string | null>(
    null,
  );

  const [gastoSeleccionado, setGastoSeleccionado] = useState<GastoObra | null>(
    null,
  );

  /* =================================================
       FILTROS BACKEND
    ================================================= */

  const filtrosBackend = useMemo<FiltrosGastosObra>(
    () => ({
      buscar: buscar.trim() || undefined,

      obra_id: filtroObra || undefined,

      tipo: filtroTipo || undefined,

      estado: filtroEstado || undefined,

      fecha_desde: fechaDesde || undefined,

      fecha_hasta: fechaHasta || undefined,

      page: pagina,

      limit: LIMITE_POR_PAGINA,
    }),
    [
      buscar,
      filtroObra,
      filtroTipo,
      filtroEstado,
      fechaDesde,
      fechaHasta,
      pagina,
    ],
  );

  /* =================================================
       CARGAR GASTOS
    ================================================= */

  const cargarGastos = useCallback(async () => {
    try {
      setCargando(true);

      const response = await listarGastosObra(filtrosBackend);

      setGastos(Array.isArray(response.data) ? response.data : []);

      setTotalRegistros(Number(response.pagination?.total ?? 0));

      setTotalPaginas(
        Math.max(1, Number(response.pagination?.totalPages ?? 1)),
      );
    } catch (error) {
      setGastos([]);

      await Swal.fire({
        icon: "error",
        title: "No se pudieron cargar los gastos",
        text: obtenerMensajeError(error),
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });
    } finally {
      setCargando(false);
    }
  }, [filtrosBackend]);

  /* =================================================
       CARGAR RESUMEN
    ================================================= */

  const cargarResumen = useCallback(async () => {
    try {
      const response = await obtenerResumenGastos({
        obra_id: filtroObra || undefined,

        fecha_desde: fechaDesde || undefined,

        fecha_hasta: fechaHasta || undefined,
      });

      if (response?.resumen) {
        setResumenGeneral({
          total_registros: Number(response.resumen.total_registros ?? 0),

          obras_con_gastos: Number(response.resumen.obras_con_gastos ?? 0),

          gastos_pendientes: Number(response.resumen.gastos_pendientes ?? 0),

          gastos_pagados: Number(response.resumen.gastos_pagados ?? 0),

          gastos_anulados: Number(response.resumen.gastos_anulados ?? 0),

          total_pagado: response.resumen.total_pagado ?? 0,

          total_pendiente: response.resumen.total_pendiente ?? 0,
        });
      }

      setDistribucionTipos(
        Array.isArray(response?.distribucion_tipos)
          ? response.distribucion_tipos
          : [],
      );
    } catch (error) {
      console.error("Error cargando resumen de gastos:", error);
    }
  }, [filtroObra, fechaDesde, fechaHasta]);

  /* =================================================
       CARGAR OBRAS
    ================================================= */

  const cargarObras = useCallback(async () => {
    const data = await intentarGet<ObraApi>(["/obras"]);

    const normalizadas = data
      .filter((obra) => obra.id && obra.nombre)
      .map(
        (obra): ObraOption => ({
          id: obra.id,

          codigo: obra.codigo ?? null,

          nombre: obra.nombre || "Obra sin nombre",

          estado: obra.estado ?? null,
        }),
      );

    setObras(normalizadas);
  }, []);

  /* =================================================
       CARGAR CUENTAS
    ================================================= */

  const cargarCuentas = useCallback(async () => {
    const data = await intentarGet<CuentaApi>([
      "/cuentas-financieras",
      "/cuentas",
    ]);

    const normalizadas = data
      .filter((cuenta) => cuenta.id && cuenta.nombre)
      .map(
        (cuenta): CuentaFinancieraOption => ({
          id: cuenta.id,

          nombre: cuenta.nombre,

          tipo: cuenta.tipo,

          saldo_actual: cuenta.saldo_actual ?? 0,

          activo: cuenta.activo !== false,

          observaciones: cuenta.observaciones ?? null,
        }),
      );

    setCuentas(normalizadas);
  }, []);

  /* =================================================
       CARGAR CONTROLES
    ================================================= */

  const cargarControles = useCallback(
    async (obrasDisponibles: ObraOption[]) => {
      if (obrasDisponibles.length === 0) {
        setControlesDiarios([]);

        return;
      }

      const resultados: ControlDiarioOption[] = [];

      /*
       * Primero intentamos un endpoint general.
       * Si tu backend no lo tiene, pasamos al
       * endpoint por obra.
       */

      try {
        const generales = await intentarGet<ControlApi>([
          "/obras/controles-diarios",
          "/controles-diarios",
        ]);

        if (generales.length > 0) {
          setControlesDiarios(
            generales.map(
              (control): ControlDiarioOption => ({
                id: control.id,

                obra_id: control.obra_id,

                fecha: control.fecha ?? null,

                actividad: control.actividad ?? null,

                descripcion: control.descripcion ?? null,
              }),
            ),
          );

          return;
        }
      } catch (error) {
        if (!esError404(error)) {
          console.warn("No se pudieron cargar controles generales:", error);
        }
      }

      /*
       * Fallback:
       * buscar controles obra por obra.
       */

      for (const obra of obrasDisponibles) {
        try {
          const controles = await intentarGet<ControlApi>([
            `/obras/${obra.id}/controles-diarios`,
            `/controles-diarios/obra/${obra.id}`,
          ]);

          controles.forEach((control) => {
            resultados.push({
              id: control.id,

              obra_id: control.obra_id || obra.id,

              fecha: control.fecha ?? null,

              actividad: control.actividad ?? null,

              descripcion: control.descripcion ?? null,
            });
          });
        } catch (error) {
          if (!esError404(error)) {
            console.warn(
              `No se pudieron cargar controles de la obra ${obra.id}`,
              error,
            );
          }
        }
      }

      setControlesDiarios(resultados);
    },
    [],
  );

  /* =================================================
       CARGAR DATOS AUXILIARES
    ================================================= */

  const cargarAuxiliares = useCallback(async () => {
    try {
      setCargandoAuxiliares(true);

      let obrasActuales: ObraOption[] = [];

      try {
        const dataObras = await intentarGet<ObraApi>(["/obras"]);

        obrasActuales = dataObras
          .filter((obra) => obra.id && obra.nombre)
          .map(
            (obra): ObraOption => ({
              id: obra.id,

              codigo: obra.codigo ?? null,

              nombre: obra.nombre || "Obra sin nombre",

              estado: obra.estado ?? null,
            }),
          );

        setObras(obrasActuales);
      } catch (error) {
        console.error("Error cargando obras:", error);
      }

      try {
        await cargarCuentas();
      } catch (error) {
        console.error("Error cargando cuentas:", error);
      }

      try {
        await cargarControles(obrasActuales);
      } catch (error) {
        console.error("Error cargando controles:", error);
      }
    } finally {
      setCargandoAuxiliares(false);
    }
  }, [cargarCuentas, cargarControles]);

  /* =================================================
       EFECTO INICIAL AUXILIARES
    ================================================= */

  useEffect(() => {
    void cargarAuxiliares();
  }, [cargarAuxiliares]);

  /* =================================================
       EFECTO LISTA
    ================================================= */

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void cargarGastos();
      },
      buscar ? 350 : 0,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [cargarGastos, buscar]);

  /* =================================================
       EFECTO RESUMEN
    ================================================= */

  useEffect(() => {
    void cargarResumen();
  }, [cargarResumen]);

  /* =================================================
       VOLVER A PÁGINA 1 AL FILTRAR
    ================================================= */

  useEffect(() => {
    setPagina(1);
  }, [buscar, filtroObra, filtroTipo, filtroEstado, fechaDesde, fechaHasta]);

  /* =================================================
       REFRESCAR TODO
    ================================================= */

  const refrescarTodo = useCallback(async () => {
    await Promise.all([cargarGastos(), cargarResumen(), cargarAuxiliares()]);
  }, [cargarGastos, cargarResumen, cargarAuxiliares]);

  /* =================================================
       LIMPIAR FILTROS
    ================================================= */

  const limpiarFiltros = () => {
    setBuscar("");
    setFiltroObra("");
    setFiltroTipo("");
    setFiltroEstado("");
    setFechaDesde("");
    setFechaHasta("");
    setPagina(1);
  };

  /* =================================================
       ABRIR DETALLE
    ================================================= */

  const handleDetalle = (gasto: GastoObra) => {
    setGastoSeleccionadoId(gasto.id);

    setDetailOpen(true);
  };

  /* =================================================
       ABRIR EDITAR
    ================================================= */

  const handleEditar = (gasto: GastoObra) => {
    if (gasto.estado !== "pendiente") {
      void Swal.fire({
        icon: "info",
        title: "Gasto no editable",
        text: "Solo los gastos pendientes pueden modificarse.",
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });

      return;
    }

    setGastoSeleccionadoId(gasto.id);

    setEditOpen(true);
  };

  /* =================================================
       ABRIR CONFIRMAR
    ================================================= */

  const handleConfirmar = (gasto: GastoObra) => {
    if (gasto.estado !== "pendiente") {
      return;
    }

    setGastoSeleccionado(gasto);

    setConfirmarOpen(true);
  };

  /* =================================================
       ANULAR
    ================================================= */

  const handleAnular = async (gasto: GastoObra) => {
    if (gasto.estado === "anulado") {
      return;
    }

    const esPagado = gasto.estado === "pagado";

    const resultado = await Swal.fire({
      icon: esPagado ? "warning" : "question",

      title: esPagado ? "¿Anular gasto pagado?" : "¿Anular gasto?",

      html: esPagado
        ? `
                                <div style="text-align:left;line-height:1.6">
                                    <p>
                                        Este gasto ya generó un egreso por
                                        <strong>${formatearMoneda(
                                          gasto.monto,
                                        )}</strong>.
                                    </p>

                                    <p style="margin-top:8px;color:#b45309">
                                        Al anularlo, el backend creará una
                                        transacción compensatoria de ingreso
                                        y devolverá el dinero a la cuenta.
                                    </p>
                                </div>
                            `
        : `
                                <div style="text-align:left;line-height:1.6">
                                    <p>
                                        El gasto está pendiente y todavía
                                        no ha generado movimiento financiero.
                                    </p>
                                </div>
                            `,

      input: "textarea",

      inputLabel: "Motivo de anulación",

      inputPlaceholder: "Ingrese el motivo...",

      inputAttributes: {
        maxlength: "500",
      },

      showCancelButton: true,

      confirmButtonText: esPagado ? "Anular y revertir" : "Anular gasto",

      cancelButtonText: "Cancelar",

      reverseButtons: true,

      heightAuto: false,

      preConfirm: (value) => {
        const motivo = String(value || "").trim();

        if (motivo.length < 3) {
          Swal.showValidationMessage(
            "Ingrese un motivo de al menos 3 caracteres.",
          );

          return false;
        }

        return motivo;
      },
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      await anularGastoObra(gasto.id, {
        motivo: String(resultado.value).trim(),
      });

      await Swal.fire({
        icon: "success",
        title: "Gasto anulado",
        text: esPagado
          ? "El gasto fue anulado y el movimiento financiero fue revertido correctamente."
          : "El gasto pendiente fue anulado correctamente.",
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });

      await refrescarTodo();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo anular",
        text: obtenerMensajeError(error),
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });
    }
  };

  /* =================================================
       EXPORTAR CSV
    ================================================= */

  const handleExportar = () => {
    if (gastos.length === 0) {
      void Swal.fire({
        icon: "info",
        title: "Sin datos",
        text: "No existen gastos visibles para exportar.",
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });

      return;
    }

    const encabezados = [
      "Fecha",
      "Obra",
      "Tipo",
      "Descripción",
      "Cuenta",
      "Monto",
      "Estado",
      "Referencia",
    ];

    const escapar = (valor: unknown) => {
      const texto = String(valor ?? "").replace(/"/g, '""');

      return `"${texto}"`;
    };

    const filas = gastos.map((gasto) => [
      gasto.fecha,
      gasto.obra_nombre || gasto.obra_id,
      capitalizar(gasto.tipo),
      gasto.descripcion,
      gasto.cuenta_nombre || "",
      Number(gasto.monto).toFixed(2),
      capitalizar(gasto.estado),
      gasto.referencia || "",
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map(escapar).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF", contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = `gastos-obra-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    URL.revokeObjectURL(url);
  };

  /* =================================================
       DISTRIBUCIÓN
    ================================================= */

  const totalDistribucion = useMemo(
    () =>
      distribucionTipos.reduce(
        (acumulado, item) => acumulado + Number(item.total || 0),
        0,
      ),
    [distribucionTipos],
  );

  /* =================================================
       RANGO PAGINACIÓN
    ================================================= */

  const desdeRegistro =
    totalRegistros === 0 ? 0 : (pagina - 1) * LIMITE_POR_PAGINA + 1;

  const hastaRegistro = Math.min(pagina * LIMITE_POR_PAGINA, totalRegistros);

  /* =================================================
       UI
    ================================================= */

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
                    flex flex-col
                    gap-4
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                "
      >
        <div>
          <h1
            className="
                            text-3xl
                            font-bold
                            text-gray-800
                        "
          >
            Gastos de Obra
          </h1>

          <p
            className="
                            mt-1
                            text-gray-500
                        "
          >
            Control de gastos operativos, pagos y trazabilidad financiera de
            cada obra.
          </p>
        </div>

        <div
          className="
                        flex
                        flex-wrap
                        gap-3
                    "
        >
          <button
            type="button"
            onClick={() => void refrescarTodo()}
            disabled={cargando || cargandoAuxiliares}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-lg
                            border
                            border-gray-300
                            bg-white
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-gray-700
                            transition
                            hover:bg-gray-50
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
          >
            <RefreshCw
              size={18}
              className={cargando || cargandoAuxiliares ? "animate-spin" : ""}
            />
            Actualizar
          </button>

          <button
            type="button"
            onClick={handleExportar}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-lg
                            bg-red-600
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-red-700
                        "
          >
            <FileDown size={18} />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-lg
                            bg-[var(--color-primary)]
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:opacity-90
                        "
          >
            <Plus size={18} />
            Nuevo gasto
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
                    gap-5
                    md:grid-cols-2
                    xl:grid-cols-4
                "
      >
        {/* PAGADO */}

        <div
          className="
                        rounded-xl
                        border
                        bg-white
                        p-5
                        shadow-sm
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
                                    text-sm
                                    text-gray-500
                                "
              >
                Total pagado
              </p>

              <h2
                className="
                                    mt-2
                                    text-2xl
                                    font-bold
                                    text-gray-900
                                "
              >
                {formatearMoneda(resumenGeneral.total_pagado)}
              </h2>

              <p
                className="
                                    mt-1
                                    text-xs
                                    text-gray-500
                                "
              >
                {resumenGeneral.gastos_pagados} gastos confirmados
              </p>
            </div>

            <div
              className="
                                rounded-full
                                bg-red-100
                                p-3
                            "
            >
              <CircleDollarSign
                className="
                                    text-red-600
                                "
              />
            </div>
          </div>
        </div>

        {/* PENDIENTE */}

        <div
          className="
                        rounded-xl
                        border
                        bg-white
                        p-5
                        shadow-sm
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
                                    text-sm
                                    text-gray-500
                                "
              >
                Pendiente por pagar
              </p>

              <h2
                className="
                                    mt-2
                                    text-2xl
                                    font-bold
                                    text-gray-900
                                "
              >
                {formatearMoneda(resumenGeneral.total_pendiente)}
              </h2>

              <p
                className="
                                    mt-1
                                    text-xs
                                    text-gray-500
                                "
              >
                {resumenGeneral.gastos_pendientes} pendientes
              </p>
            </div>

            <div
              className="
                                rounded-full
                                bg-amber-100
                                p-3
                            "
            >
              <TrendingDown
                className="
                                    text-amber-600
                                "
              />
            </div>
          </div>
        </div>

        {/* REGISTROS */}

        <div
          className="
                        rounded-xl
                        border
                        bg-white
                        p-5
                        shadow-sm
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
                                    text-sm
                                    text-gray-500
                                "
              >
                Total registros
              </p>

              <h2
                className="
                                    mt-2
                                    text-3xl
                                    font-bold
                                    text-gray-900
                                "
              >
                {resumenGeneral.total_registros}
              </h2>

              <p
                className="
                                    mt-1
                                    text-xs
                                    text-gray-500
                                "
              >
                {resumenGeneral.gastos_anulados} anulados
              </p>
            </div>

            <div
              className="
                                rounded-full
                                bg-emerald-100
                                p-3
                            "
            >
              <ClipboardList
                className="
                                    text-emerald-600
                                "
              />
            </div>
          </div>
        </div>

        {/* OBRAS */}

        <div
          className="
                        rounded-xl
                        border
                        bg-white
                        p-5
                        shadow-sm
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
                                    text-sm
                                    text-gray-500
                                "
              >
                Obras con gastos
              </p>

              <h2
                className="
                                    mt-2
                                    text-3xl
                                    font-bold
                                    text-gray-900
                                "
              >
                {resumenGeneral.obras_con_gastos}
              </h2>

              <p
                className="
                                    mt-1
                                    text-xs
                                    text-gray-500
                                "
              >
                Obras afectadas
              </p>
            </div>

            <div
              className="
                                rounded-full
                                bg-blue-100
                                p-3
                            "
            >
              <Building2
                className="
                                    text-blue-600
                                "
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
                FILTROS
            ================================================= */}

      <div
        className="
                    rounded-xl
                    border
                    bg-white
                    p-5
                    shadow-sm
                "
      >
        <div
          className="
                        mb-4
                        flex
                        items-center
                        justify-between
                    "
        >
          <div>
            <h2
              className="
                                font-semibold
                                text-gray-800
                            "
            >
              Filtros
            </h2>

            <p
              className="
                                text-sm
                                text-gray-500
                            "
            >
              Busca y filtra los gastos registrados.
            </p>
          </div>

          <button
            type="button"
            onClick={limpiarFiltros}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-lg
                            px-3
                            py-2
                            text-sm
                            font-medium
                            text-gray-600
                            transition
                            hover:bg-gray-100
                        "
          >
            <FilterX size={17} />
            Limpiar
          </button>
        </div>

        <div
          className="
                        grid
                        grid-cols-1
                        gap-4
                        lg:grid-cols-6
                    "
        >
          {/* BUSCAR */}

          <div
            className="
                            relative
                            lg:col-span-2
                        "
          >
            <Search
              size={18}
              className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-gray-400
                            "
            />

            <input
              type="text"
              placeholder="Buscar descripción, obra..."
              value={buscar}
              onChange={(event) => setBuscar(event.target.value)}
              className="
                                w-full
                                rounded-lg
                                border
                                border-gray-300
                                py-2.5
                                pl-10
                                pr-4
                                text-sm
                                outline-none
                                transition
                                focus:border-[var(--color-primary)]
                                focus:ring-2
                                focus:ring-[var(--color-primary)]/20
                            "
            />
          </div>

          {/* OBRA */}

          <select
            value={filtroObra}
            onChange={(event) => setFiltroObra(event.target.value)}
            className="
                            rounded-lg
                            border
                            border-gray-300
                            bg-white
                            px-3
                            py-2.5
                            text-sm
                            outline-none
                            focus:ring-2
                            focus:ring-[var(--color-primary)]/20
                        "
          >
            <option value="">Todas las obras</option>

            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.codigo ? `${obra.codigo} - ` : ""}
                {obra.nombre}
              </option>
            ))}
          </select>

          {/* TIPO */}

          <select
            value={filtroTipo}
            onChange={(event) =>
              setFiltroTipo(event.target.value as TipoGastoObra | "")
            }
            className="
                            rounded-lg
                            border
                            border-gray-300
                            bg-white
                            px-3
                            py-2.5
                            text-sm
                            outline-none
                            focus:ring-2
                            focus:ring-[var(--color-primary)]/20
                        "
          >
            <option value="">Todos los tipos</option>

            {TIPOS_GASTO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>

          {/* ESTADO */}

          <select
            value={filtroEstado}
            onChange={(event) =>
              setFiltroEstado(event.target.value as EstadoGastoObra | "")
            }
            className="
                            rounded-lg
                            border
                            border-gray-300
                            bg-white
                            px-3
                            py-2.5
                            text-sm
                            outline-none
                            focus:ring-2
                            focus:ring-[var(--color-primary)]/20
                        "
          >
            <option value="">Todos los estados</option>

            <option value="pendiente">Pendiente</option>

            <option value="pagado">Pagado</option>

            <option value="anulado">Anulado</option>
          </select>

          {/* DESDE */}

          <div
            className="
                            relative
                        "
          >
            <CalendarDays
              size={17}
              className="
                                pointer-events-none
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-gray-400
                            "
            />

            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              className="
                                w-full
                                rounded-lg
                                border
                                border-gray-300
                                py-2.5
                                pl-10
                                pr-2
                                text-sm
                                outline-none
                            "
              title="Fecha desde"
            />
          </div>
        </div>

        <div
          className="
                        mt-4
                        grid
                        grid-cols-1
                        gap-4
                        sm:grid-cols-2
                        lg:grid-cols-6
                    "
        >
          <div
            className="
                            relative
                            lg:col-start-6
                        "
          >
            <CalendarDays
              size={17}
              className="
                                pointer-events-none
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-gray-400
                            "
            />

            <input
              type="date"
              value={fechaHasta}
              onChange={(event) => setFechaHasta(event.target.value)}
              className="
                                w-full
                                rounded-lg
                                border
                                border-gray-300
                                py-2.5
                                pl-10
                                pr-2
                                text-sm
                                outline-none
                            "
              title="Fecha hasta"
            />
          </div>
        </div>
      </div>

      {/* =================================================
                TABLA
            ================================================= */}

      <div
        className="
                    overflow-hidden
                    rounded-xl
                    border
                    bg-white
                    shadow-sm
                "
      >
        <div
          className="
                        flex
                        flex-col
                        gap-2
                        border-b
                        px-5
                        py-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                    "
        >
          <div>
            <h2
              className="
                                text-lg
                                font-semibold
                                text-gray-800
                            "
            >
              Registro de gastos
            </h2>

            <p
              className="
                                mt-1
                                text-sm
                                text-gray-500
                            "
            >
              Los gastos pendientes no afectan caja hasta que se confirme su
              pago.
            </p>
          </div>

          <div
            className="
                            text-sm
                            text-gray-500
                        "
          >
            {totalRegistros} registros
          </div>
        </div>

        <div
          className="
                        overflow-x-auto
                    "
        >
          <table
            className="
                            w-full
                            min-w-[1100px]
                        "
          >
            <thead
              className="
                                bg-gray-50
                            "
            >
              <tr>
                <th
                  className="
                                        px-4
                                        py-3
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                >
                  Fecha
                </th>

                <th
                  className="
                                        px-4
                                        py-3
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                >
                  Obra
                </th>

                <th
                  className="
                                        px-4
                                        py-3
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                >
                  Tipo
                </th>

                <th
                  className="
                                        px-4
                                        py-3
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                >
                  Descripción
                </th>

                <th
                  className="
                                        px-4
                                        py-3
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                >
                  Cuenta
                </th>

                <th
                  className="
                                        px-4
                                        py-3
                                        text-right
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                >
                  Monto
                </th>

                <th
                  className="
                                        px-4
                                        py-3
                                        text-center
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                >
                  Estado
                </th>

                <th
                  className="
                                        px-4
                                        py-3
                                        text-center
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}

              {cargando && (
                <tr>
                  <td
                    colSpan={8}
                    className="
                                            px-4
                                            py-14
                                            text-center
                                        "
                  >
                    <div
                      className="
                                                flex
                                                flex-col
                                                items-center
                                                justify-center
                                                gap-3
                                                text-gray-500
                                            "
                    >
                      <Loader2
                        size={28}
                        className="
                                                    animate-spin
                                                "
                      />

                      <span
                        className="
                                                    text-sm
                                                "
                      >
                        Cargando gastos...
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {/* VACÍO */}

              {!cargando && gastos.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="
                                                px-4
                                                py-14
                                                text-center
                                            "
                  >
                    <div
                      className="
                                                    flex
                                                    flex-col
                                                    items-center
                                                    gap-3
                                                "
                    >
                      <ClipboardList
                        size={34}
                        className="
                                                        text-gray-300
                                                    "
                      />

                      <div>
                        <p
                          className="
                                                            font-medium
                                                            text-gray-700
                                                        "
                        >
                          No hay gastos registrados
                        </p>

                        <p
                          className="
                                                            mt-1
                                                            text-sm
                                                            text-gray-500
                                                        "
                        >
                          Modifica los filtros o registra un nuevo gasto.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* FILAS */}

              {!cargando &&
                gastos.map((gasto) => {
                  const EstadoIcon = obtenerIconoEstado(gasto.estado);

                  return (
                    <tr
                      key={gasto.id}
                      className="
                                                    border-t
                                                    transition
                                                    hover:bg-gray-50
                                                "
                    >
                      {/* FECHA */}

                      <td
                        className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                    "
                      >
                        <div
                          className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                            text-sm
                                                            text-gray-700
                                                        "
                        >
                          <CalendarDays
                            size={16}
                            className="
                                                                text-gray-400
                                                            "
                          />

                          {formatearFecha(gasto.fecha)}
                        </div>

                        <p
                          className="
                                                            mt-1
                                                            max-w-[120px]
                                                            truncate
                                                            font-mono
                                                            text-[10px]
                                                            text-gray-400
                                                        "
                          title={gasto.id}
                        >
                          {gasto.id}
                        </p>
                      </td>

                      {/* OBRA */}

                      <td
                        className="
                                                        px-4
                                                        py-4
                                                    "
                      >
                        <p
                          className="
                                                            max-w-[220px]
                                                            font-medium
                                                            text-gray-800
                                                        "
                        >
                          {gasto.obra_codigo ? `${gasto.obra_codigo} - ` : ""}

                          {gasto.obra_nombre || gasto.obra_id}
                        </p>

                        <p
                          className="
                                                            mt-1
                                                            max-w-[220px]
                                                            truncate
                                                            text-xs
                                                            text-gray-500
                                                        "
                        >
                          {gasto.control_diario_id
                            ? gasto.control_diario_actividad ||
                              gasto.control_diario_descripcion ||
                              "Control diario vinculado"
                            : "Sin control diario"}
                        </p>
                      </td>

                      {/* TIPO */}

                      <td
                        className="
                                                        px-4
                                                        py-4
                                                    "
                      >
                        <span
                          className="
                                                            inline-flex
                                                            rounded-full
                                                            bg-blue-100
                                                            px-2.5
                                                            py-1
                                                            text-xs
                                                            font-medium
                                                            text-blue-700
                                                        "
                        >
                          {capitalizar(gasto.tipo)}
                        </span>
                      </td>

                      {/* DESCRIPCIÓN */}

                      <td
                        className="
                                                        px-4
                                                        py-4
                                                    "
                      >
                        <p
                          className="
                                                            max-w-[260px]
                                                            font-medium
                                                            text-gray-700
                                                        "
                        >
                          {gasto.descripcion}
                        </p>

                        {gasto.referencia && (
                          <p
                            className="
                                                                mt-1
                                                                max-w-[260px]
                                                                truncate
                                                                text-xs
                                                                text-gray-500
                                                            "
                          >
                            Ref.: {gasto.referencia}
                          </p>
                        )}
                      </td>

                      {/* CUENTA */}

                      <td
                        className="
                                                        px-4
                                                        py-4
                                                    "
                      >
                        {gasto.cuenta_nombre ? (
                          <div
                            className="
                                                                flex
                                                                items-center
                                                                gap-2
                                                                text-sm
                                                                text-gray-700
                                                            "
                          >
                            <WalletCards
                              size={16}
                              className="
                                                                    text-gray-400
                                                                "
                            />

                            <span>{gasto.cuenta_nombre}</span>
                          </div>
                        ) : (
                          <span
                            className="
                                                                text-sm
                                                                text-gray-400
                                                            "
                          >
                            Sin cuenta
                          </span>
                        )}

                        {gasto.metodo_pago && (
                          <p
                            className="
                                                                mt-1
                                                                text-xs
                                                                text-gray-500
                                                            "
                          >
                            {capitalizar(gasto.metodo_pago)}
                          </p>
                        )}
                      </td>

                      {/* MONTO */}

                      <td
                        className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-right
                                                    "
                      >
                        <span
                          className={`
                                                            font-bold
                                                            ${
                                                              gasto.estado ===
                                                              "anulado"
                                                                ? "text-gray-400 line-through"
                                                                : gasto.estado ===
                                                                    "pagado"
                                                                  ? "text-red-600"
                                                                  : "text-amber-600"
                                                            }
                                                        `}
                        >
                          {gasto.estado === "pagado" ? "-" : ""}

                          {formatearMoneda(gasto.monto)}
                        </span>
                      </td>

                      {/* ESTADO */}

                      <td
                        className="
                                                        px-4
                                                        py-4
                                                        text-center
                                                    "
                      >
                        <span
                          className={`
                                                            inline-flex
                                                            items-center
                                                            gap-1.5
                                                            rounded-full
                                                            border
                                                            px-2.5
                                                            py-1
                                                            text-xs
                                                            font-medium
                                                            ${obtenerClaseEstado(
                                                              gasto.estado,
                                                            )}
                                                        `}
                        >
                          <EstadoIcon size={13} />

                          {capitalizar(gasto.estado)}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td
                        className="
                                                        px-4
                                                        py-4
                                                    "
                      >
                        <div
                          className="
                                                            flex
                                                            items-center
                                                            justify-center
                                                            gap-1
                                                        "
                        >
                          {/* DETALLE */}

                          <button
                            type="button"
                            onClick={() => handleDetalle(gasto)}
                            className="
                                                                rounded-lg
                                                                p-2
                                                                text-cyan-600
                                                                transition
                                                                hover:bg-cyan-50
                                                            "
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>

                          {/* EDITAR */}

                          <button
                            type="button"
                            onClick={() => handleEditar(gasto)}
                            disabled={gasto.estado !== "pendiente"}
                            className="
                                                                rounded-lg
                                                                p-2
                                                                text-blue-600
                                                                transition
                                                                hover:bg-blue-50
                                                                disabled:cursor-not-allowed
                                                                disabled:text-gray-300
                                                                disabled:hover:bg-transparent
                                                            "
                            title={
                              gasto.estado === "pendiente"
                                ? "Editar"
                                : "Solo los gastos pendientes pueden editarse"
                            }
                          >
                            <Edit size={18} />
                          </button>

                          {/* CONFIRMAR */}

                          {gasto.estado === "pendiente" && (
                            <button
                              type="button"
                              onClick={() => handleConfirmar(gasto)}
                              className="
                                                                    rounded-lg
                                                                    p-2
                                                                    text-emerald-600
                                                                    transition
                                                                    hover:bg-emerald-50
                                                                "
                              title="Confirmar pago"
                            >
                              <Banknote size={18} />
                            </button>
                          )}

                          {/* ANULAR */}

                          {gasto.estado !== "anulado" && (
                            <button
                              type="button"
                              onClick={() => void handleAnular(gasto)}
                              className="
                                                                    rounded-lg
                                                                    p-2
                                                                    text-red-600
                                                                    transition
                                                                    hover:bg-red-50
                                                                "
                              title={
                                gasto.estado === "pagado"
                                  ? "Anular y revertir pago"
                                  : "Anular gasto"
                              }
                            >
                              <XCircle size={18} />
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

        {/* =================================================
                    PAGINACIÓN
                ================================================= */}

        <div
          className="
                        flex
                        flex-col
                        gap-3
                        border-t
                        bg-gray-50
                        px-5
                        py-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                    "
        >
          <p
            className="
                            text-sm
                            text-gray-500
                        "
          >
            Mostrando{" "}
            <span
              className="
                                font-medium
                                text-gray-700
                            "
            >
              {desdeRegistro}
            </span>{" "}
            -{" "}
            <span
              className="
                                font-medium
                                text-gray-700
                            "
            >
              {hastaRegistro}
            </span>{" "}
            de{" "}
            <span
              className="
                                font-medium
                                text-gray-700
                            "
            >
              {totalRegistros}
            </span>
          </p>

          <div
            className="
                            flex
                            items-center
                            gap-2
                        "
          >
            <button
              type="button"
              onClick={() => setPagina((anterior) => Math.max(1, anterior - 1))}
              disabled={pagina <= 1 || cargando}
              className="
                                inline-flex
                                items-center
                                gap-1
                                rounded-lg
                                border
                                bg-white
                                px-3
                                py-2
                                text-sm
                                text-gray-700
                                transition
                                hover:bg-gray-100
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
            >
              <ChevronLeft size={17} />
              Anterior
            </button>

            <span
              className="
                                min-w-[90px]
                                text-center
                                text-sm
                                text-gray-600
                            "
            >
              Página <strong>{pagina}</strong> de{" "}
              <strong>{totalPaginas}</strong>
            </span>

            <button
              type="button"
              onClick={() =>
                setPagina((anterior) => Math.min(totalPaginas, anterior + 1))
              }
              disabled={pagina >= totalPaginas || cargando}
              className="
                                inline-flex
                                items-center
                                gap-1
                                rounded-lg
                                border
                                bg-white
                                px-3
                                py-2
                                text-sm
                                text-gray-700
                                transition
                                hover:bg-gray-100
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
            >
              Siguiente
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
                PANEL INFERIOR
            ================================================= */}

      <div
        className="
                    grid
                    grid-cols-1
                    gap-6
                    xl:grid-cols-2
                "
      >
        {/* DISTRIBUCIÓN */}

        <div
          className="
                        rounded-xl
                        border
                        bg-white
                        p-6
                        shadow-sm
                    "
        >
          <h2
            className="
                            text-xl
                            font-semibold
                            text-gray-800
                        "
          >
            Distribución por tipo de gasto
          </h2>

          <p
            className="
                            mt-1
                            text-sm
                            text-gray-500
                        "
          >
            Participación de cada categoría dentro de los gastos.
          </p>

          <div
            className="
                            mt-6
                            space-y-5
                        "
          >
            {distribucionTipos.length === 0 && (
              <div
                className="
                                    py-8
                                    text-center
                                    text-sm
                                    text-gray-500
                                "
              >
                No existen datos para mostrar.
              </div>
            )}

            {distribucionTipos.map((item) => {
              const total = Number(item.total ?? 0);

              const porcentaje =
                totalDistribucion > 0 ? (total / totalDistribucion) * 100 : 0;

              return (
                <div key={item.tipo}>
                  <div
                    className="
                                                mb-2
                                                flex
                                                items-center
                                                justify-between
                                                gap-4
                                            "
                  >
                    <div>
                      <p
                        className="
                                                        font-medium
                                                        text-gray-700
                                                    "
                      >
                        {capitalizar(item.tipo)}
                      </p>

                      <p
                        className="
                                                        text-xs
                                                        text-gray-500
                                                    "
                      >
                        {item.cantidad} registros
                      </p>
                    </div>

                    <div
                      className="
                                                    text-right
                                                "
                    >
                      <p
                        className="
                                                        font-semibold
                                                        text-gray-900
                                                    "
                      >
                        {formatearMoneda(total)}
                      </p>

                      <p
                        className="
                                                        text-xs
                                                        text-gray-500
                                                    "
                      >
                        {porcentaje.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                                                h-2.5
                                                w-full
                                                overflow-hidden
                                                rounded-full
                                                bg-gray-200
                                            "
                  >
                    <div
                      className="
                                                    h-full
                                                    rounded-full
                                                    bg-[var(--color-primary)]
                                                    transition-all
                                                "
                      style={{
                        width: `${Math.min(porcentaje, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* REGLAS */}

        <div
          className="
                        rounded-xl
                        border
                        bg-white
                        p-6
                        shadow-sm
                    "
        >
          <h2
            className="
                            text-xl
                            font-semibold
                            text-gray-800
                        "
          >
            Flujo financiero
          </h2>

          <p
            className="
                            mt-1
                            text-sm
                            text-gray-500
                        "
          >
            Reglas aplicadas por el módulo.
          </p>

          <div
            className="
                            mt-6
                            space-y-4
                        "
          >
            <div
              className="
                                rounded-lg
                                border
                                border-amber-200
                                bg-amber-50
                                p-4
                            "
            >
              <p
                className="
                                    font-semibold
                                    text-amber-800
                                "
              >
                1. Registrar gasto
              </p>

              <p
                className="
                                    mt-1
                                    text-sm
                                    leading-6
                                    text-amber-700
                                "
              >
                El registro nace pendiente. No se descuenta dinero de ninguna
                cuenta.
              </p>
            </div>

            <div
              className="
                                rounded-lg
                                border
                                border-emerald-200
                                bg-emerald-50
                                p-4
                            "
            >
              <p
                className="
                                    font-semibold
                                    text-emerald-800
                                "
              >
                2. Confirmar pago
              </p>

              <p
                className="
                                    mt-1
                                    text-sm
                                    leading-6
                                    text-emerald-700
                                "
              >
                Se valida saldo, se crea una transacción de egreso y el gasto
                pasa a pagado.
              </p>
            </div>

            <div
              className="
                                rounded-lg
                                border
                                border-blue-200
                                bg-blue-50
                                p-4
                            "
            >
              <p
                className="
                                    font-semibold
                                    text-blue-800
                                "
              >
                3. Trazabilidad por obra
              </p>

              <p
                className="
                                    mt-1
                                    text-sm
                                    leading-6
                                    text-blue-700
                                "
              >
                Cada egreso conserva obra_id, origen_modulo y origen_id para los
                reportes financieros.
              </p>
            </div>

            <div
              className="
                                rounded-lg
                                border
                                border-red-200
                                bg-red-50
                                p-4
                            "
            >
              <p
                className="
                                    font-semibold
                                    text-red-800
                                "
              >
                4. Anulación segura
              </p>

              <p
                className="
                                    mt-1
                                    text-sm
                                    leading-6
                                    text-red-700
                                "
              >
                Un gasto pagado no elimina su egreso original. Se genera una
                transacción compensatoria que devuelve el saldo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
                MODAL CREAR
            ================================================= */}

      <CreateGastoObraModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refrescarTodo}
        obras={obras}
        controlesDiarios={controlesDiarios}
      />

      {/* =================================================
                MODAL EDITAR
            ================================================= */}

      <EditGastoObraModal
        isOpen={editOpen}
        gastoId={gastoSeleccionadoId}
        onClose={() => {
          setEditOpen(false);

          setGastoSeleccionadoId(null);
        }}
        onUpdated={refrescarTodo}
        obras={obras}
        controlesDiarios={controlesDiarios}
      />

      {/* =================================================
                MODAL DETALLE
            ================================================= */}

      <GastoObraDetailModal
        isOpen={detailOpen}
        gastoId={gastoSeleccionadoId}
        onClose={() => {
          setDetailOpen(false);

          setGastoSeleccionadoId(null);
        }}
      />

      {/* =================================================
                MODAL CONFIRMAR
            ================================================= */}

      <ConfirmarGastoObraModal
        isOpen={confirmarOpen}
        gasto={gastoSeleccionado}
        cuentas={cuentas}
        onClose={() => {
          setConfirmarOpen(false);

          setGastoSeleccionado(null);
        }}
        onConfirmed={refrescarTodo}
      />
    </div>
  );
};

export default GastosObraPage;
