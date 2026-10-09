import { useState } from "react";
import type { FormEvent } from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Pencil,
  X,
} from "lucide-react";

import {
  actualizarJornada,
  obtenerTextoEstadoJornada,
} from "../../service/jornadasAlquiler";

import type {
  JornadaAlquiler,
  EstadoJornadaAlquiler,
} from "../../service/jornadasAlquiler";

/* =====================================================
   PROPS
===================================================== */

interface EditarJornadaModalProps {
  open: boolean;
  onClose: () => void;
  jornada: JornadaAlquiler;
  numeroContrato?: string;
  fechaInicio: string;
  fechaFin: string;
  onSuccess?: () => void | Promise<void>;
}

/* =====================================================
   UTILIDADES
===================================================== */

const normalizarFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return "";
  return String(fecha).slice(0, 10);
};

const formatearDinero = (valor: number | string | null | undefined): string => {
  const numero = Number(valor ?? 0);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

const obtenerMensajeError = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
        };
      };
      message?: string;
    };

    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      "No fue posible actualizar la jornada."
    );
  }

  return "No fue posible actualizar la jornada.";
};

/* =====================================================
   COMPONENTE
===================================================== */

const EditarJornadaModal = ({
  open,
  onClose,
  jornada,
  numeroContrato,
  fechaInicio,
  fechaFin,
  onSuccess,
}: EditarJornadaModalProps) => {
  const [fecha, setFecha] = useState(normalizarFecha(jornada.fecha));

  const [estado, setEstado] = useState<EstadoJornadaAlquiler>(jornada.estado);

  const [cantidadEfectiva, setCantidadEfectiva] = useState<number>(
    Number(jornada.cantidad_efectiva ?? 0),
  );

  const [cobrable, setCobrable] = useState<boolean>(Boolean(jornada.cobrable));

  const [motivo, setMotivo] = useState(jornada.motivo ?? "");

  const [observaciones, setObservaciones] = useState(
    jornada.observaciones ?? "",
  );

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cantidadContratada = Number(jornada.cantidad_contratada ?? 0);

  const precioDiario = Number(jornada.precio_diario ?? 0);

  const esTrabajado = estado === "trabajado";

  const totalEstimado =
    esTrabajado && cobrable
      ? Math.round(cantidadEfectiva * precioDiario * 100) / 100
      : 0;

  /* =================================================
     CAMBIAR ESTADO
  ================================================= */

  const cambiarEstado = (nuevoEstado: EstadoJornadaAlquiler) => {
    setEstado(nuevoEstado);
    setError(null);

    if (nuevoEstado === "trabajado") {
      setCantidadEfectiva((actual) => (actual > 0 ? actual : 1));
      setCobrable(true);
    } else {
      setCantidadEfectiva(0);
      setCobrable(false);
    }
  };

  /* =================================================
     GUARDAR
  ================================================= */

  const handleGuardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (guardando) return;

    setError(null);

    const fechaNormalizada = normalizarFecha(fecha);
    const inicio = normalizarFecha(fechaInicio);
    const fin = normalizarFecha(fechaFin);

    if (!fechaNormalizada) {
      setError("Debes seleccionar una fecha.");
      return;
    }

    if (fechaNormalizada < inicio || fechaNormalizada > fin) {
      setError(`La fecha debe estar entre ${inicio} y ${fin}.`);
      return;
    }

    if (!Number.isInteger(cantidadEfectiva) || cantidadEfectiva < 0) {
      setError("La cantidad efectiva debe ser un número entero válido.");
      return;
    }

    if (
      esTrabajado &&
      (cantidadEfectiva < 1 || cantidadEfectiva > cantidadContratada)
    ) {
      setError(
        `La cantidad trabajada debe estar entre 1 y ${cantidadContratada}.`,
      );
      return;
    }

    if (!esTrabajado && cantidadEfectiva !== 0) {
      setError("Las jornadas no trabajadas deben tener cantidad cero.");
      return;
    }

    if (motivo.trim().length > 150) {
      setError("El motivo no puede superar los 150 caracteres.");
      return;
    }

    try {
      setGuardando(true);

      await actualizarJornada(jornada.id, {
        fecha: fechaNormalizada,
        estado,
        cantidad_efectiva: esTrabajado ? cantidadEfectiva : 0,
        cobrable: esTrabajado ? cobrable : false,
        motivo: motivo.trim(),
        observaciones: observaciones.trim(),
      });

      await onSuccess?.();

      onClose();
    } catch (errorGuardar: unknown) {
      console.error("Error al actualizar jornada:", errorGuardar);

      setError(obtenerMensajeError(errorGuardar));
    } finally {
      setGuardando(false);
    }
  };

  if (!open) return null;

  /* =================================================
     RENDER
  ================================================= */

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-jornada-titulo"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* CABECERA FIJA */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Pencil size={19} className="text-orange-600" />

              <h2
                id="editar-jornada-titulo"
                className="text-lg font-semibold text-slate-900"
              >
                Editar jornada de alquiler
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {numeroContrato
                ? `Contrato ${numeroContrato}`
                : "Modificar jornada registrada"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          id="form-editar-jornada"
          onSubmit={handleGuardar}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="space-y-5 px-5 py-5 sm:px-6">
            {/* ACTIVO */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Activo del contrato
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {jornada.activo_nombre || "Activo"}
              </p>

              {jornada.activo_codigo && (
                <p className="mt-1 text-xs text-slate-500">
                  Código: {jornada.activo_codigo}
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Cantidad contratada</p>

                  <p className="text-sm font-semibold text-slate-800">
                    {cantidadContratada}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Tarifa diaria</p>

                  <p className="text-sm font-semibold text-slate-800">
                    {formatearDinero(precioDiario)}
                  </p>
                </div>
              </div>
            </div>

            {/* FECHA Y ESTADO */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="editar-jornada-fecha"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Fecha de la jornada
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3 top-3 text-slate-400"
                  />

                  <input
                    id="editar-jornada-fecha"
                    type="date"
                    required
                    min={normalizarFecha(fechaInicio)}
                    max={normalizarFecha(fechaFin)}
                    value={fecha}
                    onChange={(event) => setFecha(event.target.value)}
                    disabled={guardando}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="editar-jornada-estado"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Estado
                </label>

                <select
                  id="editar-jornada-estado"
                  value={estado}
                  onChange={(event) =>
                    cambiarEstado(event.target.value as EstadoJornadaAlquiler)
                  }
                  disabled={guardando}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                >
                  <option value="trabajado">Trabajado</option>

                  <option value="no_laborable">No laborable</option>

                  <option value="suspendido">Suspendido</option>

                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* CANTIDAD */}

            <div>
              <label
                htmlFor="editar-jornada-cantidad"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Cantidad efectiva utilizada
              </label>

              <input
                id="editar-jornada-cantidad"
                type="number"
                min={esTrabajado ? 1 : 0}
                max={esTrabajado ? cantidadContratada : 0}
                step={1}
                required
                value={cantidadEfectiva}
                onChange={(event) =>
                  setCantidadEfectiva(Number(event.target.value))
                }
                disabled={!esTrabajado || guardando}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Máximo permitido: {cantidadContratada}. Las jornadas no
                trabajadas utilizan cantidad cero.
              </p>
            </div>

            {/* COBRABLE */}

            {esTrabajado && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={cobrable}
                  onChange={(event) => setCobrable(event.target.checked)}
                  disabled={guardando}
                  className="mt-0.5 h-4 w-4 accent-orange-600"
                />

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Jornada cobrable
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Si se desmarca, la jornada queda registrada como trabajada,
                    pero no genera importe de alquiler.
                  </p>
                </div>
              </label>
            )}

            {/* MOTIVO */}

            <div>
              <label
                htmlFor="editar-jornada-motivo"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Motivo
              </label>

              <input
                id="editar-jornada-motivo"
                type="text"
                maxLength={150}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                disabled={guardando}
                placeholder="Ej. Corrección de cantidad utilizada"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
              />
            </div>

            {/* OBSERVACIONES */}

            <div>
              <label
                htmlFor="editar-jornada-observaciones"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Observaciones
              </label>

              <textarea
                id="editar-jornada-observaciones"
                rows={3}
                value={observaciones}
                onChange={(event) => setObservaciones(event.target.value)}
                disabled={guardando}
                placeholder="Información adicional sobre la jornada"
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
              />
            </div>

            {/* TOTAL ESTIMADO */}

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Valor efectivo estimado
                  </p>

                  <p className="mt-1 text-xs text-green-700">
                    {obtenerTextoEstadoJornada(estado)}
                    {" · "}
                    {cantidadEfectiva} × {formatearDinero(precioDiario)}
                  </p>
                </div>

                <p className="text-xl font-bold text-green-800">
                  {formatearDinero(totalEstimado)}
                </p>
              </div>

              <p className="mt-2 text-xs text-green-700">
                El cálculo definitivo lo realizará el backend al guardar.
              </p>
            </div>

            {/* ADVERTENCIA FINANCIERA */}

            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <p className="text-xs leading-5 text-amber-900">
                Modificar una jornada puede cambiar el saldo efectivo del
                contrato. Los pagos ya registrados no se modifican desde este
                formulario.
              </p>
            </div>

            {/* ERRORES */}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />

                <span>{error}</span>
              </div>
            )}
          </div>
        </form>

        {/* PIE FIJO */}

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="form-editar-jornada"
            disabled={guardando}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarJornadaModal;
