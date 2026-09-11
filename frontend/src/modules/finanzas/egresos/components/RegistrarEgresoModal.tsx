import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import axios from "axios";
import Swal from "sweetalert2";
import { AlertTriangle, Landmark, Receipt, X } from "lucide-react";

import {
  registrarEgreso,
  type RegistrarEgresoDTO,
} from "../service/egresoService";

import type { CuentaFinanciera } from "../../cuentas/service/cuentaService";

interface RegistrarEgresoModalProps {
  open: boolean;
  cuentas: CuentaFinanciera[];
  cuenta?: CuentaFinanciera | null;
  onClose: () => void;
  onRegistered: () => void | Promise<void>;
}

interface FormularioEgreso {
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

const formatearMoneda = (valor: number | string | null | undefined): string => {
  return Number(valor || 0).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
};

function RegistrarEgresoModal({
  open,
  cuentas,
  cuenta = null,
  onClose,
  onRegistered,
}: RegistrarEgresoModalProps) {
  const [formulario, setFormulario] = useState<FormularioEgreso>({
    cuenta_id: "",
    monto: "",
    descripcion: "",
    fecha: obtenerFechaActual(),
  });

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormulario({
      cuenta_id: cuenta?.id ?? "",
      monto: "",
      descripcion: "",
      fecha: obtenerFechaActual(),
    });
  }, [open, cuenta]);

  const cuentasActivas = useMemo(() => {
    return cuentas.filter((item) => item.activo);
  }, [cuentas]);

  const cuentaSeleccionada = useMemo(() => {
    if (cuenta) {
      return cuenta;
    }

    return (
      cuentasActivas.find((item) => item.id === formulario.cuenta_id) ?? null
    );
  }, [cuenta, cuentasActivas, formulario.cuenta_id]);

  const monto = Number(formulario.monto || 0);

  const saldoActual = Number(cuentaSeleccionada?.saldo_actual || 0);

  const saldoPosterior = saldoActual - monto;

  const saldoInsuficiente = monto > 0 && monto > saldoActual;

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: value,
    }));
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    onClose();
  };

  const mostrarErrorBackend = async (error: unknown) => {
    let mensaje = "No se pudo registrar el egreso.";

    if (axios.isAxiosError(error)) {
      mensaje =
        error.response?.data?.message ??
        error.response?.data?.errors?.[0] ??
        error.response?.data?.error ??
        mensaje;
    }

    await Swal.fire({
      icon: "error",
      title: "Error al registrar",
      text: mensaje,
      confirmButtonText: "Aceptar",
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cuentaSeleccionada) {
      await Swal.fire({
        icon: "warning",
        title: "Cuenta obligatoria",
        text: "Seleccione la cuenta financiera de donde saldrá el dinero.",
      });

      return;
    }

    if (!cuentaSeleccionada.activo) {
      await Swal.fire({
        icon: "warning",
        title: "Cuenta inactiva",
        text: "No se pueden registrar egresos en una cuenta inactiva.",
      });

      return;
    }

    if (Number.isNaN(monto) || monto <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Monto incorrecto",
        text: "Ingrese un monto mayor que cero.",
      });

      return;
    }

    if (monto > saldoActual) {
      await Swal.fire({
        icon: "warning",
        title: "Saldo insuficiente",
        text: `La cuenta dispone de ${formatearMoneda(saldoActual)}.`,
      });

      return;
    }

    if (!formulario.fecha) {
      await Swal.fire({
        icon: "warning",
        title: "Fecha obligatoria",
        text: "Seleccione la fecha del egreso.",
      });

      return;
    }

    if (!formulario.descripcion.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Descripción obligatoria",
        text: "Ingrese el motivo del egreso.",
      });

      return;
    }

    const datos: RegistrarEgresoDTO = {
      cuenta_id: cuentaSeleccionada.id,
      monto,
      descripcion: formulario.descripcion.trim(),
      fecha: formulario.fecha,
      referencia_id: null,
      obra_id: null,
      control_diario_id: null,
      origen_modulo: "manual",
      origen_id: null,
    };

    try {
      setGuardando(true);

      await registrarEgreso(datos);

      await Swal.fire({
        icon: "success",
        title: "Egreso registrado",
        html: `
          <div style="text-align:left">
            <p>
              <strong>Cuenta:</strong>
              ${cuentaSeleccionada.nombre}
            </p>

            <p>
              <strong>Monto:</strong>
              ${formatearMoneda(monto)}
            </p>
          </div>
        `,
        timer: 1800,
        showConfirmButton: false,
      });

      await onRegistered();
      onClose();
    } catch (error: unknown) {
      await mostrarErrorBackend(error);
    } finally {
      setGuardando(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          cerrarModal();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >
        {/* HEADER */}
        <div
          className="
            flex
            shrink-0
            items-start
            justify-between
            border-b
            px-6
            py-5
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                rounded-xl
                bg-red-100
                p-3
                text-red-600
              "
            >
              <Receipt size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Registrar egreso manual
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Registra una salida de dinero desde una cuenta financiera.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            disabled={guardando}
            className="
              rounded-lg
              p-2
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-gray-800
              disabled:opacity-50
            "
            aria-label="Cerrar"
          >
            <X size={21} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="
            flex
            min-h-0
            flex-1
            flex-col
          "
        >
          <div
            className="
              min-h-0
              flex-1
              space-y-5
              overflow-y-auto
              px-6
              py-5
            "
          >
            {/* CUENTA */}
            <div>
              <label
                htmlFor="cuenta_id"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Cuenta financiera
              </label>

              {cuenta ? (
                <div
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    p-4
                  "
                >
                  <div className="flex items-center gap-3">
                    <Landmark size={21} className="text-gray-500" />

                    <div>
                      <p className="font-semibold text-gray-800">
                        {cuenta.nombre}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Saldo disponible:{" "}
                        <strong className="text-gray-700">
                          {formatearMoneda(cuenta.saldo_actual)}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <select
                  id="cuenta_id"
                  name="cuenta_id"
                  value={formulario.cuenta_id}
                  onChange={handleChange}
                  disabled={guardando}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-4
                    py-2.5
                    outline-none
                    focus:border-[var(--color-primary)]
                    focus:ring-2
                    focus:ring-[var(--color-primary)]/20
                  "
                >
                  <option value="">Seleccione una cuenta</option>

                  {cuentasActivas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} — {formatearMoneda(item.saldo_actual)}
                    </option>
                  ))}
                </select>
              )}

              {!cuenta && cuentasActivas.length === 0 && (
                <p className="mt-2 text-sm text-red-600">
                  No existen cuentas activas disponibles.
                </p>
              )}
            </div>

            {/* MONTO Y FECHA */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="monto"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Monto del egreso
                </label>

                <div className="relative">
                  <span
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-gray-500
                    "
                  >
                    $
                  </span>

                  <input
                    id="monto"
                    name="monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formulario.monto}
                    onChange={handleChange}
                    disabled={guardando}
                    placeholder="0.00"
                    className={`
                      w-full
                      rounded-lg
                      border
                      py-2.5
                      pl-8
                      pr-4
                      outline-none
                      focus:ring-2
                      ${
                        saldoInsuficiente
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-gray-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                      }
                    `}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="fecha"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Fecha
                </label>

                <input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={formulario.fecha}
                  onChange={handleChange}
                  disabled={guardando}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2.5
                    outline-none
                    focus:border-[var(--color-primary)]
                    focus:ring-2
                    focus:ring-[var(--color-primary)]/20
                  "
                />
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label
                htmlFor="descripcion"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Descripción
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                maxLength={300}
                value={formulario.descripcion}
                onChange={handleChange}
                disabled={guardando}
                placeholder="Ejemplo: Compra de materiales para la oficina"
                className="
                  w-full
                  resize-none
                  rounded-lg
                  border
                  border-gray-300
                  px-4
                  py-3
                  outline-none
                  focus:border-[var(--color-primary)]
                  focus:ring-2
                  focus:ring-[var(--color-primary)]/20
                "
              />

              <div
                className="
                  mt-1
                  flex
                  justify-between
                  gap-3
                  text-xs
                  text-gray-500
                "
              >
                <span>Explique claramente el motivo del egreso.</span>

                <span>
                  {formulario.descripcion.length}
                  /300
                </span>
              </div>
            </div>

            {/* RESUMEN */}
            {cuentaSeleccionada && monto > 0 && (
              <div
                className={`
                    rounded-xl
                    border
                    p-4
                    ${
                      saldoInsuficiente
                        ? "border-red-300 bg-red-50"
                        : "border-orange-200 bg-orange-50"
                    }
                  `}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={20}
                    className={
                      saldoInsuficiente
                        ? "mt-0.5 text-red-600"
                        : "mt-0.5 text-orange-600"
                    }
                  />

                  <div className="flex-1">
                    <p
                      className={`
                          font-semibold
                          ${
                            saldoInsuficiente
                              ? "text-red-800"
                              : "text-orange-800"
                          }
                        `}
                    >
                      Resumen de la operación
                    </p>

                    <div
                      className={`
                          mt-2
                          grid
                          grid-cols-1
                          gap-1
                          text-sm
                          sm:grid-cols-2
                          ${
                            saldoInsuficiente
                              ? "text-red-700"
                              : "text-orange-700"
                          }
                        `}
                    >
                      <p>
                        Saldo actual:{" "}
                        <strong>{formatearMoneda(saldoActual)}</strong>
                      </p>

                      <p>
                        Egreso: <strong>-{formatearMoneda(monto)}</strong>
                      </p>

                      <p className="sm:col-span-2">
                        Saldo posterior:{" "}
                        <strong>{formatearMoneda(saldoPosterior)}</strong>
                      </p>
                    </div>

                    {saldoInsuficiente && (
                      <p className="mt-2 text-sm font-semibold text-red-700">
                        El saldo de la cuenta no es suficiente.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div
            className="
              flex
              shrink-0
              flex-col-reverse
              gap-3
              border-t
              bg-gray-50
              px-6
              py-4
              sm:flex-row
              sm:justify-end
            "
          >
            <button
              type="button"
              onClick={cerrarModal}
              disabled={guardando}
              className="
                rounded-lg
                border
                border-gray-300
                bg-white
                px-5
                py-2.5
                font-medium
                text-gray-700
                transition
                hover:bg-gray-100
                disabled:opacity-50
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                guardando || saldoInsuficiente || cuentasActivas.length === 0
              }
              className="
                rounded-lg
                bg-red-600
                px-5
                py-2.5
                font-medium
                text-white
                transition
                hover:bg-red-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {guardando ? "Registrando..." : "Registrar egreso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarEgresoModal;
