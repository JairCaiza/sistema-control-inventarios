import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router-dom";

import Swal from "sweetalert2";

import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  DollarSign,
  Eye,
  FileBarChart,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  UserMinus,
  Users,
  WalletCards,
} from "lucide-react";

import { api } from "../../../../services/api";

import type { EstadoObra, Obra } from "../services/obrasService";

import { getObraById } from "../services/obrasService";

import {
  getControlesDiariosPorObra,
  type ControlDiario,
} from "../services/controlDiarioService";

import {
  getEmpleadosObra,
  type EmpleadoObra,
} from "../services/empleadosObrasService";

import {
  getPagosPorObra,
  type EstadoPagoEmpleado,
  type PagoEmpleadoObra,
  type TipoPagoEmpleado,
} from "../services/pagosService";

import {
  confirmarPagoEmpleado,
  anularPagoEmpleado,
  type MetodoPagoEmpleado,
} from "../../empleados/services/pagoEmpleadoService";

import CreateAsignacionModal from "../components/modals/CreateAsignacionModal";

import CreateControlDiarioModal from "../components/modals/CreateControlDiarioModal";

import CreatePagoModal from "../components/modals/CreatePagoModal";

import EditDesasignacionModal from "../components/modals/EditDesasignacionModal";

/* =====================================================
   TIPOS AUXILIARES
===================================================== */

interface CuentaFinanciera {
  id: string;

  nombre: string;

  tipo?: string | null;

  saldo_actual: number | string;

  activo?: boolean;
}

/* =====================================================
   ERROR
===================================================== */

