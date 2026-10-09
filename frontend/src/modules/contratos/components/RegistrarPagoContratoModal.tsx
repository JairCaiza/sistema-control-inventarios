import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { AlertCircle, DollarSign, Loader2, RefreshCw, X } from "lucide-react";

import Swal from "sweetalert2";

import {
  listarCuentasFinancieras,
  registrarPagoContrato,
  obtenerResumenPagosContrato,
} from "../service/pagosContratosService";

import type {
  CuentaFinanciera,
  RegistrarPagoContratoData,
} from "../service/pagosContratosService";

// =====================================================
// TIPOS
// =====================================================

type ConceptoPago = "alquiler" | "anticipo";

interface RegistrarPagoContratoModalProps {
  open: boolean;
  contratoId: string;
  numeroContrato?: string;

  // Compatibilidad con la página actual.
  // No se utiliza para calcular la deuda efectiva.
  saldoPendiente: number;

  onClose: () => void;
  onPagoRegistrado: () => void | Promise<void>;
}

interface ResumenFinanciero {
  totalPrevisto: number;
  totalEfectivo: number;

  // Solo pagos aplicables al alquiler.
  pagosAplicables: number;

  penalidadesPagadas: number;

  saldoEfectivoPendiente: number;
  saldoFavorCliente: number;
  disponibleAnticipo: number;

  estadoContrato: string;
}

// =====================================================
// UTILIDADES
// =====================================================

const redondear = (valor: number): number => {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
};

const numeroSeguro = (valor: unknown): number => {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero : 0;
};

const formatearDinero = (valor: number): string => {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
};

const obtenerMensajeError = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const errorApi = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
        };
      };
      message?: string;
    };

    return (
      errorApi.response?.data?.message ||
      errorApi.response?.data?.error ||
      errorApi.message ||
      "Ocurrió un error inesperado."
    );
  }

  return "Ocurrió un error inesperado.";
};

// =====================================================
// COMPONENTE
// =====================================================

