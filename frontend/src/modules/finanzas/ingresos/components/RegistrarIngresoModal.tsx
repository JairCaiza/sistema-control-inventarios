import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  registrarIngreso,
  type RegistrarIngresoDTO,
} from "../services/transaccionService";

import type { CuentaFinanciera } from "../../cuentas/service/cuentaService";

interface Props {
  open: boolean;
  cuenta?: CuentaFinanciera | null;
  cuentas?: CuentaFinanciera[];
  onClose: () => void;
  onRegistered: () => void | Promise<void>;
}

interface FormState {
  cuenta_id: string;
  monto: string;
  descripcion: string;
  fecha: string;
}

const obtenerFechaActual = (): string => {
  const hoy = new Date();

  const fechaLocal = new Date(
    hoy.getTime() - hoy.getTimezoneOffset() * 60 * 1000,
  );

  return fechaLocal.toISOString().split("T")[0];
};

const formatMoney = (value: number | string | null | undefined): string => {
  return Number(value || 0).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
};

function RegistrarIngresoModal({
  open,
  cuenta,
  cuentas = [],
  onClose,
  onRegistered,
}: Props) {
  const [form, setForm] = useState<FormState>({
    cuenta_id: "",
    monto: "",
    descripcion: "",
    fecha: obtenerFechaActual(),
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm({
      cuenta_id: cuenta?.id ?? "",
      monto: "",
      descripcion: "",
      fecha: obtenerFechaActual(),
    });
  }, [open, cuenta]);

  if (!open) return null;

  const cuentaSeleccionada =
    cuenta ?? cuentas.find((item) => item.id === form.cuenta_id) ?? null;

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    if (loading) return;

    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cuentaSeleccionada) {
      await Swal.fire({
        icon: "warning",
        title: "Cuenta obligatoria",
        text: "Seleccione la cuenta financiera que recibirá el ingreso.",
      });

      return;
    }

    if (!cuentaSeleccionada.activo) {
      await Swal.fire({
        icon: "warning",
        title: "Cuenta inactiva",
        text: "No se pueden registrar ingresos en una cuenta inactiva.",
      });

      return;
    }

    const monto = Number(form.monto);

    if (Number.isNaN(monto) || monto <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Monto no válido",
        text: "Ingrese un monto mayor que cero.",
      });

      return;
    }

    if (!form.fecha) {
      await Swal.fire({
        icon: "warning",
        title: "Fecha obligatoria",
        text: "Seleccione la fecha del ingreso.",
      });

      return;
    }

    if (!form.descripcion.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Descripción obligatoria",
        text: "Ingrese el concepto o descripción del ingreso.",
      });

      return;
    }

    const payload: RegistrarIngresoDTO = {
      cuenta_id: cuentaSeleccionada.id,
      monto,
      descripcion: form.descripcion.trim(),
      fecha: form.fecha,
      referencia_id: null,
      obra_id: null,
      control_diario_id: null,
      origen_modulo: "manual",
      origen_id: null,
    };

    try {
      setLoading(true);

      await registrarIngreso(payload);

      await Swal.fire({
        icon: "success",
        title: "Ingreso registrado",
        text: `Se registró ${formatMoney(
          monto,
        )} en la cuenta ${cuentaSeleccionada.nombre}.`,
        timer: 1800,
        showConfirmButton: false,
      });

      await onRegistered();

      onClose();
    } catch (error: unknown) {
      let mensaje = "No se pudo registrar el ingreso.";

      if (axios.isAxiosError(error)) {
        mensaje =
          error.response?.data?.message ??
          error.response?.data?.error ??
          error.response?.data?.errors?.[0] ??
          mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "Error al registrar",
        text: mensaje,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-3
        sm:p-4
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-[560px]
          flex-col
          overflow-hidden
          rounded-xl
          bg-white
          shadow-2xl
        "
      >
        {/* HEADER */}
        <div className="shrink-0 border-b px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Registrar ingreso
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Registra una entrada de dinero en una cuenta financiera.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="
                rounded-lg
                px-3
                py-1
                text-xl
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-gray-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Cerrar modal"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* CONTENIDO */}
          <div
            className="
              min-h-0
              flex-1
              space-y-5
              overflow-y-auto
              px-5
              py-5
              sm:px-6
            "
          >
            {/* CUENTA */}
            {!cuenta && (
              <div>
                <label
                  htmlFor="cuenta_id"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Cuenta financiera
                </label>

                <select
                  id="cuenta_id"
                  name="cuenta_id"
                  value={form.cuenta_id}
                  onChange={handleChange}
                  disabled={loading}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-3
                    py-2.5
                    outline-none
                    transition
                    focus:border-[var(--color-primary)]
                    focus:ring-2
                    focus:ring-[var(--color-primary)]/20
                    disabled:bg-gray-100
                  "
                >
                  <option value="">Seleccione una cuenta</option>

                  {cuentas
                    .filter((item) => item.activo)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre} — {formatMoney(item.saldo_actual)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* CUENTA PRESELECCIONADA */}
            {cuenta && (
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Cuenta seleccionada
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {cuenta.nombre}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Saldo actual:{" "}
                  <span className="font-medium text-gray-700">
                    {formatMoney(cuenta.saldo_actual)}
                  </span>
                </p>
              </div>
            )}

            {/* MONTO */}
            <div>
              <label
                htmlFor="monto"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Monto
              </label>

              <div className="relative">
                <span
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                >
                  $
                </span>

                <input
                  id="monto"
                  type="number"
                  name="monto"
                  value={form.monto}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  disabled={loading}
                  autoFocus
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    py-2.5
                    pl-8
                    pr-3
                    outline-none
                    transition
                    focus:border-[var(--color-primary)]
                    focus:ring-2
                    focus:ring-[var(--color-primary)]/20
                    disabled:bg-gray-100
                  "
                />
              </div>
            </div>

            {/* FECHA */}
            <div>
              <label
                htmlFor="fecha"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Fecha del ingreso
              </label>

              <input
                id="fecha"
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                disabled={loading}
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  px-3
                  py-2.5
                  outline-none
                  transition
                  focus:border-[var(--color-primary)]
                  focus:ring-2
                  focus:ring-[var(--color-primary)]/20
                  disabled:bg-gray-100
                "
              />
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label
                htmlFor="descripcion"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Descripción
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={4}
                maxLength={300}
                placeholder="Ejemplo: Pago manual del contrato de alquiler"
                disabled={loading}
                className="
                  w-full
                  resize-none
                  rounded-lg
                  border
                  border-gray-300
                  px-3
                  py-2.5
                  outline-none
                  transition
                  focus:border-[var(--color-primary)]
                  focus:ring-2
                  focus:ring-[var(--color-primary)]/20
                  disabled:bg-gray-100
                "
              />

              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Describe claramente el origen del ingreso.</span>

                <span>{form.descripcion.length}/300</span>
              </div>
            </div>

            {/* RESUMEN */}
            {cuentaSeleccionada && form.monto && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  Resumen de la operación
                </p>

                <div className="mt-2 space-y-1 text-sm text-green-700">
                  <p>
                    Cuenta: <strong>{cuentaSeleccionada.nombre}</strong>
                  </p>

                  <p>
                    Ingreso: <strong>{formatMoney(form.monto)}</strong>
                  </p>

                  <p>
                    Nuevo saldo estimado:{" "}
                    <strong>
                      {formatMoney(
                        Number(cuentaSeleccionada.saldo_actual || 0) +
                          Number(form.monto || 0),
                      )}
                    </strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="shrink-0 border-t bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  px-4
                  py-2.5
                  text-gray-700
                  transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  rounded-lg
                  bg-green-600
                  px-5
                  py-2.5
                  font-medium
                  text-white
                  transition
                  hover:bg-green-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                {loading ? "Registrando..." : "Registrar ingreso"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarIngresoModal;
