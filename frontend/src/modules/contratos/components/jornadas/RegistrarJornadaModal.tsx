import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Loader2,
  Package,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import { registrarJornada } from "../../service/jornadasAlquiler";

import type {
  EstadoJornadaAlquiler,
  RegistrarJornadaPayload,
} from "../../service/jornadasAlquiler";

/* =====================================================
   TIPOS
===================================================== */

export interface ActivoContratoJornada {
  detalle_id: string;

  activo_id?: string;

  codigo?: string | null;

  nombre?: string;

  activo_codigo?: string | null;

  activo_nombre?: string;

  cantidad: number;

  precio_dia?: number;

  precio_diario?: number;

  subtotal?: number;
}

interface RegistrarJornadaModalProps {
  open: boolean;

  onClose: () => void;

  contratoId: string;

  numeroContrato?: string;

  fechaInicio: string;

  fechaFin: string;

  activos: ActivoContratoJornada[];

  onSuccess?: () => void | Promise<void>;
}

/* =====================================================
   UTILIDADES
===================================================== */

const obtenerFechaTexto = (valor: string | undefined | null) => {
  if (!valor) {
    return "";
  }

  return String(valor).slice(0, 10);
};

const obtenerNombreActivo = (activo: ActivoContratoJornada) => {
  return activo.nombre || activo.activo_nombre || "Activo sin nombre";
};

const obtenerCodigoActivo = (activo: ActivoContratoJornada) => {
  return activo.codigo || activo.activo_codigo || "";
};

const obtenerPrecioDiario = (activo: ActivoContratoJornada | undefined) => {
  if (!activo) {
    return 0;
  }

  return Number(activo.precio_dia ?? activo.precio_diario ?? 0);
};

const formatearDinero = (valor: number) => {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(valor || 0);
};

/* =====================================================
   COMPONENTE
===================================================== */