const obtenerMensajeError = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;

          detail?: string;
        };
      };
    };

    return (
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

/* =====================================================
   FECHA
===================================================== */

const formatDate = (value?: string | null) => {
  if (!value) {
    return "No registrada";
  }

  const fecha = value.includes("T") ? value.split("T")[0] : value;

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [year, month, day] = partes;

  return `${day}/${month}/${year}`;
};

/* =====================================================
   FECHA LOCAL YYYY-MM-DD
===================================================== */

const obtenerFechaLocal = () => {
  const fecha = new Date();

  const year = fecha.getFullYear();

  const month = String(fecha.getMonth() + 1).padStart(2, "0");

  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   MONEDA
===================================================== */

const formatCurrency = (value: number | string | null | undefined) => {
  const numero = Number(value ?? 0);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

/* =====================================================
   ESTADO OBRA
===================================================== */

const getEstadoLabel = (estado: EstadoObra) => {
  const labels: Record<EstadoObra, string> = {
    planificada: "Planificada",

    en_proceso: "En proceso",

    pausada: "Pausada",

    finalizada: "Finalizada",

    cancelada: "Cancelada",
  };

  return labels[estado];
};

const getEstadoClass = (estado: EstadoObra) => {
  const clases: Record<EstadoObra, string> = {
    planificada: "border-slate-200 bg-slate-100 text-slate-700",

    en_proceso: "border-blue-200 bg-blue-50 text-blue-700",

    pausada: "border-amber-200 bg-amber-50 text-amber-700",

    finalizada: "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelada: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return clases[estado];
};

/* =====================================================
   ESTADO PAGO
===================================================== */

const getEstadoPagoClass = (estado: EstadoPagoEmpleado) => {
  if (estado === "pagado") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (estado === "pendiente") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
};

const getEstadoPagoLabel = (estado: EstadoPagoEmpleado) => {
  if (estado === "pagado") {
    return "Pagado";
  }

  if (estado === "pendiente") {
    return "Pendiente";
  }

  return "Anulado";
};

/* =====================================================
   TIPO PAGO
===================================================== */

const getTipoPagoLabel = (tipo: TipoPagoEmpleado) => {
  const labels: Record<TipoPagoEmpleado, string> = {
    diario: "Diario",

    semanal: "Semanal",

    quincenal: "Quincenal",

    mensual: "Mensual",

    otro: "Otro",
  };

  return labels[tipo];
};

/* =====================================================
   COMPONENTE
===================================================== */

function ObraDetailPage() {
  const { id } = useParams<{
    id: string;
  }>();

  /* =================================================
     STATES
  ================================================= */

  const [obra, setObra] = useState<Obra | null>(null);

  const [empleadosObra, setEmpleadosObra] = useState<EmpleadoObra[]>([]);

  const [controles, setControles] = useState<ControlDiario[]>([]);

  const [pagosObra, setPagosObra] = useState<PagoEmpleadoObra[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  /* =================================================
     FILTROS PAGOS
  ================================================= */

  const [buscarPago, setBuscarPago] = useState("");

  const [estadoPagoFiltro, setEstadoPagoFiltro] = useState<
    "" | EstadoPagoEmpleado
  >("");

  const [tipoPagoFiltro, setTipoPagoFiltro] = useState<"" | TipoPagoEmpleado>(
    "",
  );

  /* =================================================
     MODALES
  ================================================= */

  const [openAsignacion, setOpenAsignacion] = useState(false);

  const [controlModalOpen, setControlModalOpen] = useState(false);

  const [openPago, setOpenPago] = useState(false);

  const [openDesasignacion, setOpenDesasignacion] = useState(false);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] =
    useState<EmpleadoObra | null>(null);

  /* =================================================
     CARGAR OBRA
  ================================================= */

  const loadObra = useCallback(async () => {
    if (!id) {
      return;
    }

    const data = await getObraById(id);

    setObra(data);
  }, [id]);

  /* =================================================
     CARGAR EMPLEADOS
  ================================================= */

  const loadEmpleadosObra = useCallback(async () => {
    if (!id) {
      return;
    }

    const data = await getEmpleadosObra(id);

    setEmpleadosObra(Array.isArray(data) ? data : []);
  }, [id]);

  /* =================================================
     CARGAR CONTROLES
  ================================================= */

  const loadControles = useCallback(async () => {
    if (!id) {
      return;
    }

    const data = await getControlesDiariosPorObra(id);

    setControles(data);
  }, [id]);

  /* =================================================
     CARGAR PAGOS
  ================================================= */

  const loadPagosObra = useCallback(async () => {
    if (!id) {
      return;
    }

    const data = await getPagosPorObra(id);

    setPagosObra(Array.isArray(data) ? data : []);
  }, [id]);

  /* =================================================
     CARGAR TODO
  ================================================= */

  const loadData = useCallback(
    async (mostrarLoader = true) => {
      if (!id) {
        return;
      }

      try {
        if (mostrarLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        await Promise.all([
          loadObra(),
          loadEmpleadosObra(),
          loadControles(),
          loadPagosObra(),
        ]);
      } catch (error) {
        console.error("Error cargando detalle de obra:", error);

        await Swal.fire({
          icon: "error",

          title: "No se pudo cargar la obra",

          text: obtenerMensajeError(
            error,
            "Ocurrió un error al cargar la información de la obra.",
          ),
        });
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [id, loadObra, loadEmpleadosObra, loadControles, loadPagosObra],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =================================================
     RESUMEN
  ================================================= */

  const resumen = useMemo(() => {
    const totalEmpleados = empleadosObra.length;

    const totalControles = controles.length;

    const ultimoControl = controles.length > 0 ? controles[0] : null;

    const ultimoAvance = ultimoControl?.avance ?? null;

    return {
      totalEmpleados,
      totalControles,
      ultimoAvance,

      ultimaFechaControl: ultimoControl?.fecha ?? null,
    };
  }, [empleadosObra, controles]);

  /* =================================================
     PAGOS FILTRADOS
  ================================================= */

  const pagosFiltrados = useMemo(() => {
    const texto = buscarPago.trim().toLowerCase();

    return pagosObra.filter((pago) => {
      const nombreEmpleado = (
        pago.empleado_nombre ||
        `${pago.empleado_nombres ?? ""} ${pago.empleado_apellidos ?? ""}`
      )
        .trim()
        .toLowerCase();

      const coincideBusqueda =
        !texto ||
        nombreEmpleado.includes(texto) ||
        pago.periodo_descripcion?.toLowerCase().includes(texto) ||
        pago.referencia?.toLowerCase().includes(texto);

      const coincideEstado =
        !estadoPagoFiltro || pago.estado === estadoPagoFiltro;

      const coincideTipo = !tipoPagoFiltro || pago.tipo_pago === tipoPagoFiltro;

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [pagosObra, buscarPago, estadoPagoFiltro, tipoPagoFiltro]);

  /* =================================================
     BLOQUEO
  ================================================= */

  const bloqueada =
    obra?.estado === "finalizada" || obra?.estado === "cancelada";

  /* =================================================
     DESASIGNACIÓN
  ================================================= */

  const abrirModalDesasignacion = (empleado: EmpleadoObra) => {
    setEmpleadoSeleccionado(empleado);

    setOpenDesasignacion(true);
  };

  /* =================================================
     CUENTAS FINANCIERAS
  ================================================= */

  const obtenerCuentasActivas = async (): Promise<CuentaFinanciera[]> => {
    const response = await api.get("/cuentas-financieras");

    const data = Array.isArray(response.data?.data) ? response.data.data : [];

    return data.filter((cuenta: CuentaFinanciera) => cuenta.activo !== false);
  };

  /* =================================================
     CONFIRMAR PAGO
  ================================================= */

  const handleConfirmarPago = async (pago: PagoEmpleadoObra) => {
    if (pago.estado !== "pendiente") {
      await Swal.fire({
        icon: "warning",

        title: "Pago no disponible",

        text: "Solo los pagos pendientes pueden ser confirmados.",
      });

      return;
    }

    try {
      Swal.fire({
        title: "Cargando cuentas...",

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const cuentas = await obtenerCuentasActivas();

      Swal.close();

      if (cuentas.length === 0) {
        await Swal.fire({
          icon: "warning",

          title: "No hay cuentas disponibles",

          text: "Debe registrar y activar al menos una cuenta financiera antes de confirmar el pago.",
        });

        return;
      }

      const opcionesCuenta = cuentas
        .map(
          (cuenta) =>
            `
                <option value="${cuenta.id}">
                    ${cuenta.nombre}
                    - Saldo:
                    ${formatCurrency(cuenta.saldo_actual)}
                </option>
                `,
        )
        .join("");

      const resultado = await Swal.fire({
        icon: "question",

        title: "Confirmar pago",

        text: "Esta operación generará un egreso financiero y descontará el monto de la cuenta seleccionada.",

        width: 620,

        showCancelButton: true,

        confirmButtonText: "Confirmar pago",

        cancelButtonText: "Cancelar",

        confirmButtonColor: "#16a34a",

        focusConfirm: false,

        html: `
              <div style="
                margin-top:16px;
                text-align:left;
              ">

                <label style="
                  display:block;
                  margin-bottom:6px;
                  font-size:13px;
                  font-weight:600;
                ">
                  Cuenta financiera *
                </label>

                <select
                  id="swal-cuenta"
                  class="swal2-select"
                  style="
                    width:100%;
                    margin:0 0 16px 0;
                  "
                >
                  <option value="">
                    Seleccione una cuenta
                  </option>

                  ${opcionesCuenta}
                </select>

                <label style="
                  display:block;
                  margin-bottom:6px;
                  font-size:13px;
                  font-weight:600;
                ">
                  Fecha de pago *
                </label>

                <input
                  id="swal-fecha"
                  type="date"
                  value="${obtenerFechaLocal()}"
                  class="swal2-input"
                  style="
                    width:100%;
                    margin:0 0 16px 0;
                  "
                />

                <label style="
                  display:block;
                  margin-bottom:6px;
                  font-size:13px;
                  font-weight:600;
                ">
                  Método de pago *
                </label>

                <select
                  id="swal-metodo"
                  class="swal2-select"
                  style="
                    width:100%;
                    margin:0 0 16px 0;
                  "
                >
                  <option value="">
                    Seleccione
                  </option>

                  <option value="efectivo">
                    Efectivo
                  </option>

                  <option value="transferencia">
                    Transferencia
                  </option>

                  <option value="deposito">
                    Depósito
                  </option>

                  <option value="cheque">
                    Cheque
                  </option>
                </select>

                <label style="
                  display:block;
                  margin-bottom:6px;
                  font-size:13px;
                  font-weight:600;
                ">
                  Referencia
                </label>

                <input
                  id="swal-referencia"
                  type="text"
                  maxlength="100"
                  class="swal2-input"
                  placeholder="Opcional"
                  style="
                    width:100%;
                    margin:0;
                  "
                />

              </div>
            `,

        preConfirm: () => {
          const cuenta =
            (document.getElementById("swal-cuenta") as HTMLSelectElement | null)
              ?.value ?? "";

          const fechaPago =
            (document.getElementById("swal-fecha") as HTMLInputElement | null)
              ?.value ?? "";

          const metodo =
            (document.getElementById("swal-metodo") as HTMLSelectElement | null)
              ?.value ?? "";

          const referencia =
            (
              document.getElementById(
                "swal-referencia",
              ) as HTMLInputElement | null
            )?.value ?? "";

          if (!cuenta) {
            Swal.showValidationMessage("Seleccione una cuenta financiera.");

            return false;
          }

          if (!fechaPago) {
            Swal.showValidationMessage("Seleccione la fecha de pago.");

            return false;
          }

          if (!metodo) {
            Swal.showValidationMessage("Seleccione el método de pago.");

            return false;
          }

          return {
            cuenta_id: cuenta,

            fecha_pago: fechaPago,

            metodo_pago: metodo as MetodoPagoEmpleado,

            referencia: referencia.trim() || null,
          };
        },
      });

      if (!resultado.isConfirmed || !resultado.value) {
        return;
      }

      Swal.fire({
        title: "Procesando pago...",

        text: "Registrando el egreso financiero.",

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const confirmacion = await confirmarPagoEmpleado(
        pago.id,
        resultado.value,
      );

      await Swal.fire({
        icon: "success",

        title: "Pago confirmado",

        html: `
            <div style="
              text-align:left;
              line-height:1.8;
            ">
              <strong>Monto:</strong>
              ${formatCurrency(confirmacion.pago.monto)}
              <br/>

              <strong>Cuenta:</strong>
              ${confirmacion.cuenta.nombre}
              <br/>

              <strong>Nuevo saldo:</strong>
              ${formatCurrency(confirmacion.cuenta.saldo_actual)}
              <br/>

              <strong>Estado:</strong>
              Pagado
            </div>
          `,

        confirmButtonText: "Aceptar",
      });

      /*
       * Actualizamos solamente
       * el bloque de pagos.
       */
      await loadPagosObra();
    } catch (error) {
      console.error("Error confirmando pago:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo confirmar el pago",

        text: obtenerMensajeError(error, "No fue posible confirmar el pago."),
      });
    }
  };

  /* =================================================
     ANULAR PAGO
  ================================================= */

  const handleAnularPago = async (pago: PagoEmpleadoObra) => {
    if (pago.estado === "anulado") {
      return;
    }

    const mensaje =
      pago.estado === "pagado"
        ? "Este pago ya afectó una cuenta financiera. Al anularlo, el sistema realizará una reversión y devolverá el dinero a la cuenta."
        : "Este pago todavía está pendiente. Será anulado sin afectar ninguna cuenta financiera.";

    const resultado = await Swal.fire({
      icon: "warning",

      title: "Anular pago",

      text: mensaje,

      input: "textarea",

      inputLabel: "Motivo de anulación",

      inputPlaceholder: "Escriba el motivo...",

      inputAttributes: {
        maxlength: "500",
      },

      showCancelButton: true,

      confirmButtonText: "Sí, anular",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",

      inputValidator: (value) => {
        if (!value || value.trim().length < 3) {
          return "Ingrese un motivo de al menos 3 caracteres.";
        }

        return undefined;
      },
    });

    if (!resultado.isConfirmed || !resultado.value) {
      return;
    }

    try {
      Swal.fire({
        title: "Anulando pago...",

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const anulacion = await anularPagoEmpleado(
        pago.id,
        resultado.value.trim(),
      );

      await Swal.fire({
        icon: "success",

        title: "Pago anulado",

        text: anulacion.reversion
          ? "El pago fue anulado y el movimiento financiero fue revertido correctamente."
          : "El pago pendiente fue anulado correctamente.",

        confirmButtonText: "Aceptar",
      });

      await loadPagosObra();
    } catch (error) {
      console.error("Error anulando pago:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo anular el pago",

        text: obtenerMensajeError(error, "No fue posible anular el pago."),
      });
    }
  };

  /* =================================================
     LOADING
  ================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw size={30} className="animate-spin" />

        <p className="text-sm">Cargando información de la obra...</p>
      </div>
    );
  }

  /* =================================================
     OBRA NO ENCONTRADA
  ================================================= */

  if (!id || !obra) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Building2 size={36} className="mx-auto text-slate-300" />

        <h2 className="mt-4 text-xl font-bold text-slate-800">
          Obra no disponible
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          No fue posible encontrar la información de esta obra.
        </p>

        <Link
          to="/dashboard/obras"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft size={17} />
          Volver a obras
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =================================================
          NAVEGACIÓN
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard/obras"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Volver a obras
        </Link>

        <button
          type="button"
          onClick={() => void loadData(false)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Detalle de obra
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                {obra.nombre}
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Código: {obra.codigo}
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${getEstadoClass(
                obra.estado,
              )}`}
            >
              {getEstadoLabel(obra.estado)}
            </span>
          </div>

          {obra.descripcion && (
            <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-600">
              {obra.descripcion}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <BriefcaseBusiness size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Cliente
              </p>
            </div>

            <p className="mt-3 font-semibold text-slate-900">
              {obra.cliente_nombre || "Sin cliente asignado"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Ubicación
              </p>
            </div>

            <p className="mt-3 font-semibold text-slate-900">
              {obra.ubicacion || "No registrada"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <DollarSign size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Presupuesto
              </p>
            </div>

            <p className="mt-3 font-semibold text-slate-900">
              {formatCurrency(obra.presupuesto)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarDays size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Inicio
              </p>
            </div>

            <p className="mt-3 font-semibold text-slate-900">
              {formatDate(obra.fecha_inicio)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarDays size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Fin previsto
              </p>
            </div>

            <p className="mt-3 font-semibold text-slate-900">
              {formatDate(obra.fecha_fin)}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          OBRA CERRADA
      ================================================= */}

      {bloqueada && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">
            Operaciones restringidas
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-800">
            Esta obra está{" "}
            <strong>{getEstadoLabel(obra.estado).toLowerCase()}</strong>. No se
            permiten nuevas asignaciones, controles ni nuevos pagos.
          </p>
        </div>
      )}

      {/* =================================================
          KPIS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Personal activo</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.totalEmpleados}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Controles registrados</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.totalControles}
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <ClipboardCheck size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Último avance</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.ultimoAvance !== null
                  ? `${resumen.ultimoAvance}%`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <FileBarChart size={22} />
            </div>
          </div>

          {resumen.ultimaFechaControl && (
            <p className="mt-2 text-xs text-slate-400">
              Registrado el {formatDate(resumen.ultimaFechaControl)}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Presupuesto</p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatCurrency(obra.presupuesto)}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <WalletCards size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MÓDULOS
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* =================================================
            EMPLEADOS
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Empleados asignados</h2>

              <p className="mt-1 text-sm text-slate-500">
                Personal activo relacionado con esta obra.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenAsignacion(true)}
              disabled={bloqueada}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={16} />
              Asignar
            </button>
          </div>

          <div className="p-5">
            {empleadosObra.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <Users size={30} className="text-slate-300" />

                <p className="mt-3 font-semibold text-slate-600">
                  No hay empleados asignados
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {empleadosObra.map((empleado, index) => (
                  <div
                    key={empleado.id ?? `${index}`}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {empleado.nombres} {empleado.apellidos}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {empleado.cargo_obra || "Cargo no especificado"}
                      </p>

                      {empleado.salario_acordado !== undefined &&
                        empleado.salario_acordado !== null && (
                          <p className="mt-1 text-xs text-slate-400">
                            Salario acordado:{" "}
                            {formatCurrency(empleado.salario_acordado)}
                          </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Activo
                      </span>

                      <button
                        type="button"
                        onClick={() => abrirModalDesasignacion(empleado)}
                        disabled={!empleado.id}
                        title="Desasignar empleado"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <UserMinus size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            CONTROL DIARIO
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Control diario</h2>

              <p className="mt-1 text-sm text-slate-500">
                Actividades y avance registrados en campo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setControlModalOpen(true)}
              disabled={bloqueada}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={16} />
              Registrar
            </button>
          </div>

          <div className="max-h-[440px] overflow-y-auto p-5">
            {controles.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <ClipboardCheck size={30} className="text-slate-300" />

                <p className="mt-3 font-semibold text-slate-600">
                  Sin controles registrados
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {controles.map((control, index) => (
                  <article
                    key={
                      control.id ??
                      `${control.obra_id}-${control.fecha}-${index}`
                    }
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {control.actividad || "Actividad sin nombre"}
                        </p>

                        {control.descripcion && (
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {control.descripcion}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 text-xs font-medium text-slate-400">
                        {formatDate(control.fecha)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(control.hora_inicio || control.hora_fin) && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          <Clock3 size={13} />
                          {control.hora_inicio || "--:--"} -{" "}
                          {control.hora_fin || "--:--"}
                        </span>
                      )}

                      {control.avance !== undefined &&
                        control.avance !== null && (
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Avance: {control.avance}%
                          </span>
                        )}

                      {control.clima && (
                        <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs text-sky-700">
                          Clima: {control.clima}
                        </span>
                      )}
                    </div>

                    {control.observaciones && (
                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-500">
                          Observaciones
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {control.observaciones}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            PAGOS EMPLEADOS
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* HEADER */}

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Pagos de empleados</h2>

              <p className="mt-1 text-sm text-slate-500">
                Obligaciones y pagos vinculados al personal de esta obra.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenPago(true)}
              disabled={bloqueada}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={16} />
              Registrar pago
            </button>
          </div>

          {/* FILTROS */}

          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_140px]">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={buscarPago}
                  onChange={(event) => setBuscarPago(event.target.value)}
                  placeholder="Empleado, período..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
                />
              </div>

              <select
                value={estadoPagoFiltro}
                onChange={(event) =>
                  setEstadoPagoFiltro(
                    event.target.value as "" | EstadoPagoEmpleado,
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">Estados</option>

                <option value="pendiente">Pendiente</option>

                <option value="pagado">Pagado</option>

                <option value="anulado">Anulado</option>
              </select>

              <select
                value={tipoPagoFiltro}
                onChange={(event) =>
                  setTipoPagoFiltro(event.target.value as "" | TipoPagoEmpleado)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">Tipos</option>

                <option value="diario">Diario</option>

                <option value="semanal">Semanal</option>

                <option value="quincenal">Quincenal</option>

                <option value="mensual">Mensual</option>

                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {/* CONTENIDO */}

          <div className="p-5">
            {pagosObra.length === 0 ? (
              <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
                <WalletCards size={32} className="text-slate-300" />

                <p className="mt-3 font-semibold text-slate-700">
                  No existen pagos registrados
                </p>

                <p className="mt-1 max-w-md text-sm text-slate-400">
                  Registra el primer pago para un empleado de esta obra.
                </p>
              </div>
            ) : pagosFiltrados.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
                <Search size={29} className="text-slate-300" />

                <p className="mt-3 font-semibold text-slate-600">
                  Sin coincidencias
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setBuscarPago("");

                    setEstadoPagoFiltro("");

                    setTipoPagoFiltro("");
                  }}
                  className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="max-h-[380px] overflow-auto">
                  <table className="min-w-full">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                          Empleado
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                          Período
                        </th>

                        <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                          Monto
                        </th>

                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                          Estado
                        </th>

                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {pagosFiltrados.map((pago) => {
                        const empleado =
                          pago.empleado_nombre ||
                          `${pago.empleado_nombres ?? ""} ${
                            pago.empleado_apellidos ?? ""
                          }`.trim() ||
                          "Empleado";

                        return (
                          <tr key={pago.id} className="hover:bg-slate-50">
                            {/* EMPLEADO */}

                            <td className="px-3 py-3">
                              <p className="text-sm font-semibold text-slate-800">
                                {empleado}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {pago.cargo_obra ||
                                  pago.empleado_cargo ||
                                  getTipoPagoLabel(pago.tipo_pago)}
                              </p>
                            </td>

                            {/* PERÍODO */}

                            <td className="px-3 py-3">
                              <p className="text-xs font-medium text-slate-700">
                                {pago.periodo_descripcion}
                              </p>

                              {(pago.fecha_inicio_periodo ||
                                pago.fecha_fin_periodo) && (
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {formatDate(pago.fecha_inicio_periodo)} -{" "}
                                  {formatDate(pago.fecha_fin_periodo)}
                                </p>
                              )}
                            </td>

                            {/* MONTO */}

                            <td className="whitespace-nowrap px-3 py-3 text-right">
                              <p className="text-sm font-bold text-slate-900">
                                {formatCurrency(pago.monto)}
                              </p>
                            </td>

                            {/* ESTADO */}

                            <td className="px-3 py-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${getEstadoPagoClass(
                                  pago.estado,
                                )}`}
                              >
                                {pago.estado === "pagado" ? (
                                  <CheckCircle2 size={12} />
                                ) : pago.estado === "pendiente" ? (
                                  <Clock3 size={12} />
                                ) : (
                                  <AlertTriangle size={12} />
                                )}

                                {getEstadoPagoLabel(pago.estado)}
                              </span>
                            </td>

                            {/* ACCIONES */}

                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {/* CONFIRMAR */}

                                {pago.estado === "pendiente" && (
                                  <button
                                    type="button"
                                    title="Confirmar pago"
                                    onClick={() =>
                                      void handleConfirmarPago(pago)
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-50"
                                  >
                                    <Check size={16} />
                                  </button>
                                )}

                                {/* ANULAR */}

                                {pago.estado !== "anulado" && (
                                  <button
                                    type="button"
                                    title={
                                      pago.estado === "pagado"
                                        ? "Anular y revertir pago"
                                        : "Anular pago"
                                    }
                                    onClick={() => void handleAnularPago(pago)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                                  >
                                    <Ban size={16} />
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

                {/* FOOTER */}

                <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Mostrando <strong>{pagosFiltrados.length}</strong> de{" "}
                    <strong>{pagosObra.length}</strong> pago(s).
                  </p>

                  <Link
                    to={`/dashboard/pagos-empleados?obra_id=${id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <Eye size={14} />
                    Ver gestión completa
                  </Link>
                </div>
              </div>
            )}

            {/* REGLAS */}

            {pagosObra.length > 0 && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs leading-5 text-blue-800">
                  <strong>Pendiente:</strong> todavía no mueve dinero.{" "}
                  <strong>Confirmar:</strong> genera el egreso y descuenta la
                  cuenta. <strong>Anular pagado:</strong> genera la reversión
                  financiera.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            SEGUIMIENTO
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">Seguimiento de la obra</h2>

            <p className="mt-1 text-sm text-slate-500">
              Información basada únicamente en los registros reales.
            </p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Último avance registrado
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {resumen.ultimoAvance !== null
                    ? `${resumen.ultimoAvance}%`
                    : "Sin registro"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Controles diarios</p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {resumen.totalControles}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Personal activo</p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {resumen.totalEmpleados}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Presupuesto</p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatCurrency(obra.presupuesto)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex gap-3">
                <FileBarChart size={22} className="shrink-0 text-violet-600" />

                <div>
                  <p className="font-semibold text-violet-900">
                    Reportes financieros
                  </p>

                  <p className="mt-1 text-sm leading-6 text-violet-800">
                    Gastos, pagos de personal, presupuesto consumido y flujo
                    financiero se consultan desde Reportes Obras.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* =================================================
          MODAL ASIGNACIÓN
      ================================================= */}

      <CreateAsignacionModal
        open={openAsignacion}
        obraId={id}
        onClose={() => setOpenAsignacion(false)}
        onAssigned={() => {
          setOpenAsignacion(false);

          void loadEmpleadosObra();
        }}
      />

      {/* =================================================
          MODAL CONTROL
      ================================================= */}

      <CreateControlDiarioModal
        open={controlModalOpen}
        onClose={() => setControlModalOpen(false)}
        obraId={id}
        onSuccess={() => {
          setControlModalOpen(false);

          void loadControles();
        }}
      />

      {/* =================================================
          MODAL PAGO
      ================================================= */}

      <CreatePagoModal
        open={openPago}
        onClose={() => setOpenPago(false)}
        onCreated={async () => {
          await loadPagosObra();
        }}
      />

      {/* =================================================
          MODAL DESASIGNAR
      ================================================= */}

      <EditDesasignacionModal
        isOpen={openDesasignacion}
        onClose={() => {
          setOpenDesasignacion(false);

          setEmpleadoSeleccionado(null);
        }}
        asignacionId={empleadoSeleccionado?.id || ""}
        onDesasignado={() => {
          setOpenDesasignacion(false);

          setEmpleadoSeleccionado(null);

          void loadEmpleadosObra();
        }}
      />
    </div>
  );
}

export default ObraDetailPage;
