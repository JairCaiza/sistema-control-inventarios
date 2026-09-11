import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  ArrowLeftRight,
  CalendarDays,
  CircleDollarSign,
  Landmark,
  Loader2,
  WalletCards,
  X,
} from "lucide-react";

import {
  registrarTransferencia,
  type RegistrarTransferenciaDTO,
  type RegistrarTransferenciaResponse,
} from "../service/transferenciaService";

/*
 * Ajusta esta ruta según la ubicación real de tu servicio
 * de cuentas financieras.
 */
import {
  getCuentas,
  type CuentaFinanciera,
} from "../../cuentas/service/cuentaService";

interface RegistrarTransferenciaModalProps {
  open: boolean;
  cuentas: CuentaFinanciera[];
  onClose: () => void;
  onRegistered: (
    resultado: RegistrarTransferenciaResponse["data"],
  ) => void | Promise<void>;
}

interface FormularioTransferencia {
  cuenta_id: string;
  cuenta_destino_id: string;
  monto: string;
  descripcion: string;
  fecha: string;
}

const obtenerFechaActual = (): string => {
  const fecha = new Date();
  const compensacion = fecha.getTimezoneOffset() * 60_000;

  return new Date(fecha.getTime() - compensacion).toISOString().slice(0, 10);
};

function RegistrarTransferenciaModal({
  open,
  cuentas,
  onClose,
  onRegistered,
}: RegistrarTransferenciaModalProps) {
  const [formulario, setFormulario] = useState<FormularioTransferencia>({
    cuenta_id: "",
    cuenta_destino_id: "",
    monto: "",
    descripcion: "",
    fecha: obtenerFechaActual(),
  });

  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<
    Partial<Record<keyof FormularioTransferencia, string>>
  >({});

  const cuentasActivas = useMemo(
    () => cuentas.filter((cuenta) => cuenta.activo),
    [cuentas],
  );

  const cuentaOrigen = useMemo(
    () => cuentasActivas.find((cuenta) => cuenta.id === formulario.cuenta_id),
    [cuentasActivas, formulario.cuenta_id],
  );

  const cuentaDestino = useMemo(
    () =>
      cuentasActivas.find(
        (cuenta) => cuenta.id === formulario.cuenta_destino_id,
      ),
    [cuentasActivas, formulario.cuenta_destino_id],
  );

  const montoNumerico = Number(formulario.monto || 0);
  const saldoOrigen = Number(cuentaOrigen?.saldo_actual || 0);

  const saldoOrigenProyectado =
    cuentaOrigen && montoNumerico > 0
      ? saldoOrigen - montoNumerico
      : saldoOrigen;

  const saldoDestino = Number(cuentaDestino?.saldo_actual || 0);

  const saldoDestinoProyectado =
    cuentaDestino && montoNumerico > 0
      ? saldoDestino + montoNumerico
      : saldoDestino;

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormulario({
      cuenta_id: "",
      cuenta_destino_id: "",
      monto: "",
      descripcion: "",
      fecha: obtenerFechaActual(),
    });

    setErrores({});
    setGuardando(false);
  }, [open]);

  useEffect(() => {
    if (
      formulario.cuenta_id &&
      formulario.cuenta_destino_id === formulario.cuenta_id
    ) {
      setFormulario((previo) => ({
        ...previo,
        cuenta_destino_id: "",
      }));
    }
  }, [formulario.cuenta_id, formulario.cuenta_destino_id]);

  if (!open) {
    return null;
  }

  const formatearMoneda = (valor: number | string): string =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));

  const actualizarCampo = (
    campo: keyof FormularioTransferencia,
    valor: string,
  ) => {
    setFormulario((previo) => ({
      ...previo,
      [campo]: valor,
    }));

    if (errores[campo]) {
      setErrores((previo) => ({
        ...previo,
        [campo]: undefined,
      }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Partial<
      Record<keyof FormularioTransferencia, string>
    > = {};

    if (!formulario.cuenta_id) {
      nuevosErrores.cuenta_id = "Selecciona la cuenta de origen";
    }

    if (!formulario.cuenta_destino_id) {
      nuevosErrores.cuenta_destino_id = "Selecciona la cuenta de destino";
    }

    if (
      formulario.cuenta_id &&
      formulario.cuenta_destino_id &&
      formulario.cuenta_id === formulario.cuenta_destino_id
    ) {
      nuevosErrores.cuenta_destino_id =
        "La cuenta de destino debe ser diferente";
    }

    if (!formulario.monto.trim()) {
      nuevosErrores.monto = "El monto es obligatorio";
    } else if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
      nuevosErrores.monto = "El monto debe ser mayor que cero";
    } else if (cuentaOrigen && montoNumerico > saldoOrigen) {
      nuevosErrores.monto = "La cuenta de origen no tiene saldo suficiente";
    }

    if (!formulario.descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es obligatoria";
    } else if (formulario.descripcion.trim().length > 300) {
      nuevosErrores.descripcion =
        "La descripción no puede superar los 300 caracteres";
    }

    if (!formulario.fecha) {
      nuevosErrores.fecha = "La fecha es obligatoria";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  const obtenerMensajeError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const respuesta = error.response?.data as
        | {
            message?: string;
            errors?: string[];
          }
        | undefined;

      if (respuesta?.errors?.length) {
        return respuesta.errors.join("<br>");
      }

      if (respuesta?.message) {
        return respuesta.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "No se pudo registrar la transferencia";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    const payload: RegistrarTransferenciaDTO = {
      cuenta_id: formulario.cuenta_id,
      cuenta_destino_id: formulario.cuenta_destino_id,
      monto: montoNumerico,
      descripcion: formulario.descripcion.trim(),
      fecha: formulario.fecha,
      origen_modulo: "transferencia_manual",
    };

    try {
      setGuardando(true);

      const respuesta = await registrarTransferencia(payload);

      await onRegistered(respuesta.data);

      await Swal.fire({
        icon: "success",
        title: "Transferencia registrada",
        html: `
          <div style="text-align:left">
            <p><strong>Origen:</strong> ${
              respuesta.data.cuenta_origen.nombre
            }</p>
            <p><strong>Destino:</strong> ${
              respuesta.data.cuenta_destino.nombre
            }</p>
            <p><strong>Monto:</strong> ${formatearMoneda(montoNumerico)}</p>
          </div>
        `,
        confirmButtonText: "Aceptar",
      });

      onClose();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        html: obtenerMensajeError(error),
        confirmButtonText: "Aceptar",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b bg-[var(--color-primary)] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-3">
              <ArrowLeftRight size={25} />
            </div>

            <div>
              <h2 className="text-xl font-bold">Nueva transferencia</h2>

              <p className="mt-1 text-sm text-white/80">
                Movimiento de fondos entre cuentas financieras
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-lg p-2 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {cuentasActivas.length < 2 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Deben existir al menos dos cuentas financieras activas para
                registrar una transferencia.
              </div>
            )}

            {/* CUENTAS */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Cuenta de origen
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <Landmark
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    value={formulario.cuenta_id}
                    onChange={(event) =>
                      actualizarCampo("cuenta_id", event.target.value)
                    }
                    disabled={guardando}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none transition focus:ring-2 ${
                      errores.cuenta_id
                        ? "border-red-400 focus:ring-red-100"
                        : "border-gray-300 focus:border-[var(--color-primary)] focus:ring-blue-100"
                    }`}
                  >
                    <option value="">Selecciona una cuenta</option>

                    {cuentasActivas.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.nombre} — {formatearMoneda(cuenta.saldo_actual)}
                      </option>
                    ))}
                  </select>
                </div>

                {errores.cuenta_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {errores.cuenta_id}
                  </p>
                )}

                {cuentaOrigen && (
                  <div className="mt-3 rounded-lg border bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Saldo disponible</p>

                    <p className="mt-1 text-lg font-bold text-gray-800">
                      {formatearMoneda(cuentaOrigen.saldo_actual)}
                    </p>

                    <p className="text-xs capitalize text-gray-500">
                      {cuentaOrigen.tipo}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Cuenta de destino
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <WalletCards
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    value={formulario.cuenta_destino_id}
                    onChange={(event) =>
                      actualizarCampo("cuenta_destino_id", event.target.value)
                    }
                    disabled={guardando || !formulario.cuenta_id}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none transition focus:ring-2 disabled:bg-gray-100 ${
                      errores.cuenta_destino_id
                        ? "border-red-400 focus:ring-red-100"
                        : "border-gray-300 focus:border-[var(--color-primary)] focus:ring-blue-100"
                    }`}
                  >
                    <option value="">Selecciona una cuenta</option>

                    {cuentasActivas
                      .filter((cuenta) => cuenta.id !== formulario.cuenta_id)
                      .map((cuenta) => (
                        <option key={cuenta.id} value={cuenta.id}>
                          {cuenta.nombre} —{" "}
                          {formatearMoneda(cuenta.saldo_actual)}
                        </option>
                      ))}
                  </select>
                </div>

                {errores.cuenta_destino_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {errores.cuenta_destino_id}
                  </p>
                )}

                {cuentaDestino && (
                  <div className="mt-3 rounded-lg border bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Saldo actual</p>

                    <p className="mt-1 text-lg font-bold text-gray-800">
                      {formatearMoneda(cuentaDestino.saldo_actual)}
                    </p>

                    <p className="text-xs capitalize text-gray-500">
                      {cuentaDestino.tipo}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* MONTO Y FECHA */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Monto
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <CircleDollarSign
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formulario.monto}
                    onChange={(event) =>
                      actualizarCampo("monto", event.target.value)
                    }
                    disabled={guardando}
                    placeholder="0.00"
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none transition focus:ring-2 ${
                      errores.monto
                        ? "border-red-400 focus:ring-red-100"
                        : "border-gray-300 focus:border-[var(--color-primary)] focus:ring-blue-100"
                    }`}
                  />
                </div>

                {errores.monto && (
                  <p className="mt-1 text-xs text-red-600">{errores.monto}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Fecha
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    value={formulario.fecha}
                    onChange={(event) =>
                      actualizarCampo("fecha", event.target.value)
                    }
                    disabled={guardando}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none transition focus:ring-2 ${
                      errores.fecha
                        ? "border-red-400 focus:ring-red-100"
                        : "border-gray-300 focus:border-[var(--color-primary)] focus:ring-blue-100"
                    }`}
                  />
                </div>

                {errores.fecha && (
                  <p className="mt-1 text-xs text-red-600">{errores.fecha}</p>
                )}
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Descripción
                <span className="ml-1 text-red-500">*</span>
              </label>

              <textarea
                rows={4}
                maxLength={300}
                value={formulario.descripcion}
                onChange={(event) =>
                  actualizarCampo("descripcion", event.target.value)
                }
                disabled={guardando}
                placeholder="Ejemplo: Transferencia de Caja General a Banco Pichincha"
                className={`w-full resize-none rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
                  errores.descripcion
                    ? "border-red-400 focus:ring-red-100"
                    : "border-gray-300 focus:border-[var(--color-primary)] focus:ring-blue-100"
                }`}
              />

              <div className="mt-1 flex justify-between gap-3">
                <p className="text-xs text-red-600">
                  {errores.descripcion ?? ""}
                </p>

                <p className="text-xs text-gray-400">
                  {formulario.descripcion.length}/300
                </p>
              </div>
            </div>

            {/* RESUMEN */}
            {cuentaOrigen && cuentaDestino && montoNumerico > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ArrowLeftRight size={20} className="text-blue-600" />

                  <h3 className="font-semibold text-blue-900">
                    Resumen de la transferencia
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-blue-700">
                      Saldo origen después
                    </p>

                    <p
                      className={`mt-1 font-bold ${
                        saldoOrigenProyectado < 0
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {formatearMoneda(saldoOrigenProyectado)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-blue-700">Monto transferido</p>

                    <p className="mt-1 font-bold text-blue-700">
                      {formatearMoneda(montoNumerico)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-blue-700">
                      Saldo destino después
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {formatearMoneda(saldoDestinoProyectado)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando || cuentasActivas.length < 2}
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <ArrowLeftRight size={18} />
                  Registrar transferencia
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarTransferenciaModal;
