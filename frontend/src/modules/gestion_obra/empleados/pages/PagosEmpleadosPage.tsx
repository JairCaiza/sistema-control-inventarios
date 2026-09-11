import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  FileDown,
  DollarSign,
  Users,
  CalendarDays,
  Wallet,
  Building2,
  Eye,
  Pencil,
  CheckCircle,
  Clock,
  AlertTriangle,
  Ban,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  BriefcaseBusiness,
  ReceiptText,
  FileText,
} from "lucide-react";

import Swal from "sweetalert2";

import CreatePagoEmpleadoModal from "../components/CreatePagoEmpleadoModal";

import EditPagoEmpleadoModal from "../components/EditPagoEmpleadoModal";

import VistaPreviaPagoModal from "../components/VistaPreviaPagoModal";

import type { ReportePagoEmpleadoData } from "../components/ReportePagoDiseno";

import {
  anularPagoEmpleado,
  confirmarPagoEmpleado,
  getPagoEmpleadoById,
  getPagosEmpleados,
  getResumenPagosEmpleados,
  type EstadoPagoEmpleado,
  type MetodoPagoEmpleado,
  type PagoEmpleado,
  type ResumenPagosEmpleado,
  type TipoPagoEmpleado,
} from "../services/pagoEmpleadoService";

import { api } from "../../../../services/api";

/* =====================================================
   TYPES
===================================================== */

interface CuentaFinanciera {
  id: string;
  nombre: string;
  tipo: string;
  saldo_actual: number | string;
  activo: boolean;
}

/* =====================================================
   EMPRESA

   AQUÍ DESPUÉS COLOCAREMOS LOS DATOS REALES
===================================================== */

const EMPRESA = {
  nombre: "HNOS GUARACAS",

  ruc: "",

  direccion_matriz: "Riobamba - Chimborazo - Ecuador",

  direccion_sucursal: "",

  telefono: "",

  correo: "",

  obligado_contabilidad: "NO",
};

/* =====================================================
   CONSTANTES
===================================================== */

const PAGE_SIZE = 10;

const RESUMEN_INICIAL: ResumenPagosEmpleado = {
  total_registros: 0,

  empleados_con_pagos: 0,

  pagos_confirmados: 0,

  pagos_pendientes: 0,

  pagos_anulados: 0,

  total_pagado: 0,

  total_pendiente: 0,

  pagos_vinculados_obra: 0,
};

/* =====================================================
   HELPERS
===================================================== */

const numero = (value: number | string | null | undefined): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const moneda = (value: number | string | null | undefined): string => {
  return numero(value).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const fecha = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const raw = value.includes("T") ? value.split("T")[0] : value;

  const partes = raw.split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return value;
};

const fechaHoy = (): string => {
  const actual = new Date();

  const year = actual.getFullYear();

  const month = String(actual.getMonth() + 1).padStart(2, "0");

  const day = String(actual.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const capitalizar = (value: string): string => {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const obtenerMensajeError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;

          errors?: Array<{
            mensaje?: string;
          }>;
        };
      };
    };

    const message = axiosError.response?.data?.message;

    const errors = axiosError.response?.data?.errors;

    if (Array.isArray(errors) && errors.length > 0) {
      const detalles = errors
        .map((item) => item.mensaje)
        .filter(Boolean)
        .join("\n");

      if (detalles) {
        return message ? `${message}\n\n${detalles}` : detalles;
      }
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
};

/* =====================================================
   NÚMERO DE COMPROBANTE

   TEMPORAL:
   luego lo llevaremos al backend para tener
   PE-2026-000001, PE-2026-000002...
===================================================== */

const generarNumeroComprobante = (pago: PagoEmpleado): string => {
  const fechaBase = pago.fecha_pago || pago.fecha_creacion || "";

  const year = fechaBase
    ? fechaBase.substring(0, 4)
    : String(new Date().getFullYear());

  const corto = pago.id.replace(/-/g, "").substring(0, 8).toUpperCase();

  return `PE-${year}-${corto}`;
};

/* =====================================================
   CONSTRUIR DOCUMENTO
===================================================== */