const RegistrarJornadaModal = ({
  open,
  onClose,
  contratoId,
  numeroContrato,
  fechaInicio,
  fechaFin,
  activos,
  onSuccess,
}: RegistrarJornadaModalProps) => {
  /* =================================================
       ESTADO
    ================================================= */

  const [detalleContratoId, setDetalleContratoId] = useState("");

  const [fecha, setFecha] = useState("");

  const [estado, setEstado] = useState<EstadoJornadaAlquiler>("trabajado");

  const [cantidadEfectiva, setCantidadEfectiva] = useState(1);

  const [motivo, setMotivo] = useState("");

  const [observaciones, setObservaciones] = useState("");

  const [guardando, setGuardando] = useState(false);

  /* =================================================
       DATOS DERIVADOS
    ================================================= */

  const fechaInicioNormalizada = useMemo(
    () => obtenerFechaTexto(fechaInicio),
    [fechaInicio],
  );

  const fechaFinNormalizada = useMemo(
    () => obtenerFechaTexto(fechaFin),
    [fechaFin],
  );

  const activoSeleccionado = useMemo(
    () => activos.find((activo) => activo.detalle_id === detalleContratoId),
    [activos, detalleContratoId],
  );

  const cantidadContratada = Number(activoSeleccionado?.cantidad ?? 0);

  const precioDiario = obtenerPrecioDiario(activoSeleccionado);

  const totalEstimado =
    estado === "trabajado" ? cantidadEfectiva * precioDiario : 0;

  const requiereCantidad = estado === "trabajado";

  /* =================================================
       REINICIAR FORMULARIO
    ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const hoy = new Date();

    const anio = hoy.getFullYear();

    const mes = String(hoy.getMonth() + 1).padStart(2, "0");

    const dia = String(hoy.getDate()).padStart(2, "0");

    const hoyTexto = `${anio}-${mes}-${dia}`;

    let fechaInicial = hoyTexto;

    if (fechaInicioNormalizada && fechaInicial < fechaInicioNormalizada) {
      fechaInicial = fechaInicioNormalizada;
    }

    if (fechaFinNormalizada && fechaInicial > fechaFinNormalizada) {
      fechaInicial = fechaFinNormalizada;
    }

    setFecha(fechaInicial);

    setEstado("trabajado");

    setMotivo("");

    setObservaciones("");

    if (activos.length === 1) {
      setDetalleContratoId(activos[0].detalle_id);

      setCantidadEfectiva(Math.min(1, Number(activos[0].cantidad || 1)));
    } else {
      setDetalleContratoId("");
      setCantidadEfectiva(1);
    }
  }, [open, activos, fechaInicioNormalizada, fechaFinNormalizada]);

  /* =================================================
       CAMBIO DE ACTIVO
    ================================================= */

  const handleActivoChange = (detalleId: string) => {
    setDetalleContratoId(detalleId);

    const activo = activos.find((item) => item.detalle_id === detalleId);

    if (!activo) {
      setCantidadEfectiva(1);
      return;
    }

    if (estado === "trabajado") {
      setCantidadEfectiva(Math.min(1, Number(activo.cantidad || 1)));
    }
  };

  /* =================================================
       CAMBIO DE ESTADO
    ================================================= */

  const handleEstadoChange = (nuevoEstado: EstadoJornadaAlquiler) => {
    setEstado(nuevoEstado);

    if (nuevoEstado === "trabajado") {
      setCantidadEfectiva(
        activoSeleccionado
          ? Math.min(1, Number(activoSeleccionado.cantidad || 1))
          : 1,
      );

      return;
    }

    /*
     * Jornadas no trabajadas:
     * cantidad efectiva = 0.
     *
     * El backend también valida
     * esta regla.
     */
    setCantidadEfectiva(0);
  };

  /* =================================================
       VALIDAR
    ================================================= */

  const validarFormulario = () => {
    if (!contratoId) {
      return "No se pudo identificar el contrato";
    }

    if (!detalleContratoId) {
      return "Seleccione el activo del contrato";
    }

    if (!fecha) {
      return "Seleccione la fecha de la jornada";
    }

    if (fechaInicioNormalizada && fecha < fechaInicioNormalizada) {
      return `La fecha no puede ser anterior al ${fechaInicioNormalizada}`;
    }

    if (fechaFinNormalizada && fecha > fechaFinNormalizada) {
      return `La fecha no puede ser posterior al ${fechaFinNormalizada}`;
    }

    if (estado === "trabajado") {
      if (!Number.isInteger(cantidadEfectiva) || cantidadEfectiva <= 0) {
        return "La cantidad efectiva debe ser mayor que cero";
      }

      if (cantidadEfectiva > cantidadContratada) {
        return `La cantidad efectiva no puede superar la cantidad contratada (${cantidadContratada})`;
      }
    }

    return null;
  };

  /* =================================================
       GUARDAR
    ================================================= */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (guardando) {
      return;
    }

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      await Swal.fire({
        icon: "warning",
        title: "Revisa la información",
        text: errorValidacion,
        confirmButtonText: "Aceptar",
      });

      return;
    }

    const payload: RegistrarJornadaPayload = {
      detalle_contrato_id: detalleContratoId,

      fecha,

      estado,

      cantidad_efectiva: estado === "trabajado" ? cantidadEfectiva : 0,

      motivo: motivo.trim() || null,

      observaciones: observaciones.trim() || null,
    };

    try {
      setGuardando(true);

      await registrarJornada(payload);

      await Swal.fire({
        icon: "success",
        title: "Jornada registrada",
        text: "La jornada de alquiler fue registrada correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error: unknown) {
      console.error("Error al registrar jornada:", error);

      let mensaje = "No fue posible registrar la jornada.";

      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              errors?: string[];
            };
          };
        };

        const mensajeApi = axiosError.response?.data?.message;

        const erroresApi = axiosError.response?.data?.errors;

        if (Array.isArray(erroresApi) && erroresApi.length > 0) {
          mensaje = erroresApi.join("\n");
        } else if (mensajeApi) {
          mensaje = mensajeApi;
        }
      }

      await Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        text: mensaje,
        confirmButtonText: "Aceptar",
      });
    } finally {
      setGuardando(false);
    }
  };

  /* =================================================
       NO RENDERIZAR
    ================================================= */

  if (!open) {
    return null;
  }

  /* =================================================
       RENDER
    ================================================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* =====================================
                    HEADER
                ====================================== */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <ClipboardList size={21} />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  Registrar jornada
                </h2>

                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {numeroContrato
                    ? `Contrato ${numeroContrato}`
                    : "Control real del alquiler"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* =====================================
                    CONTENIDO CON SCROLL VERTICAL
                ====================================== */}

        <form
          id="registrar-jornada-form"
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-6 p-5 sm:p-6">
            {/* =============================
                            PERÍODO DEL CONTRATO
                        ============================== */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={20}
                  className="mt-0.5 shrink-0 text-slate-500"
                />

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Período previsto del contrato
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {fechaInicioNormalizada || "—"}
                    {" — "}
                    {fechaFinNormalizada || "—"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    La jornada debe pertenecer al período contratado.
                  </p>
                </div>
              </div>
            </div>

            {/* =============================
                            ACTIVO
                        ============================== */}

            <div>
              <label
                htmlFor="jornada-activo"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Activo del contrato
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="jornada-activo"
                value={detalleContratoId}
                onChange={(event) => handleActivoChange(event.target.value)}
                disabled={guardando}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Seleccione un activo</option>

                {activos.map((activo) => {
                  const codigo = obtenerCodigoActivo(activo);

                  const nombre = obtenerNombreActivo(activo);

                  return (
                    <option key={activo.detalle_id} value={activo.detalle_id}>
                      {codigo ? `${codigo} - ` : ""}
                      {nombre} | Cant. {activo.cantidad}
                    </option>
                  );
                })}
              </select>

              {activos.length === 0 && (
                <p className="mt-2 text-sm text-red-600">
                  Este contrato no tiene activos disponibles para registrar
                  jornadas.
                </p>
              )}
            </div>

            {/* =============================
                            INFORMACIÓN DEL ACTIVO
                        ============================== */}

            {activoSeleccionado && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <Package size={15} />
                    Cantidad
                  </div>

                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {cantidadContratada}
                  </p>

                  <p className="text-xs text-slate-500">contratada</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <DollarSign size={15} />
                    Tarifa
                  </div>

                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatearDinero(precioDiario)}
                  </p>

                  <p className="text-xs text-slate-500">por unidad / día</p>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-orange-700">
                    <CheckCircle2 size={15} />
                    Jornada
                  </div>

                  <p className="mt-2 text-lg font-semibold text-orange-700">
                    {formatearDinero(totalEstimado)}
                  </p>

                  <p className="text-xs text-orange-600">valor estimado</p>
                </div>
              </div>
            )}

            {/* =============================
                            FECHA + ESTADO
                        ============================== */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="jornada-fecha"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Fecha de la jornada
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="jornada-fecha"
                  type="date"
                  value={fecha}
                  min={fechaInicioNormalizada}
                  max={fechaFinNormalizada}
                  onChange={(event) => setFecha(event.target.value)}
                  disabled={guardando}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="jornada-estado"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Estado
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  id="jornada-estado"
                  value={estado}
                  onChange={(event) =>
                    handleEstadoChange(
                      event.target.value as EstadoJornadaAlquiler,
                    )
                  }
                  disabled={guardando}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="trabajado">Trabajado</option>

                  <option value="no_laborable">No laborable</option>

                  <option value="suspendido">Suspendido</option>

                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* =============================
                            CANTIDAD EFECTIVA
                        ============================== */}

            <div>
              <label
                htmlFor="jornada-cantidad"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Cantidad efectiva
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="jornada-cantidad"
                type="number"
                min={requiereCantidad ? 1 : 0}
                max={cantidadContratada > 0 ? cantidadContratada : undefined}
                step="1"
                value={cantidadEfectiva}
                onChange={(event) => {
                  const valor = Number(event.target.value);

                  setCantidadEfectiva(Number.isFinite(valor) ? valor : 0);
                }}
                disabled={guardando || !activoSeleccionado || !requiereCantidad}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                {estado === "trabajado"
                  ? `Indique cuántas unidades realmente trabajaron este día. Máximo: ${cantidadContratada}.`
                  : "Para una jornada no trabajada la cantidad efectiva será 0."}
              </p>
            </div>

            {/* =============================
                            MOTIVO
                        ============================== */}

            <div>
              <label
                htmlFor="jornada-motivo"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Motivo
              </label>

              <input
                id="jornada-motivo"
                type="text"
                maxLength={150}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                disabled={guardando}
                placeholder={
                  estado === "trabajado"
                    ? "Opcional"
                    : "Ej. lluvia, suspensión de obra, descanso..."
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {motivo.length}
                /150
              </div>
            </div>

            {/* =============================
                            OBSERVACIONES
                        ============================== */}

            <div>
              <label
                htmlFor="jornada-observaciones"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Observaciones
              </label>

              <textarea
                id="jornada-observaciones"
                rows={4}
                maxLength={1000}
                value={observaciones}
                onChange={(event) => setObservaciones(event.target.value)}
                disabled={guardando}
                placeholder="Información adicional sobre la jornada..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {observaciones.length}
                /1000
              </div>
            </div>

            {/* =============================
                            ACLARACIÓN
                        ============================== */}

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                Control de cobro real
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                Solo las jornadas efectivamente trabajadas generan valor de
                alquiler. El valor definitivo es calculado y validado por el
                servidor según la tarifa registrada en el contrato.
              </p>
            </div>
          </div>
        </form>

        {/* =====================================
                    FOOTER FIJO
                ====================================== */}

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="registrar-jornada-form"
            disabled={guardando || activos.length === 0}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Registrar jornada
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrarJornadaModal;