const RegistrarPagoContratoModal = ({
  open,
  contratoId,
  numeroContrato,
  onClose,
  onPagoRegistrado,
}: RegistrarPagoContratoModalProps) => {
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [concepto, setConcepto] = useState<ConceptoPago>("alquiler");

  const [cuentaId, setCuentaId] = useState("");
  const [monto, setMonto] = useState("");

  const [metodoPago, setMetodoPago] = useState("efectivo");

  const [observaciones, setObservaciones] = useState("");

  // =====================================================
  // CARGAR INFORMACIÓN FINANCIERA
  // =====================================================

  useEffect(() => {
    if (!open || !contratoId) return;

    let cancelado = false;

    const cargarInformacion = async () => {
      setCargando(true);
      setErrorCarga(null);
      setResumen(null);
      setCuentas([]);

      setConcepto("alquiler");
      setCuentaId("");
      setMonto("");
      setMetodoPago("efectivo");
      setObservaciones("");

      try {
        const [cuentasResult, resumenResult] = await Promise.all([
          listarCuentasFinancieras(),
          obtenerResumenPagosContrato(contratoId),
        ]);

        if (cancelado) return;

        const cuentasActivas = cuentasResult.filter(
          (cuenta) => cuenta.activa !== false,
        );

        setCuentas(cuentasActivas);

        if (cuentasActivas.length > 0) {
          setCuentaId(cuentasActivas[0].id);
        }

        setResumen({
          totalPrevisto: numeroSeguro(resumenResult.total_previsto),

          totalEfectivo: numeroSeguro(resumenResult.total_efectivo),

          pagosAplicables: numeroSeguro(resumenResult.pagos_aplicables),

          penalidadesPagadas: numeroSeguro(
            resumenResult.total_penalidades_pagadas,
          ),

          saldoEfectivoPendiente: numeroSeguro(
            resumenResult.saldo_efectivo_pendiente,
          ),

          saldoFavorCliente: numeroSeguro(resumenResult.saldo_a_favor_cliente),

          disponibleAnticipo: numeroSeguro(resumenResult.disponible_anticipo),

          estadoContrato: resumenResult.estado,
        });
      } catch (error: unknown) {
        if (cancelado) return;

        console.error("Error al cargar información de pagos:", error);

        setErrorCarga(obtenerMensajeError(error));
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    void cargarInformacion();

    return () => {
      cancelado = true;
    };
  }, [open, contratoId]);

  // =====================================================
  // VALORES DEL FORMULARIO
  // =====================================================

  const saldoMaximo =
    concepto === "alquiler"
      ? (resumen?.saldoEfectivoPendiente ?? 0)
      : (resumen?.disponibleAnticipo ?? 0);

  const contratoActivo = resumen?.estadoContrato === "activo";

  const montoNumero = Number(monto);

  const montoValido =
    monto.trim() !== "" &&
    Number.isFinite(montoNumero) &&
    montoNumero > 0 &&
    /^\d+(\.\d{1,2})?$/.test(monto.trim()) &&
    montoNumero <= saldoMaximo;

  const puedeRegistrar =
    !guardando &&
    !cargando &&
    !errorCarga &&
    contratoActivo &&
    Boolean(resumen) &&
    Boolean(cuentaId) &&
    cuentas.length > 0 &&
    montoValido;

  // =====================================================
  // CAMBIAR CONCEPTO
  // =====================================================

  const cambiarConcepto = (event: ChangeEvent<HTMLSelectElement>) => {
    const nuevoConcepto = event.target.value as ConceptoPago;

    setConcepto(nuevoConcepto);
    setMonto("");
  };

  // =====================================================
  // REGISTRAR PAGO
  // =====================================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (guardando) return;

    if (!resumen || !contratoActivo) {
      await Swal.fire({
        icon: "warning",
        title: "Contrato no disponible",
        text: "No es posible registrar pagos en este contrato.",
      });

      return;
    }

    if (!cuentaId) {
      await Swal.fire({
        icon: "warning",
        title: "Cuenta requerida",
        text: "Debes seleccionar una cuenta financiera.",
      });

      return;
    }

    if (
      !monto.trim() ||
      !Number.isFinite(montoNumero) ||
      montoNumero <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(monto.trim())
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Monto inválido",
        text: "Ingresa un monto mayor a cero y con máximo dos decimales.",
      });

      return;
    }

    if (saldoMaximo <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Sin saldo disponible",
        text:
          concepto === "alquiler"
            ? "No existen jornadas pendientes de cobro."
            : "No existe importe previsto disponible para anticipos.",
      });

      return;
    }

    if (montoNumero > saldoMaximo) {
      await Swal.fire({
        icon: "warning",
        title: "Monto superior al permitido",
        text: `El monto máximo para esta operación es ${formatearDinero(
          saldoMaximo,
        )}.`,
      });

      return;
    }

    const datosPago: RegistrarPagoContratoData = {
      cuenta_id: cuentaId,
      monto: redondear(montoNumero),
      metodo_pago: metodoPago,
      concepto,
      observaciones: observaciones.trim() || undefined,
    };

    setGuardando(true);

    let pagoRegistrado = false;

    try {
      const resultado = await registrarPagoContrato(contratoId, datosPago);

      pagoRegistrado = true;

      // El backend es la fuente de verdad del saldo.
      const saldoEfectivoNuevo = numeroSeguro(
        resultado.saldo_efectivo_pendiente ??
          Math.max(
            redondear(
              resumen.totalEfectivo - (resumen.pagosAplicables + montoNumero),
            ),
            0,
          ),
      );

      await Swal.fire({
        icon: "success",
        title:
          concepto === "anticipo" ? "Anticipo registrado" : "Pago registrado",
        text:
          `Contrato: ${numeroContrato || contratoId}\n` +
          `Importe recibido: ${formatearDinero(montoNumero)}\n` +
          `Saldo efectivo pendiente: ${formatearDinero(saldoEfectivoNuevo)}`,
      });

      try {
        await onPagoRegistrado();
      } catch (errorActualizacion) {
        console.error(
          "Pago registrado, pero falló la actualización:",
          errorActualizacion,
        );

        await Swal.fire({
          icon: "warning",
          title: "Pago registrado",
          text:
            "El pago se guardó correctamente, pero no se pudo actualizar " +
            "la pantalla. Recarga la página para ver los nuevos valores.",
        });
      }

      onClose();
    } catch (error: unknown) {
      console.error("Error al registrar pago:", error);

      // Evitar informar que falló el registro
      // cuando el servidor ya confirmó la operación.
      if (!pagoRegistrado) {
        await Swal.fire({
          icon: "error",
          title: "Error al registrar el pago",
          text: obtenerMensajeError(error),
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  if (!open) return null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="registrar-pago-titulo"
        className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* CABECERA */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="registrar-pago-titulo"
              className="flex items-center gap-2 text-xl font-bold text-gray-800"
            >
              <DollarSign size={22} className="text-green-600" />
              Registrar pago
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Contrato: {numeroContrato || contratoId.slice(0, 8)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-5 p-5 sm:p-6">
            {cargando ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-600">
                <Loader2 size={20} className="animate-spin text-green-600" />
                Cargando información financiera...
              </div>
            ) : errorCarga ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2 text-red-700">
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />

                  <div>
                    <p className="font-semibold">
                      No se pudo cargar el saldo efectivo
                    </p>

                    <p className="mt-1 text-sm">{errorCarga}</p>

                    <p className="mt-2 text-xs">
                      No se habilitarán pagos mientras no se pueda verificar el
                      saldo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700"
                >
                  <RefreshCw size={16} />
                  Cerrar y volver a intentar
                </button>
              </div>
            ) : resumen ? (
              <>
                {/* RESUMEN */}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Valor previsto</p>

                    <p className="mt-1 text-lg font-semibold text-gray-800">
                      {formatearDinero(resumen.totalPrevisto)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                    <p className="text-xs text-green-700">Valor efectivo</p>

                    <p className="mt-1 text-lg font-semibold text-green-800">
                      {formatearDinero(resumen.totalEfectivo)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">
                      Pagos aplicados al alquiler
                    </p>

                    <p className="mt-1 text-lg font-semibold text-blue-800">
                      {formatearDinero(resumen.pagosAplicables)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-xs text-red-700">Pendiente efectivo</p>

                    <p className="mt-1 text-lg font-semibold text-red-700">
                      {formatearDinero(resumen.saldoEfectivoPendiente)}
                    </p>
                  </div>
                </div>

                {/* PENALIDADES */}

                {resumen.penalidadesPagadas > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm text-gray-700">
                      Penalidades pagadas por separado:{" "}
                      <strong>
                        {formatearDinero(resumen.penalidadesPagadas)}
                      </strong>
                    </p>
                  </div>
                )}

                {/* SALDO A FAVOR */}

                {resumen.saldoFavorCliente > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-900">
                      Saldo a favor del cliente:{" "}
                      <strong>
                        {formatearDinero(resumen.saldoFavorCliente)}
                      </strong>
                    </p>
                  </div>
                )}

                {/* FORMULARIO */}

                <form
                  id="registrar-pago-form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* CONCEPTO */}

                  <div>
                    <label
                      htmlFor="concepto-pago"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Concepto del pago
                    </label>

                    <select
                      id="concepto-pago"
                      value={concepto}
                      onChange={cambiarConcepto}
                      disabled={guardando}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    >
                      <option value="alquiler">
                        Pago de jornadas de alquiler
                      </option>

                      <option value="anticipo">Anticipo del contrato</option>
                    </select>

                    <p className="mt-1.5 text-xs text-gray-500">
                      {concepto === "alquiler"
                        ? "Se cobra únicamente lo generado por las jornadas registradas."
                        : "Se recibe dinero por adelantado para aplicarlo a las jornadas futuras."}
                    </p>
                  </div>

                  {/* SALDO SEGÚN CONCEPTO */}

                  <div
                    className={`rounded-xl border p-4 ${
                      concepto === "alquiler"
                        ? "border-red-200 bg-red-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <p className="text-sm text-gray-600">
                      {concepto === "alquiler"
                        ? "Saldo efectivo pendiente de cobro"
                        : "Máximo disponible para anticipo"}
                    </p>

                    <p
                      className={`mt-1 text-2xl font-bold ${
                        concepto === "alquiler"
                          ? "text-red-700"
                          : "text-amber-800"
                      }`}
                    >
                      {formatearDinero(saldoMaximo)}
                    </p>
                  </div>

                  {/* CUENTA FINANCIERA */}

                  <div>
                    <label
                      htmlFor="cuenta_id"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Cuenta financiera
                    </label>

                    <select
                      id="cuenta_id"
                      value={cuentaId}
                      onChange={(event) => setCuentaId(event.target.value)}
                      disabled={guardando}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    >
                      <option value="">Seleccione una cuenta</option>

                      {cuentas.map((cuenta) => (
                        <option key={cuenta.id} value={cuenta.id}>
                          {cuenta.nombre} — saldo{" "}
                          {formatearDinero(numeroSeguro(cuenta.saldo_actual))}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* MONTO */}

                  <div>
                    <label
                      htmlFor="monto-pago"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Monto (USD)
                    </label>

                    <input
                      id="monto-pago"
                      type="number"
                      min="0.01"
                      max={saldoMaximo}
                      step="0.01"
                      value={monto}
                      onChange={(event) => setMonto(event.target.value)}
                      disabled={
                        guardando || !contratoActivo || saldoMaximo <= 0
                      }
                      placeholder="0.00"
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                    />

                    <p className="mt-1.5 text-xs text-gray-500">
                      Monto máximo permitido: {formatearDinero(saldoMaximo)}
                    </p>
                  </div>

                  {/* MÉTODO DE PAGO */}

                  <div>
                    <label
                      htmlFor="metodo_pago"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Método de pago
                    </label>

                    <select
                      id="metodo_pago"
                      value={metodoPago}
                      onChange={(event) => setMetodoPago(event.target.value)}
                      disabled={guardando}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    >
                      <option value="efectivo">Efectivo</option>

                      <option value="transferencia">Transferencia</option>

                      <option value="tarjeta">Tarjeta</option>

                      <option value="deposito">Depósito</option>

                      <option value="cheque">Cheque</option>

                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {/* OBSERVACIONES */}

                  <div>
                    <label
                      htmlFor="observaciones-pago"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Observaciones
                    </label>

                    <textarea
                      id="observaciones-pago"
                      rows={3}
                      value={observaciones}
                      onChange={(event) => setObservaciones(event.target.value)}
                      disabled={guardando}
                      placeholder="Detalle adicional del pago"
                      className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  {/* INFORMACIÓN */}

                  <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-blue-700"
                    />

                    <p className="text-xs leading-5 text-blue-800">
                      El importe definitivo se valida nuevamente en el servidor.
                      Los pagos registrados se reflejan en la cuenta financiera
                      seleccionada.
                    </p>
                  </div>

                  {!contratoActivo && (
                    <p className="text-sm font-medium text-red-700">
                      Solo se permiten pagos en contratos activos.
                    </p>
                  )}
                </form>
              </>
            ) : null}
          </div>
        </div>

        {/* PIE FIJO */}

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="registrar-pago-form"
            disabled={!puedeRegistrar}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign size={17} />
                {concepto === "anticipo"
                  ? "Registrar anticipo"
                  : "Registrar pago"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrarPagoContratoModal;
