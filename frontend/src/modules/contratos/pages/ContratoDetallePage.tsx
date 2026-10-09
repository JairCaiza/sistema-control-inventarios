import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  DollarSign,
  Loader2,
  PackagePlus,
  Pencil,
  Printer,
  ReceiptText,
  RefreshCw,
  User,
  Ban,
} from "lucide-react";
import Swal from "sweetalert2";
import { getContratoById } from "../service/contratoService";
import {
  listarPagosContrato,
  obtenerResumenPagosContrato,
  anularPagoContrato,
  corregirPagoContrato,
  listarCuentasFinancieras,
} from "../service/pagosContratosService";
import type {
  PagoContrato,
  ResumenPagosContrato,
  CuentaFinanciera,
  CorregirPagoContratoData,
} from "../service/pagosContratosService";
import AddActivoContratoModal from "../components/AddActivoContratoModal";
import RegistrarPagoContratoModal from "../components/RegistrarPagoContratoModal";
import JornadasContrato from "../components/jornadas/JornadasContrato";
// =====================================================
// TIPOS
// =====================================================
interface ActivoContrato {
  id: string;
  detalle_id?: string;
  codigo?: string;
  nombre: string;
  cantidad: number | string;
  precio_dia: number | string;
  dias?: number | string;
  subtotal: number | string;
}
interface Contrato {
  id: string;
  numero_contrato?: string;
  cliente: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
  total?: number | string;
  pagado?: number | string;
  saldo_pendiente?: number | string;
  activos?: ActivoContrato[];
}
// =====================================================
// UTILIDADES
// =====================================================
const numeroSeguro = (valor: unknown): number => {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero : 0;
};
const formatoMoneda = (valor: number | string | null | undefined): string => {
  return numeroSeguro(valor).toLocaleString("es-EC", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
const formatoFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return "Sin fecha";
  const fechaTexto = String(fecha).slice(0, 10);
  const partes = fechaTexto.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaTexto;
};
const escaparHtml = (valor: unknown): string => {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};
const obtenerMensajeError = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
        };
      };
      message?: string;
    };
    return (
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Ocurrió un error inesperado."
    );
  }
  return "Ocurrió un error inesperado.";
};
const getEstadoClass = (estado?: string): string => {
  switch (estado) {
    case "activo":
      return "bg-green-100 text-green-700";
    case "finalizado":
      return "bg-blue-100 text-blue-700";
    case "cancelado":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};
// =====================================================
// COMPONENTE
// =====================================================
function ContratoDetallePage() {
  const { id } = useParams<{ id: string }>();
  // =====================================================
  // ESTADOS
  // =====================================================
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [pagos, setPagos] = useState<PagoContrato[]>([]);
  const [resumenFinanciero, setResumenFinanciero] =
    useState<ResumenPagosContrato | null>(null);
  const [modalActivoOpen, setModalActivoOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [error, setError] = useState("");
  const [errorResumen, setErrorResumen] = useState("");
  const [errorPagos, setErrorPagos] = useState("");
  // =====================================================
  // CARGAR CONTRATO
  // =====================================================
  const loadContrato = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getContratoById(id);
      setContrato(data);
      setError("");
    } catch (err) {
      console.error("Error al cargar contrato:", err);
      setError("No se pudo cargar la información del contrato.");
      throw err;
    }
  }, [id]);
  // =====================================================
  // CARGAR PAGOS
  // =====================================================
  const loadPagos = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingPagos(true);
      setErrorPagos("");
      const data = await listarPagosContrato(id);
      setPagos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar pagos:", err);
      setErrorPagos(obtenerMensajeError(err));
      throw err;
    } finally {
      setLoadingPagos(false);
    }
  }, [id]);
  // =====================================================
  // CARGAR RESUMEN FINANCIERO EFECTIVO
  // =====================================================
  const loadResumenFinanciero = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingResumen(true);
      setErrorResumen("");
      const data = await obtenerResumenPagosContrato(id);
      setResumenFinanciero(data);
    } catch (err) {
      console.error("Error al cargar resumen financiero:", err);
      setResumenFinanciero(null);
      setErrorResumen(obtenerMensajeError(err));
      throw err;
    } finally {
      setLoadingResumen(false);
    }
  }, [id]);
  // =====================================================
  // CARGA INICIAL
  // =====================================================
  useEffect(() => {
    let activo = true;
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.allSettled([
        loadContrato(),
        loadPagos(),
        loadResumenFinanciero(),
      ]);
      if (activo) {
        setLoading(false);
      }
    };
    void cargarDatos();
    return () => {
      activo = false;
    };
  }, [loadContrato, loadPagos, loadResumenFinanciero]);
  // =====================================================
  // ACTUALIZAR DESPUÉS DE REGISTRAR PAGO
  // =====================================================
  const handlePagoRegistrado = async () => {
    const resultados = await Promise.allSettled([
      loadContrato(),
      loadPagos(),
      loadResumenFinanciero(),
    ]);
    const fallo = resultados.some(
      (resultado) => resultado.status === "rejected",
    );
    if (fallo) {
      throw new Error(
        "El pago fue registrado, pero no se pudo actualizar toda la información.",
      );
    }
    setModalPagoOpen(false);
  };
  // =====================================================
  // ACTUALIZAR DESPUÉS DE AGREGAR ACTIVO
  // =====================================================
  const handleActivoAgregado = async () => {
    await Promise.all([loadContrato(), loadResumenFinanciero()]);
    setModalActivoOpen(false);
  };
  // =====================================================
  // ACTUALIZAR INFORMACIÓN
  // =====================================================
  const actualizarDatos = async () => {
    await Promise.allSettled([
      loadContrato(),
      loadPagos(),
      loadResumenFinanciero(),
    ]);
  };
  // =====================================================
  // ANULAR PAGO CON REVERSIÓN FINANCIERA
  // =====================================================
  const handleAnularPago = async (pago: PagoContrato) => {
    if (!id || pago.estado === "anulado") return;
    const confirmacion = await Swal.fire({
      title: "Anular pago",
      html: `
        <p>Está por anular el pago de
          <strong>$${formatoMoneda(pago.monto)}</strong>.</p>
        <p class="mt-2 text-sm">
          Se registrará una reversión financiera y el pago
          permanecerá en el historial de auditoría.
        </p>
      `,
      input: "textarea",
      inputLabel: "Motivo de anulación",
      inputPlaceholder: "Explique el motivo de la anulación...",
      inputAttributes: { maxlength: "500" },
      showCancelButton: true,
      confirmButtonText: "Confirmar anulación",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b91c1c",
      showLoaderOnConfirm: true,
      preConfirm: async (valor: string) => {
        const motivo = valor.trim();
        if (motivo.length < 10) {
          Swal.showValidationMessage(
            "El motivo debe contener al menos 10 caracteres.",
          );
          return false;
        }
        try {
          await anularPagoContrato(id, pago.id, motivo);
          return true;
        } catch (error) {
          Swal.showValidationMessage(obtenerMensajeError(error));
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });
    if (!confirmacion.isConfirmed) return;
    const resultados = await Promise.allSettled([
      loadContrato(),
      loadPagos(),
      loadResumenFinanciero(),
    ]);
    const fallo = resultados.some(
      (resultado) => resultado.status === "rejected",
    );
    await Swal.fire(
      fallo
        ? {
            icon: "warning",
            title: "Pago anulado",
            text: "La anulación se realizó, pero algunos datos no pudieron actualizarse. Pulse Actualizar.",
          }
        : {
            icon: "success",
            title: "Pago anulado",
            text: "Se registró correctamente la reversión financiera.",
          },
    );
  };
  // =====================================================
  // CORREGIR PAGO CON REVERSIÓN FINANCIERA
  // =====================================================
  const handleCorregirPago = async (pago: PagoContrato) => {
    if (!id || pago.estado !== "registrado" || contrato?.estado !== "activo")
      return;
    if (pago.concepto !== "alquiler" && pago.concepto !== "anticipo") {
      await Swal.fire({
        icon: "warning",
        title: "Corrección no disponible",
        text: "Solo se permiten alquiler y anticipo.",
      });
      return;
    }
    let cuentas: CuentaFinanciera[];
    try {
      cuentas = await listarCuentasFinancieras();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error al cargar cuentas",
        text: obtenerMensajeError(error),
      });
      return;
    }
    const opciones = cuentas
      .filter((c) => c.activa !== false || c.id === pago.cuenta_id)
      .map(
        (c) =>
          `<option value="${escaparHtml(c.id)}" ${c.id === pago.cuenta_id ? "selected" : ""}>${escaparHtml(c.nombre)}</option>`,
      )
      .join("");
    const resultado = await Swal.fire({
      title: "Corregir pago",
      width: 650,
      html: `
        <div style="text-align:left;display:grid;gap:12px">
          <p>Se revertirá el pago original de <strong>$${formatoMoneda(pago.monto)}</strong> y se registrará uno nuevo. Se conservará el historial.</p>
          <label for="corregir-cuenta">Cuenta financiera</label>
          <select id="corregir-cuenta" class="swal2-input" style="width:100%;margin:0">${opciones}</select>
          <label for="corregir-monto">Nuevo monto ($)</label>
          <input id="corregir-monto" class="swal2-input" style="width:100%;margin:0" type="number" min="0.01" step="0.01" value="${numeroSeguro(pago.monto).toFixed(2)}" />
          <label for="corregir-metodo">Método de pago</label>
          <input id="corregir-metodo" class="swal2-input" style="width:100%;margin:0" maxlength="100" value="${escaparHtml(pago.metodo_pago || "efectivo")}" />
          <label for="corregir-concepto">Concepto</label>
          <select id="corregir-concepto" class="swal2-input" style="width:100%;margin:0">
            <option value="alquiler" ${pago.concepto === "alquiler" ? "selected" : ""}>Alquiler</option>
            <option value="anticipo" ${pago.concepto === "anticipo" ? "selected" : ""}>Anticipo</option>
          </select>
          <label for="corregir-observaciones">Observaciones</label>
          <textarea id="corregir-observaciones" class="swal2-textarea" style="width:100%;margin:0" maxlength="1000">${escaparHtml(pago.observaciones || "")}</textarea>
          <label for="corregir-motivo">Motivo de corrección (mínimo 10 caracteres)</label>
          <textarea id="corregir-motivo" class="swal2-textarea" style="width:100%;margin:0" maxlength="500" placeholder="Explique el motivo obligatorio"></textarea>
        </div>`,
      showCancelButton: true,
      confirmButtonText: "Guardar corrección",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        const valor = (campo: string) =>
          (
            document.getElementById(campo) as
              | HTMLInputElement
              | HTMLTextAreaElement
              | HTMLSelectElement
              | null
          )?.value ?? "";
        const cuenta_id = valor("corregir-cuenta");
        const montoTexto = valor("corregir-monto");
        const monto = Number(montoTexto);
        const metodo_pago = valor("corregir-metodo").trim();
        const concepto = valor("corregir-concepto");
        const observaciones = valor("corregir-observaciones");
        const motivo_correccion = valor("corregir-motivo").trim();
        if (!cuenta_id) {
          Swal.showValidationMessage("Seleccione una cuenta financiera.");
          return false;
        }
        if (
          !montoTexto ||
          !Number.isFinite(monto) ||
          monto <= 0 ||
          Math.abs(monto * 100 - Math.round(monto * 100)) > 0.0000001
        ) {
          Swal.showValidationMessage(
            "Ingrese un monto válido con máximo dos decimales.",
          );
          return false;
        }
        if (!metodo_pago) {
          Swal.showValidationMessage("Ingrese el método de pago.");
          return false;
        }
        if (concepto !== "alquiler" && concepto !== "anticipo") {
          Swal.showValidationMessage("Seleccione un concepto válido.");
          return false;
        }
        if (motivo_correccion.length < 10) {
          Swal.showValidationMessage(
            "El motivo debe tener al menos 10 caracteres.",
          );
          return false;
        }
        const datos: CorregirPagoContratoData = {
          cuenta_id,
          monto,
          metodo_pago,
          concepto,
          observaciones,
          motivo_correccion,
        };
        try {
          await corregirPagoContrato(id, pago.id, datos);
          return true;
        } catch (error) {
          Swal.showValidationMessage(obtenerMensajeError(error));
          return false;
        }
      },
    });
    if (!resultado.isConfirmed) return;
    const resultados = await Promise.allSettled([
      loadContrato(),
      loadPagos(),
      loadResumenFinanciero(),
    ]);
    const fallo = resultados.some((r) => r.status === "rejected");
    await Swal.fire(
      fallo
        ? {
            icon: "warning",
            title: "Pago corregido",
            text: "La corrección se realizó, pero no se actualizaron todos los datos. Pulse Actualizar.",
          }
        : {
            icon: "success",
            title: "Pago corregido",
            text: "Se revirtió el pago original y se registró el nuevo pago.",
          },
    );
  };
  // =====================================================
  // IMPRIMIR COMPROBANTE
  // =====================================================
  const imprimirComprobante = (
    pago: PagoContrato,
    contratoActual: Contrato,
  ) => {
    const ventana = window.open("", "_blank", "width=850,height=750");
    if (!ventana) {
      void Swal.fire({
        icon: "warning",
        title: "Ventana bloqueada",
        text:
          "Permite las ventanas emergentes del navegador " +
          "para imprimir el comprobante.",
      });
      return;
    }
    const numeroRecibo = pago.id.replace(/-/g, "").slice(0, 12).toUpperCase();
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>
          Recibo ${escaparHtml(numeroRecibo)}
        </title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 36px;
            background: #f3f4f6;
            color: #1f2937;
            font-family: Arial, sans-serif;
          }
          .recibo {
            max-width: 760px;
            margin: auto;
            padding: 36px;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 12px;
          }
          .cabecera {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding-bottom: 20px;
            border-bottom: 2px solid #166534;
          }
          h1 {
            margin: 0;
            font-size: 24px;
            color: #166534;
          }
          h2 {
            margin: 0 0 15px;
            font-size: 17px;
          }
          .subtitulo {
            margin-top: 8px;
            color: #6b7280;
            font-size: 13px;
          }
          .numero {
            text-align: right;
            font-size: 13px;
          }
          .numero strong {
            display: block;
            margin-top: 5px;
            font-size: 16px;
          }
          .seccion {
            margin-top: 28px;
          }
          .fila {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 11px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .etiqueta {
            color: #6b7280;
          }
          .valor {
            font-weight: 600;
            text-align: right;
          }
          .monto {
            margin-top: 28px;
            padding: 22px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            text-align: center;
          }
          .monto span {
            display: block;
            font-size: 13px;
            color: #166534;
          }
          .monto strong {
            display: block;
            margin-top: 8px;
            font-size: 30px;
            color: #166534;
          }
          .observaciones {
            margin-top: 24px;
            font-size: 13px;
            line-height: 1.6;
          }
          .firmas {
            display: flex;
            justify-content: space-between;
            gap: 35px;
            margin-top: 85px;
          }
          .firma {
            flex: 1;
            border-top: 1px solid #374151;
            padding-top: 10px;
            text-align: center;
            font-size: 12px;
          }
          .pie {
            margin-top: 35px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
          }
          .acciones {
            text-align: center;
            margin-top: 20px;
          }
          button {
            padding: 12px 25px;
            border: 0;
            border-radius: 8px;
            background: #166534;
            color: white;
            font-weight: bold;
            cursor: pointer;
          }
          @media print {
            body {
              padding: 0;
              background: white;
            }
            .recibo {
              border: none;
              box-shadow: none;
            }
            .acciones {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="recibo">
          <div class="cabecera">
            <div>
              <h1>RECIBO DE PAGO</h1>
              <p class="subtitulo">
                ConstructSys · Control de alquileres
              </p>
            </div>
            <div class="numero">
              Comprobante
              <strong>
                ${escaparHtml(numeroRecibo)}
              </strong>
            </div>
          </div>
          <div class="seccion">
            <h2>Información del contrato</h2>
            <div class="fila">
              <span class="etiqueta">Contrato</span>
              <span class="valor">
                ${escaparHtml(
                  contratoActual.numero_contrato || contratoActual.id,
                )}
              </span>
            </div>
            <div class="fila">
              <span class="etiqueta">Cliente</span>
              <span class="valor">
                ${escaparHtml(contratoActual.cliente)}
              </span>
            </div>
          </div>
          <div class="seccion">
            <h2>Información del pago</h2>
            <div class="fila">
              <span class="etiqueta">Fecha</span>
              <span class="valor">
                ${escaparHtml(formatoFecha(pago.fecha))}
              </span>
            </div>
            <div class="fila">
              <span class="etiqueta">Concepto</span>
              <span class="valor">
                ${escaparHtml(pago.concepto)}
              </span>
            </div>
            <div class="fila">
              <span class="etiqueta">Método de pago</span>
              <span class="valor">
                ${escaparHtml(pago.metodo_pago)}
              </span>
            </div>
            <div class="fila">
              <span class="etiqueta">Cuenta receptora</span>
              <span class="valor">
                ${escaparHtml(pago.cuenta || "Sin cuenta")}
              </span>
            </div>
          </div>
          <div class="monto">
            <span>IMPORTE RECIBIDO</span>
            <strong>
              $${escaparHtml(formatoMoneda(pago.monto))}
            </strong>
          </div>
          <div class="observaciones">
            <strong>Observaciones:</strong>
            <p>
              ${escaparHtml(pago.observaciones || "Sin observaciones")}
            </p>
          </div>
          <div class="firmas">
            <div class="firma">
              Recibido por
            </div>
            <div class="firma">
              Entregado por
            </div>
          </div>
          <div class="pie">
            Comprobante interno de recepción de pago.
            <p>
              Este documento no sustituye una factura
              o comprobante tributario autorizado.
            </p>
          </div>
        </div>
        <div class="acciones">
          <button type="button" onclick="window.print()">
            Imprimir / Guardar PDF
          </button>
        </div>
      </body>
      </html>
    `;
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
  };
  // =====================================================
  // CARGANDO
  // =====================================================
  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center shadow">
        <Loader2
          size={25}
          className="mx-auto mb-3 animate-spin text-green-600"
        />
        <p className="text-gray-500">Cargando contrato...</p>
      </div>
    );
  }
  // =====================================================
  // ERROR
  // =====================================================
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-medium text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void actualizarDatos()}
          className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }
  if (!contrato) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center shadow">
        <p className="text-gray-500">Contrato no encontrado.</p>
      </div>
    );
  }
  // =====================================================
  // DATOS DEL CONTRATO
  // =====================================================
  const activos = contrato.activos || [];
  const activosParaJornadas = activos
    .filter(
      (
        activo,
      ): activo is ActivoContrato & {
        detalle_id: string;
      } => Boolean(activo.detalle_id),
    )
    .map((activo) => ({
      detalle_id: activo.detalle_id,
      activo_id: activo.id,
      codigo: activo.codigo,
      nombre: activo.nombre,
      cantidad: numeroSeguro(activo.cantidad),
      precio_dia: numeroSeguro(activo.precio_dia),
      subtotal: numeroSeguro(activo.subtotal),
    }));
  const fechaInicio = new Date(contrato.fecha_inicio);
  const fechaFin = new Date(contrato.fecha_fin);
  const diferenciaDias = Math.ceil(
    (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24),
  );
  const dias = Number.isFinite(diferenciaDias)
    ? Math.max(diferenciaDias, 1)
    : 1;
  const subtotalActivos = activos.reduce(
    (sum, activo) => sum + numeroSeguro(activo.subtotal),
    0,
  );
  // =====================================================
  // RESUMEN FINANCIERO EFECTIVO
  // =====================================================
  const totalPrevisto = resumenFinanciero
    ? numeroSeguro(resumenFinanciero.total_previsto)
    : 0;
  const totalEfectivo = resumenFinanciero
    ? numeroSeguro(resumenFinanciero.total_efectivo)
    : 0;
  const pagosAplicables = resumenFinanciero
    ? numeroSeguro(resumenFinanciero.pagos_aplicables)
    : 0;
  const saldoEfectivo = resumenFinanciero
    ? numeroSeguro(resumenFinanciero.saldo_efectivo_pendiente)
    : 0;
  const saldoFavor = resumenFinanciero
    ? numeroSeguro(resumenFinanciero.saldo_a_favor_cliente)
    : 0;
  const penalidadesPagadas = resumenFinanciero
    ? numeroSeguro(resumenFinanciero.total_penalidades_pagadas)
    : 0;
  const disponibleAnticipo = resumenFinanciero
    ? numeroSeguro(resumenFinanciero.disponible_anticipo)
    : 0;
  const saldoPrevisto = numeroSeguro(contrato.saldo_pendiente);
  const contratoActivo = contrato.estado === "activo";
  const puedeRegistrarPago =
    contratoActivo &&
    Boolean(resumenFinanciero) &&
    (saldoEfectivo > 0 || disponibleAnticipo > 0);
  const puedeAgregarActivos = contratoActivo;
  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="space-y-6">
      {/* =================================================
          ENCABEZADO
      ================================================= */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-gray-500">Detalle del contrato</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-800">
            {contrato.numero_contrato
              ? `Contrato ${contrato.numero_contrato}`
              : `Contrato ${contrato.id.slice(0, 8)}`}
          </h1>
          <p className="mt-1 text-xs text-gray-400">ID: {contrato.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${getEstadoClass(
              contrato.estado,
            )}`}
          >
            {contrato.estado || "Sin estado"}
          </span>
          <button
            type="button"
            onClick={() => void actualizarDatos()}
            disabled={loadingPagos || loadingResumen}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loadingPagos || loadingResumen ? "animate-spin" : ""}
            />
            Actualizar
          </button>
          {/* ÚNICO BOTÓN DE REGISTRO DE PAGO */}
          {contratoActivo && (
            <button
              type="button"
              onClick={() => setModalPagoOpen(true)}
              disabled={!puedeRegistrarPago}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard size={18} />
              Registrar pago
            </button>
          )}
        </div>
      </div>
      {/* =================================================
          INFORMACIÓN GENERAL
      ================================================= */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">Información general</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <User size={18} />
              <p className="text-sm">Cliente</p>
            </div>
            <p className="mt-2 font-semibold text-gray-800">
              {contrato.cliente}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarDays size={18} />
              <p className="text-sm">Fecha de inicio</p>
            </div>
            <p className="mt-2 font-semibold text-gray-800">
              {formatoFecha(contrato.fecha_inicio)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarDays size={18} />
              <p className="text-sm">Fecha de finalización</p>
            </div>
            <p className="mt-2 font-semibold text-gray-800">
              {formatoFecha(contrato.fecha_fin)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Duración: {dias} {dias === 1 ? "día" : "días"}
            </p>
          </div>
        </div>
      </div>
      {/* =================================================
          RESUMEN FINANCIERO
      ================================================= */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <DollarSign size={21} className="text-green-600" />
              Resumen financiero
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Importes previstos, jornadas cobrables y pagos aplicados al
              alquiler.
            </p>
          </div>
          {resumenFinanciero &&
            !loadingResumen &&
            (saldoFavor > 0 ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                Saldo a favor
              </span>
            ) : saldoEfectivo <= 0 ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                Sin deuda efectiva
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                Pago pendiente
              </span>
            ))}
        </div>
        {loadingResumen && !resumenFinanciero ? (
          <div className="flex items-center justify-center gap-3 py-10 text-sm text-gray-500">
            <Loader2 size={19} className="animate-spin" />
            Cargando resumen financiero...
          </div>
        ) : errorResumen ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-800">
                No se pudo verificar el resumen financiero.
              </p>
              <p className="mt-1 text-sm text-red-700">{errorResumen}</p>
              <button
                type="button"
                onClick={() => void loadResumenFinanciero().catch(() => {})}
                className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : resumenFinanciero ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border bg-gray-50 p-5">
                <p className="text-sm text-gray-500">Total previsto</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">
                  ${formatoMoneda(totalPrevisto)}
                </p>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="text-sm text-gray-500">Total efectivo</p>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  ${formatoMoneda(totalEfectivo)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-sm text-gray-500">Pagos aplicados</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">
                  ${formatoMoneda(pagosAplicables)}
                </p>
              </div>
              <div
                className={`rounded-xl border p-5 ${
                  saldoFavor > 0
                    ? "border-amber-200 bg-amber-50"
                    : saldoEfectivo > 0
                      ? "border-red-200 bg-red-50"
                      : "border-green-200 bg-green-50"
                }`}
              >
                <p className="text-sm text-gray-500">
                  {saldoFavor > 0
                    ? "Saldo a favor del cliente"
                    : "Saldo efectivo pendiente"}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold ${
                    saldoFavor > 0
                      ? "text-amber-700"
                      : saldoEfectivo > 0
                        ? "text-red-700"
                        : "text-green-700"
                  }`}
                >
                  ${formatoMoneda(saldoFavor > 0 ? saldoFavor : saldoEfectivo)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="rounded-lg bg-gray-100 px-3 py-2">
                Penalidades pagadas:{" "}
                <strong>${formatoMoneda(penalidadesPagadas)}</strong>
              </span>
              <span className="rounded-lg bg-gray-100 px-3 py-2">
                Saldo previsto histórico:{" "}
                <strong>${formatoMoneda(saldoPrevisto)}</strong>
              </span>
              <span className="rounded-lg bg-gray-100 px-3 py-2">
                Disponible para anticipos:{" "}
                <strong>${formatoMoneda(disponibleAnticipo)}</strong>
              </span>
            </div>
          </>
        ) : null}
      </div>
      {/* =================================================
          HISTORIAL DE PAGOS
      ================================================= */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <ReceiptText size={21} className="text-blue-600" />
              Historial de pagos
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pagos de alquiler, anticipos, penalidades y otros conceptos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadPagos().catch(() => {})}
            disabled={loadingPagos}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loadingPagos ? "animate-spin" : ""}
            />
            Actualizar historial
          </button>
        </div>
        {errorPagos && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            No se pudo actualizar el historial: {errorPagos}
          </div>
        )}
        {loadingPagos && pagos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Cargando pagos...</div>
        ) : pagos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Este contrato todavía no tiene pagos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Cuenta
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Método
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Observaciones
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-t hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {formatoFecha(pago.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {pago.cuenta || "Sin cuenta"}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          pago.concepto === "penalidad"
                            ? "bg-amber-100 text-amber-800"
                            : pago.concepto === "anticipo"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {pago.concepto || "Sin concepto"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {pago.metodo_pago || "Sin método"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-green-700">
                      ${formatoMoneda(pago.monto)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          pago.estado === "anulado"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {pago.estado === "anulado" ? "Anulado" : "Registrado"}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3 text-sm text-gray-600">
                      <span
                        className="block truncate"
                        title={pago.observaciones || ""}
                      >
                        {pago.observaciones || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* IMPRIMIR COMPROBANTE */}
                        <button
                          type="button"
                          onClick={() => imprimirComprobante(pago, contrato)}
                          disabled={pago.estado === "anulado"}
                          title={
                            pago.estado === "anulado"
                              ? "Pago anulado: recibo no disponible"
                              : "Imprimir comprobante o guardar PDF"
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Printer size={15} />
                          Recibo
                        </button>
                        {/* CORREGIR PAGO */}
                        <button
                          type="button"
                          onClick={() => void handleCorregirPago(pago)}
                          disabled={
                            pago.estado === "anulado" ||
                            !contratoActivo ||
                            loadingPagos ||
                            loadingResumen ||
                            (pago.concepto !== "alquiler" &&
                              pago.concepto !== "anticipo")
                          }
                          title="Solo Administrador: corregir pago con reversión financiera"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil size={14} />
                          Corregir
                        </button>
                        {/* ANULAR PAGO: el backend valida el rol Administrador */}
                        <button
                          type="button"
                          onClick={() => void handleAnularPago(pago)}
                          disabled={
                            pago.estado === "anulado" ||
                            loadingPagos ||
                            loadingResumen
                          }
                          title={
                            pago.estado === "anulado"
                              ? "Pago anulado"
                              : "Solo Administrador: anular con reversión financiera"
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                            pago.estado === "anulado" ||
                            loadingPagos ||
                            loadingResumen
                              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <Ban size={14} />
                          {pago.estado === "anulado" ? "Anulado" : "Anular"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t bg-gray-50 px-5 py-3">
          <p className="text-xs text-gray-500">
            Los pagos registrados forman parte del historial financiero. Las
            correcciones y anulaciones requerirán una operación de reversión
            auditada.
          </p>
        </div>
      </div>
      {/* =================================================
          ACTIVOS DEL CONTRATO
      ================================================= */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Activos del contrato
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Equipos y herramientas asociados al alquiler.
            </p>
          </div>
          <button
            type="button"
            disabled={!puedeAgregarActivos}
            onClick={() => {
              if (puedeAgregarActivos) {
                setModalActivoOpen(true);
              }
            }}
            title={
              puedeAgregarActivos
                ? "Agregar activo al contrato"
                : "No se pueden agregar activos a un contrato finalizado o cancelado"
            }
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition ${
              puedeAgregarActivos
                ? "bg-[var(--color-primary)] hover:opacity-90"
                : "cursor-not-allowed bg-gray-400 opacity-60"
            }`}
          >
            <PackagePlus size={18} />
            {puedeAgregarActivos ? "Agregar activo" : "Contrato cerrado"}
          </button>
        </div>
        {!puedeAgregarActivos && (
          <div className="border-b bg-yellow-50 px-5 py-3">
            <p className="text-sm text-yellow-700">
              Este contrato está {contrato.estado}. No se pueden agregar nuevos
              activos.
            </p>
          </div>
        )}
        {activos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Este contrato todavía no tiene activos agregados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold">Activo</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Precio por día
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Días
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {activos.map((activo) => {
                  const cantidad = numeroSeguro(activo.cantidad);
                  const precioDia = numeroSeguro(activo.precio_dia);
                  const diasActivo = numeroSeguro(activo.dias || dias);
                  const subtotal = numeroSeguro(activo.subtotal);
                  return (
                    <tr
                      key={activo.detalle_id || activo.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {activo.nombre}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {cantidad}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        ${formatoMoneda(precioDia)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {diasActivo}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold">
                        ${formatoMoneda(subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t bg-gray-50 px-5 py-4 text-right">
          <p className="text-sm text-gray-500">Subtotal calculado de activos</p>
          <p className="mt-1 text-xl font-bold text-gray-800">
            ${formatoMoneda(subtotalActivos)}
          </p>
        </div>
      </div>
      {/* =================================================
          JORNADAS DEL ALQUILER
      ================================================= */}
      <JornadasContrato
        contratoId={contrato.id}
        numeroContrato={contrato.numero_contrato}
        fechaInicio={contrato.fecha_inicio}
        fechaFin={contrato.fecha_fin}
        estadoContrato={contrato.estado || ""}
        activos={activosParaJornadas}
      />
      {/* =================================================
          MODAL AGREGAR ACTIVO
      ================================================= */}
      {puedeAgregarActivos && (
        <AddActivoContratoModal
          open={modalActivoOpen}
          onClose={() => setModalActivoOpen(false)}
          contratoId={contrato.id}
          onAgregado={handleActivoAgregado}
        />
      )}
      {/* =================================================
          MODAL REGISTRAR PAGO
      ================================================= */}
      <RegistrarPagoContratoModal
        open={modalPagoOpen}
        contratoId={contrato.id}
        numeroContrato={contrato.numero_contrato}
        saldoPendiente={saldoEfectivo}
        onClose={() => setModalPagoOpen(false)}
        onPagoRegistrado={handlePagoRegistrado}
      />
    </div>
  );
}
export default ContratoDetallePage;