const construirDatosComprobante = (
  pago: PagoEmpleado,
): ReportePagoEmpleadoData => {
  return {
    numero_comprobante: generarNumeroComprobante(pago),

    fecha_emision:
      pago.fecha_pago || pago.fecha_creacion || new Date().toISOString(),

    estado: pago.estado,

    empresa: EMPRESA,

    empleado: {
      nombres: pago.empleado_nombres ?? pago.empleado_nombre ?? "",

      apellidos: pago.empleado_apellidos ?? "",

      cedula: pago.empleado_cedula ?? "",

      cargo: pago.cargo_obra ?? pago.empleado_cargo ?? "",
    },

    obra: pago.obra_nombre
      ? {
          codigo: pago.obra_codigo ?? "",

          nombre: pago.obra_nombre,
        }
      : null,

    periodo: {
      descripcion: pago.periodo_descripcion,

      fecha_inicio: pago.fecha_inicio_periodo,

      fecha_fin: pago.fecha_fin_periodo,
    },

    pago: {
      tipo_pago: pago.tipo_pago,

      monto: pago.monto,

      metodo_pago: pago.metodo_pago,

      cuenta_nombre: pago.cuenta_nombre,

      referencia: pago.referencia,

      observaciones: pago.observaciones,

      transaccion_id: pago.transaccion_id,
    },
  };
};

/* =====================================================
   COMPONENT
===================================================== */

function PagosEmpleadosPage() {
  /* ===================================================
     DATA
  =================================================== */

  const [pagos, setPagos] = useState<PagoEmpleado[]>([]);

  const [resumen, setResumen] = useState<ResumenPagosEmpleado>(RESUMEN_INICIAL);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  /* ===================================================
     CREATE
  =================================================== */

  const [createModalOpen, setCreateModalOpen] = useState(false);

  /* ===================================================
     EDIT
  =================================================== */

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [pagoEditandoId, setPagoEditandoId] = useState<string | null>(null);

  /* ===================================================
     VISTA PREVIA COMPROBANTE
  =================================================== */

  const [vistaPreviaOpen, setVistaPreviaOpen] = useState(false);

  const [pagoVistaPrevia, setPagoVistaPrevia] =
    useState<ReportePagoEmpleadoData | null>(null);

  /* ===================================================
     FILTERS
  =================================================== */

  const [search, setSearch] = useState("");

  const [filtroEstado, setFiltroEstado] = useState<EstadoPagoEmpleado | "">("");

  const [filtroTipoPago, setFiltroTipoPago] = useState<TipoPagoEmpleado | "">(
    "",
  );

  const [fechaDesde, setFechaDesde] = useState("");

  const [fechaHasta, setFechaHasta] = useState("");

  /* ===================================================
     PAGINATION
  =================================================== */

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);

  const [totalRegistros, setTotalRegistros] = useState(0);

  /* ===================================================
     LOAD DATA
  =================================================== */

  const cargarDatos = useCallback(
    async (mostrarLoading = true) => {
      try {
        if (mostrarLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const [pagosResponse, resumenResponse] = await Promise.all([
          getPagosEmpleados({
            buscar: search.trim() || undefined,

            estado: filtroEstado || undefined,

            tipo_pago: filtroTipoPago || undefined,

            fecha_desde: fechaDesde || undefined,

            fecha_hasta: fechaHasta || undefined,

            page,

            limit: PAGE_SIZE,
          }),

          getResumenPagosEmpleados(),
        ]);

        setPagos(pagosResponse.data);

        setTotalPages(pagosResponse.pagination.totalPages);

        setTotalRegistros(pagosResponse.pagination.total);

        setResumen(resumenResponse);
      } catch (error) {
        console.error("Error cargando pagos:", error);

        await Swal.fire({
          icon: "error",

          title: "No se pudieron cargar los pagos",

          text: obtenerMensajeError(error),

          confirmButtonText: "Aceptar",
        });
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [search, filtroEstado, filtroTipoPago, fechaDesde, fechaHasta, page],
  );

  /* ===================================================
     DEBOUNCE
  =================================================== */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarDatos();
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cargarDatos]);

  /* ===================================================
     RESET PAGE
  =================================================== */

  useEffect(() => {
    setPage(1);
  }, [search, filtroEstado, filtroTipoPago, fechaDesde, fechaHasta]);

  /* ===================================================
     KPIS
  =================================================== */

  const totalPagado = useMemo(
    () => numero(resumen.total_pagado),
    [resumen.total_pagado],
  );

  const totalPendiente = useMemo(
    () => numero(resumen.total_pendiente),
    [resumen.total_pendiente],
  );

  const empleadosConPagos = numero(resumen.empleados_con_pagos);

  const pagosVinculados = numero(resumen.pagos_vinculados_obra);

  /* ===================================================
     ESTADO
  =================================================== */

  const getEstadoClass = (estado: EstadoPagoEmpleado) => {
    if (estado === "pagado") {
      return "bg-green-100 text-green-700 border border-green-200";
    }

    if (estado === "pendiente") {
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    }

    return "bg-red-100 text-red-700 border border-red-200";
  };

  const getEstadoIcon = (estado: EstadoPagoEmpleado) => {
    if (estado === "pagado") {
      return <CheckCircle size={15} />;
    }

    if (estado === "pendiente") {
      return <Clock size={15} />;
    }

    return <AlertTriangle size={15} />;
  };

  /* ===================================================
     EDITAR
  =================================================== */

  const handleEditarPago = (pago: PagoEmpleado) => {
    if (pago.estado !== "pendiente") {
      void Swal.fire({
        icon: "warning",

        title: "Pago no editable",

        text: "Solo los pagos pendientes pueden modificarse.",

        confirmButtonText: "Aceptar",
      });

      return;
    }

    setPagoEditandoId(pago.id);

    setEditModalOpen(true);
  };

  /* ===================================================
     VER DETALLE
  =================================================== */

  const handleVerDetalle = async (pago: PagoEmpleado) => {
    try {
      Swal.fire({
        title: "Cargando detalle...",

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const detalle = await getPagoEmpleadoById(pago.id);

      const empleado =
        detalle.empleado_nombre ||
        `${detalle.empleado_nombres ?? ""} ${detalle.empleado_apellidos ?? ""}`.trim() ||
        "Empleado";

      await Swal.fire({
        title: "Detalle del pago",

        width: 760,

        confirmButtonText: "Cerrar",

        html: `
            <div
              style="
                text-align:left;
                font-size:14px;
                line-height:1.6;
              "
            >
              <div
                style="
                  display:grid;
                  grid-template-columns:
                    repeat(2,minmax(0,1fr));
                  gap:12px;
                "
              >
                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Empleado
                  </strong>
                  <br/>
                  ${empleado}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Cédula
                  </strong>
                  <br/>
                  ${detalle.empleado_cedula ?? "-"}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Obra
                  </strong>
                  <br/>
                  ${detalle.obra_nombre ?? "No vinculado"}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Cargo
                  </strong>
                  <br/>
                  ${detalle.cargo_obra ?? detalle.empleado_cargo ?? "-"}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Tipo de pago
                  </strong>
                  <br/>
                  ${capitalizar(detalle.tipo_pago)}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Estado
                  </strong>
                  <br/>
                  ${capitalizar(detalle.estado)}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Período
                  </strong>
                  <br/>
                  ${detalle.periodo_descripcion}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Monto
                  </strong>
                  <br/>
                  ${moneda(detalle.monto)}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Fecha inicio
                  </strong>
                  <br/>
                  ${fecha(detalle.fecha_inicio_periodo)}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Fecha fin
                  </strong>
                  <br/>
                  ${fecha(detalle.fecha_fin_periodo)}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Fecha pago
                  </strong>
                  <br/>
                  ${fecha(detalle.fecha_pago)}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Método
                  </strong>
                  <br/>
                  ${
                    detalle.metodo_pago ? capitalizar(detalle.metodo_pago) : "-"
                  }
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Cuenta
                  </strong>
                  <br/>
                  ${detalle.cuenta_nombre ?? "-"}
                </div>

                <div
                  style="
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    Referencia
                  </strong>
                  <br/>
                  ${detalle.referencia ?? "-"}
                </div>
              </div>

              <div
                style="
                  margin-top:12px;
                  padding:12px;
                  background:#f9fafb;
                  border-radius:8px;
                "
              >
                <strong>
                  Observaciones
                </strong>
                <br/>
                ${detalle.observaciones ?? "Sin observaciones"}
              </div>

              ${
                detalle.transaccion_id
                  ? `
                    <div
                      style="
                        margin-top:12px;
                        padding:12px;
                        background:#ecfdf5;
                        border:1px solid #a7f3d0;
                        border-radius:8px;
                        color:#065f46;
                      "
                    >
                      <strong>
                        Transacción financiera
                      </strong>
                      <br/>
                      ${detalle.transaccion_id}
                    </div>
                  `
                  : ""
              }
            </div>
          `,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",

        title: "No se pudo obtener el pago",

        text: obtenerMensajeError(error),
      });
    }
  };

  /* ===================================================
     ABRIR VISTA PREVIA
  =================================================== */

  const handleVerComprobante = async (pago: PagoEmpleado) => {
    try {
      if (pago.estado !== "pagado" && pago.estado !== "anulado") {
        await Swal.fire({
          icon: "warning",

          title: "Comprobante no disponible",

          text: "El comprobante se genera únicamente cuando el pago ha sido confirmado.",

          confirmButtonText: "Aceptar",
        });

        return;
      }

      Swal.fire({
        title: "Preparando comprobante...",

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      /*
       * Consultamos nuevamente el backend
       * para utilizar los datos definitivos.
       */

      const detalle = await getPagoEmpleadoById(pago.id);

      Swal.close();

      setPagoVistaPrevia(construirDatosComprobante(detalle));

      setVistaPreviaOpen(true);
    } catch (error) {
      console.error("Error preparando comprobante:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo abrir el comprobante",

        text: obtenerMensajeError(error),

        confirmButtonText: "Aceptar",
      });
    }
  };

  /* ===================================================
     CUENTAS
  =================================================== */

  const obtenerCuentasActivas = async (): Promise<CuentaFinanciera[]> => {
    const response = await api.get("/cuentas-financieras");

    const data = Array.isArray(response.data?.data) ? response.data.data : [];

    return data.filter((cuenta: CuentaFinanciera) => cuenta.activo !== false);
  };

  /* ===================================================
     CONFIRMAR PAGO
  =================================================== */

  const handleConfirmarPago = async (pago: PagoEmpleado) => {
    try {
      const cuentas = await obtenerCuentasActivas();

      if (cuentas.length === 0) {
        await Swal.fire({
          icon: "warning",

          title: "No hay cuentas disponibles",

          text: "Debe registrar y activar al menos una cuenta financiera antes de confirmar el pago.",

          confirmButtonText: "Aceptar",
        });

        return;
      }

      const opcionesCuenta = cuentas
        .map(
          (cuenta) => `
                <option
                  value="${cuenta.id}"
                >
                  ${cuenta.nombre}
                  - Saldo:
                  ${moneda(cuenta.saldo_actual)}
                </option>
              `,
        )
        .join("");

      const empleado =
        pago.empleado_nombre ||
        `${pago.empleado_nombres ?? ""} ${pago.empleado_apellidos ?? ""}`.trim();

      const resultado = await Swal.fire({
        title: "Confirmar pago",

        width: 620,

        showCancelButton: true,

        confirmButtonText: "Confirmar pago",

        cancelButtonText: "Cancelar",

        focusConfirm: false,

        html: `
              <div
                style="
                  text-align:left;
                  font-size:14px;
                "
              >
                <div
                  style="
                    margin-bottom:16px;
                    padding:12px;
                    background:#f9fafb;
                    border-radius:8px;
                  "
                >
                  <strong>
                    ${empleado}
                  </strong>

                  <br/>

                  ${pago.periodo_descripcion}

                  <br/>

                  <span
                    style="
                      font-size:22px;
                      font-weight:700;
                    "
                  >
                    ${moneda(pago.monto)}
                  </span>
                </div>

                <label
                  style="
                    display:block;
                    margin-bottom:6px;
                    font-weight:600;
                  "
                >
                  Cuenta financiera *
                </label>

                <select
                  id="swal-cuenta"
                  class="swal2-select"
                  style="
                    width:100%;
                    margin:0 0 14px 0;
                  "
                >
                  <option value="">
                    Seleccione una cuenta
                  </option>

                  ${opcionesCuenta}
                </select>

                <label
                  style="
                    display:block;
                    margin-bottom:6px;
                    font-weight:600;
                  "
                >
                  Fecha de pago *
                </label>

                <input
                  id="swal-fecha"
                  type="date"
                  value="${fechaHoy()}"
                  class="swal2-input"
                  style="
                    width:100%;
                    margin:0 0 14px 0;
                  "
                />

                <label
                  style="
                    display:block;
                    margin-bottom:6px;
                    font-weight:600;
                  "
                >
                  Método de pago *
                </label>

                <select
                  id="swal-metodo"
                  class="swal2-select"
                  style="
                    width:100%;
                    margin:0 0 14px 0;
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

                <label
                  style="
                    display:block;
                    margin-bottom:6px;
                    font-weight:600;
                  "
                >
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

        text: "Registrando egreso financiero.",

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const confirmacion = await confirmarPagoEmpleado(
        pago.id,
        resultado.value,
      );

      /*
       * Volvemos a consultar el pago
       * después de confirmar.
       */

      const pagoConfirmado = await getPagoEmpleadoById(pago.id);

      const decision = await Swal.fire({
        icon: "success",

        title: "Pago confirmado",

        html: `
              <div
                style="
                  text-align:left;
                  line-height:1.8;
                "
              >
                <strong>
                  Monto:
                </strong>
                ${moneda(confirmacion.pago.monto)}

                <br/>

                <strong>
                  Cuenta:
                </strong>
                ${confirmacion.cuenta.nombre}

                <br/>

                <strong>
                  Nuevo saldo:
                </strong>
                ${moneda(confirmacion.cuenta.saldo_actual)}

                <br/>

                <strong>
                  Estado:
                </strong>
                Pagado

                <div
                  style="
                    margin-top:14px;
                    padding:10px;
                    background:#ecfdf5;
                    border:1px solid #a7f3d0;
                    border-radius:8px;
                    color:#065f46;
                  "
                >
                  El comprobante ya está disponible.
                </div>
              </div>
            `,

        showCancelButton: true,

        confirmButtonText: "Ver comprobante",

        cancelButtonText: "Cerrar",

        confirmButtonColor: "#2563eb",
      });

      await cargarDatos(false);

      /*
       * AHORA NO IMPRIMIMOS.
       *
       * ABRIMOS EL VISOR.
       */

      if (decision.isConfirmed) {
        setPagoVistaPrevia(construirDatosComprobante(pagoConfirmado));

        setVistaPreviaOpen(true);
      }
    } catch (error) {
      console.error("Error confirmando pago:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo confirmar el pago",

        text: obtenerMensajeError(error),

        confirmButtonText: "Aceptar",
      });
    }
  };

  /* ===================================================
     ANULAR
  =================================================== */

  const handleAnularPago = async (pago: PagoEmpleado) => {
    const empleado =
      pago.empleado_nombre ||
      `${pago.empleado_nombres ?? ""} ${pago.empleado_apellidos ?? ""}`.trim();

    const warning =
      pago.estado === "pagado"
        ? "Este pago ya afectó una cuenta financiera. Al anularlo, el backend realizará una reversión y devolverá el dinero a la cuenta."
        : "El pago está pendiente y será marcado como anulado sin afectar ninguna cuenta.";

    const resultado = await Swal.fire({
      icon: "warning",

      title: "Anular pago",

      html: `
            <div
              style="
                text-align:left;
                line-height:1.6;
              "
            >
              <p>
                <strong>
                  Empleado:
                </strong>
                ${empleado}
              </p>

              <p>
                <strong>
                  Monto:
                </strong>
                ${moneda(pago.monto)}
              </p>

              <p
                style="
                  margin-top:12px;
                "
              >
                ${warning}
              </p>
            </div>
          `,

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

      await cargarDatos(false);
    } catch (error) {
      console.error("Error anulando pago:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo anular el pago",

        text: obtenerMensajeError(error),
      });
    }
  };

  /* ===================================================
     LIMPIAR FILTROS
  =================================================== */

  const limpiarFiltros = () => {
    setSearch("");

    setFiltroEstado("");

    setFiltroTipoPago("");

    setFechaDesde("");

    setFechaHasta("");

    setPage(1);
  };

  /* ===================================================
     EXPORTAR LISTADO GENERAL
  =================================================== */

  const handleExportar = () => {
    /*
     * Este botón sigue siendo para
     * imprimir el LISTADO GENERAL.
     *
     * No tiene relación con el comprobante.
     */

    window.print();
  };

  /* ===================================================
     DISTRIBUCIÓN
  =================================================== */

  const tiposDistribucion: TipoPagoEmpleado[] = [
    "diario",
    "semanal",
    "quincenal",
    "mensual",
    "otro",
  ];

  const totalVisible = pagos
    .filter((pago) => pago.estado !== "anulado")
    .reduce((acc, pago) => acc + numero(pago.monto), 0);

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <>
      <div className="space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Pagos Empleados
            </h1>

            <p className="mt-1 text-gray-500">
              Registro y control de pagos al personal con trazabilidad
              financiera.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void cargarDatos(false)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              Actualizar
            </button>

            <button
              type="button"
              onClick={handleExportar}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
            >
              <FileDown size={18} />
              Exportar PDF
            </button>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Nuevo Pago
            </button>
          </div>
        </div>

        {/* =================================================
            KPIS
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* PAGADO */}

          <div className="rounded-xl border bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total pagado</p>

                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {moneda(totalPagado)}
                </h2>

                <p className="mt-2 text-xs text-gray-500">
                  {numero(resumen.pagos_confirmados)} pagos confirmados
                </p>
              </div>

              <div className="rounded-full bg-green-100 p-3">
                <DollarSign className="text-green-600" />
              </div>
            </div>
          </div>

          {/* PENDIENTE */}

          <div className="rounded-xl border bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendiente por pagar</p>

                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {moneda(totalPendiente)}
                </h2>

                <p className="mt-2 text-xs text-gray-500">
                  {numero(resumen.pagos_pendientes)} pagos pendientes
                </p>
              </div>

              <div className="rounded-full bg-yellow-100 p-3">
                <Wallet className="text-yellow-600" />
              </div>
            </div>
          </div>

          {/* EMPLEADOS */}

          <div className="rounded-xl border bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Empleados con pagos</p>

                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {empleadosConPagos}
                </h2>

                <p className="mt-2 text-xs text-gray-500">
                  Personal con registros de pago
                </p>
              </div>

              <div className="rounded-full bg-blue-100 p-3">
                <Users className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* OBRAS */}

          <div className="rounded-xl border bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vinculados a obra</p>

                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {pagosVinculados}
                </h2>

                <p className="mt-2 text-xs text-gray-500">
                  Pagos asociados a proyectos
                </p>
              </div>

              <div className="rounded-full bg-purple-100 p-3">
                <Building2 className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            FILTROS
        ================================================= */}

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                type="text"
                placeholder="Buscar empleado, cédula, obra, período..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border py-2 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(event) =>
                setFiltroEstado(event.target.value as EstadoPagoEmpleado | "")
              }
              className="rounded-lg border bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Todos los estados</option>

              <option value="pendiente">Pendiente</option>

              <option value="pagado">Pagado</option>

              <option value="anulado">Anulado</option>
            </select>

            <select
              value={filtroTipoPago}
              onChange={(event) =>
                setFiltroTipoPago(event.target.value as TipoPagoEmpleado | "")
              }
              className="rounded-lg border bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Todos los tipos</option>

              <option value="diario">Diario</option>

              <option value="semanal">Semanal</option>

              <option value="quincenal">Quincenal</option>

              <option value="mensual">Mensual</option>

              <option value="otro">Otro</option>
            </select>

            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              className="rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />

            <input
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              onChange={(event) => setFechaHasta(event.target.value)}
              className="rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="mt-4 flex justify-between text-sm">
            <span className="text-gray-500">
              {totalRegistros} registro
              {totalRegistros === 1 ? "" : "s"} encontrado
              {totalRegistros === 1 ? "" : "s"}
            </span>

            {(search ||
              filtroEstado ||
              filtroTipoPago ||
              fechaDesde ||
              fechaHasta) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="font-medium text-[var(--color-primary)] hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            TABLA
        ================================================= */}

        <div className="overflow-hidden rounded-xl border bg-white shadow">
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <ReceiptText size={20} className="text-[var(--color-primary)]" />

              <h2 className="text-xl font-semibold text-gray-800">
                Registro de pagos
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Los pagos confirmados generan automáticamente un egreso
              financiero.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[340px] flex-col items-center justify-center gap-3">
              <Loader2
                size={34}
                className="animate-spin text-[var(--color-primary)]"
              />

              <p className="text-sm text-gray-500">Cargando pagos...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Fecha
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Empleado
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Obra
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Período
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Cuenta
                      </th>

                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Monto
                      </th>

                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Estado
                      </th>

                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagos.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-14 text-center">
                          <div className="flex flex-col items-center">
                            <Wallet size={40} className="mb-3 text-gray-300" />

                            <p className="font-medium text-gray-600">
                              No hay pagos registrados
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                              Registre un nuevo pago o cambie los filtros.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {pagos.map((pago) => {
                      const nombreEmpleado =
                        pago.empleado_nombre ||
                        `${pago.empleado_nombres ?? ""} ${pago.empleado_apellidos ?? ""}`.trim() ||
                        "Empleado";

                      const fechaPrincipal =
                        pago.fecha_pago ||
                        pago.fecha_inicio_periodo ||
                        pago.fecha_creacion;

                      return (
                        <tr
                          key={pago.id}
                          className="border-t transition hover:bg-gray-50"
                        >
                          {/* FECHA */}

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarDays
                                size={16}
                                className="text-gray-400"
                              />

                              {fecha(fechaPrincipal)}
                            </div>

                            <p className="mt-1 max-w-[110px] truncate text-xs text-gray-400">
                              {pago.id}
                            </p>
                          </td>

                          {/* EMPLEADO */}

                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">
                              {nombreEmpleado}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {pago.empleado_cedula ?? "Sin cédula"}

                              {pago.empleado_cargo
                                ? ` · ${pago.empleado_cargo}`
                                : ""}
                            </p>
                          </td>

                          {/* OBRA */}

                          <td className="px-4 py-3">
                            {pago.obra_nombre ? (
                              <>
                                <p className="font-medium text-gray-700">
                                  {pago.obra_nombre}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {pago.cargo_obra ||
                                    pago.obra_codigo ||
                                    "Vinculado"}
                                </p>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No vinculado
                              </span>
                            )}
                          </td>

                          {/* PERIODO */}

                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800">
                              {pago.periodo_descripcion}
                            </p>

                            <p className="mt-1 text-xs capitalize text-gray-500">
                              {pago.tipo_pago}
                            </p>
                          </td>

                          {/* CUENTA */}

                          <td className="px-4 py-3">
                            {pago.cuenta_nombre ? (
                              <>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                  <CreditCard
                                    size={15}
                                    className="text-gray-400"
                                  />

                                  {pago.cuenta_nombre}
                                </div>

                                <p className="mt-1 text-xs capitalize text-gray-500">
                                  {pago.metodo_pago || "-"}
                                </p>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Por confirmar
                              </span>
                            )}
                          </td>

                          {/* MONTO */}

                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-bold ${
                                pago.estado === "anulado"
                                  ? "text-gray-400 line-through"
                                  : "text-red-600"
                              }`}
                            >
                              {moneda(pago.monto)}
                            </span>
                          </td>

                          {/* ESTADO */}

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getEstadoClass(
                                pago.estado,
                              )}`}
                            >
                              {getEstadoIcon(pago.estado)}

                              {capitalizar(pago.estado)}
                            </span>
                          </td>

                          {/* ACCIONES */}

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {/* VER */}

                              <button
                                type="button"
                                onClick={() => void handleVerDetalle(pago)}
                                title="Ver detalle"
                                className="rounded-lg p-2 text-cyan-600 transition hover:scale-105 hover:bg-cyan-50"
                              >
                                <Eye size={18} />
                              </button>

                              {/* EDIT */}

                              {pago.estado === "pendiente" && (
                                <button
                                  type="button"
                                  onClick={() => handleEditarPago(pago)}
                                  title="Editar pago"
                                  className="rounded-lg p-2 text-blue-600 transition hover:scale-105 hover:bg-blue-50"
                                >
                                  <Pencil size={18} />
                                </button>
                              )}

                              {/* CONFIRM */}

                              {pago.estado === "pendiente" && (
                                <button
                                  type="button"
                                  onClick={() => void handleConfirmarPago(pago)}
                                  title="Confirmar pago"
                                  className="rounded-lg p-2 text-green-600 transition hover:scale-105 hover:bg-green-50"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}

                              {/* COMPROBANTE */}

                              {pago.estado === "pagado" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleVerComprobante(pago)
                                  }
                                  title="Ver comprobante"
                                  className="rounded-lg p-2 text-violet-600 transition hover:scale-105 hover:bg-violet-50"
                                >
                                  <FileText size={18} />
                                </button>
                              )}

                              {/* ANULAR */}

                              {pago.estado !== "anulado" && (
                                <button
                                  type="button"
                                  onClick={() => void handleAnularPago(pago)}
                                  title="Anular pago"
                                  className="rounded-lg p-2 text-red-600 transition hover:scale-105 hover:bg-red-50"
                                >
                                  <Ban size={18} />
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

              {/* PAGINACIÓN */}

              <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Página {page} de {Math.max(totalPages, 1)}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(current - 1, 1))
                    }
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(current + 1, Math.max(totalPages, 1)),
                      )
                    }
                    disabled={page >= totalPages || totalPages === 0}
                    className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* =================================================
            PANELES
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* DISTRIBUCIÓN */}

          <div className="rounded-xl border bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <BriefcaseBusiness
                size={20}
                className="text-[var(--color-primary)]"
              />

              <h2 className="text-xl font-semibold text-gray-800">
                Distribución visible por tipo de pago
              </h2>
            </div>

            <div className="space-y-4">
              {tiposDistribucion.map((tipo) => {
                const total = pagos
                  .filter(
                    (pago) =>
                      pago.tipo_pago === tipo && pago.estado !== "anulado",
                  )
                  .reduce((acc, pago) => acc + numero(pago.monto), 0);

                const porcentaje =
                  totalVisible > 0
                    ? Math.min((total / totalVisible) * 100, 100)
                    : 0;

                return (
                  <div key={tipo}>
                    <div className="mb-2 flex justify-between">
                      <span className="font-medium capitalize text-gray-700">
                        {tipo}
                      </span>

                      <span className="font-semibold text-gray-800">
                        {moneda(total)}
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-gray-200">
                      <div
                        className="h-3 rounded-full bg-[var(--color-primary)] transition-all"
                        style={{
                          width: `${porcentaje}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REGLAS */}

          <div className="rounded-xl border bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Control financiero de nómina
            </h2>

            <div className="space-y-3">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="font-semibold text-yellow-800">
                  Registro inicial = pendiente
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                  Crear una obligación de pago no modifica el saldo de ninguna
                  cuenta.
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="font-semibold text-blue-800">
                  Pendiente = editable
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  Mientras el pago esté pendiente puede corregirse empleado,
                  obra, asignación, período, tipo y monto.
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">
                  Confirmar = egreso automático
                </p>

                <p className="mt-1 text-sm text-red-700">
                  El backend valida saldo, registra la transacción y descuenta
                  la cuenta financiera.
                </p>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="font-semibold text-purple-800">
                  Comprobante de pago
                </p>

                <p className="mt-1 text-sm text-purple-700">
                  Una vez confirmado el pago puede visualizarse la hoja A4,
                  imprimirla o guardarla como PDF.
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="font-semibold text-green-800">
                  Anulación con trazabilidad
                </p>

                <p className="mt-1 text-sm text-green-700">
                  Un pago confirmado no se elimina. El backend genera una
                  reversión financiera y conserva el historial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          CREATE MODAL
      =================================================== */}

      <CreatePagoEmpleadoModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={async () => {
          setPage(1);

          await cargarDatos(false);
        }}
      />

      {/* ===================================================
          EDIT MODAL
      =================================================== */}

      <EditPagoEmpleadoModal
        isOpen={editModalOpen}
        pagoId={pagoEditandoId}
        onClose={() => {
          setEditModalOpen(false);

          setPagoEditandoId(null);
        }}
        onUpdated={async () => {
          await cargarDatos(false);
        }}
      />

      {/* ===================================================
          VISTA PREVIA DEL COMPROBANTE

          EL PAGOS PAGE YA NO IMPRIME EL DOCUMENTO.

          VistaPreviaPagoModal se encarga de:
          - mostrar A4
          - cerrar
          - ampliar
          - imprimir
          - guardar PDF
      =================================================== */}

      <VistaPreviaPagoModal
        isOpen={vistaPreviaOpen}
        data={pagoVistaPrevia}
        onClose={() => {
          setVistaPreviaOpen(false);

          setPagoVistaPrevia(null);
        }}
      />
    </>
  );
}

export default PagosEmpleadosPage;
