import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  AlertCircle,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Landmark,
  Loader2,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import {
  confirmarGastoObra,
  type ConfirmarGastoObraPayload,
  type GastoObra,
  type MetodoPagoGasto,
} from "../services/gastoObraService";

/* =====================================================
   CUENTA FINANCIERA
===================================================== */

export interface CuentaFinancieraOption {
  id: string;

  nombre: string;

  tipo: string;

  saldo_actual: number | string;

  activo: boolean;

  observaciones?: string | null;
}

/* =====================================================
   PROPS
===================================================== */

interface ConfirmarGastoObraModalProps {
  isOpen: boolean;

  gasto: GastoObra | null;

  cuentas: CuentaFinancieraOption[];

  onClose: () => void;

  onConfirmed?: () => void | Promise<void>;
}

/* =====================================================
   MÉTODOS DE PAGO
===================================================== */

const METODOS_PAGO: Array<{
  value: MetodoPagoGasto;
  label: string;
}> = [
  {
    value: "efectivo",
    label: "Efectivo",
  },
  {
    value: "transferencia",
    label: "Transferencia",
  },
  {
    value: "deposito",
    label: "Depósito",
  },
  {
    value: "cheque",
    label: "Cheque",
  },
];

/* =====================================================
   FORM
===================================================== */

interface FormState {
  cuenta_id: string;

  fecha_pago: string;

  metodo_pago: MetodoPagoGasto | "";

  referencia: string;

  observaciones: string;
}

/* =====================================================
   FECHA LOCAL
===================================================== */

const obtenerFechaActual = () => {
  const fecha = new Date();

  const year = fecha.getFullYear();

  const month = String(fecha.getMonth() + 1).padStart(2, "0");

  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const crearEstadoInicial = (): FormState => ({
  cuenta_id: "",
  fecha_pago: obtenerFechaActual(),
  metodo_pago: "",
  referencia: "",
  observaciones: "",
});

/* =====================================================
   HELPERS
===================================================== */

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

    const errores = axiosError.response?.data?.errors;

    if (Array.isArray(errores) && errores.length > 0) {
      return errores
        .map((item) => item.mensaje)
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

  return "No se pudo confirmar el gasto.";
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

const obtenerLabelTipoCuenta = (tipo?: string) => {
  switch (tipo) {
    case "caja":
      return "Caja";

    case "banco":
      return "Banco";

    case "efectivo":
      return "Efectivo";

    default:
      return tipo || "Cuenta";
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

const ConfirmarGastoObraModal = ({
  isOpen,
  gasto,
  cuentas,
  onClose,
  onConfirmed,
}: ConfirmarGastoObraModalProps) => {
  /* =================================================
       ESTADOS
    ================================================= */

  const [form, setForm] = useState<FormState>(crearEstadoInicial());

  const [confirmando, setConfirmando] = useState(false);

  const [errores, setErrores] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  /* =================================================
       CUENTAS ACTIVAS
    ================================================= */

  const cuentasActivas = useMemo(
    () => cuentas.filter((cuenta) => cuenta.activo),
    [cuentas],
  );

  /* =================================================
       CUENTA SELECCIONADA
    ================================================= */

  const cuentaSeleccionada = useMemo(
    () => cuentas.find((cuenta) => cuenta.id === form.cuenta_id) || null,
    [cuentas, form.cuenta_id],
  );

  /* =================================================
       MONTO
    ================================================= */

  const montoGasto = Number(gasto?.monto ?? 0);

  /* =================================================
       SALDO
    ================================================= */

  const saldoCuenta = Number(cuentaSeleccionada?.saldo_actual ?? 0);

  const saldoPosterior = saldoCuenta - montoGasto;

  const saldoSuficiente = cuentaSeleccionada
    ? saldoCuenta >= montoGasto
    : false;

  /* =================================================
       RESET
    ================================================= */

  useEffect(() => {
    if (isOpen) {
      setForm(crearEstadoInicial());

      setErrores({});

      setConfirmando(false);
    }
  }, [isOpen]);

  /* =================================================
       BLOQUEAR SCROLL
    ================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [isOpen]);

  /* =================================================
       ESC
    ================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirmando) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, confirmando, onClose]);

  /* =================================================
       ACTUALIZAR CAMPO
    ================================================= */

  const actualizarCampo = <K extends keyof FormState>(
    campo: K,
    valor: FormState[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    if (errores[campo]) {
      setErrores((prev) => ({
        ...prev,
        [campo]: undefined,
      }));
    }
  };

  /* =================================================
       VALIDAR
    ================================================= */

  const validarFormulario = () => {
    const nuevosErrores: Partial<Record<keyof FormState, string>> = {};

    if (!form.cuenta_id) {
      nuevosErrores.cuenta_id = "Seleccione una cuenta financiera.";
    }

    if (cuentaSeleccionada && !cuentaSeleccionada.activo) {
      nuevosErrores.cuenta_id = "La cuenta seleccionada se encuentra inactiva.";
    }

    if (cuentaSeleccionada && !saldoSuficiente) {
      nuevosErrores.cuenta_id =
        "La cuenta no tiene saldo suficiente para cubrir este gasto.";
    }

    if (!form.fecha_pago) {
      nuevosErrores.fecha_pago = "La fecha de pago es obligatoria.";
    }

    if (!form.metodo_pago) {
      nuevosErrores.metodo_pago = "Seleccione un método de pago.";
    }

    if (form.referencia.trim().length > 100) {
      nuevosErrores.referencia =
        "La referencia no puede superar los 100 caracteres.";
    }

    if (form.observaciones.trim().length > 1000) {
      nuevosErrores.observaciones =
        "Las observaciones no pueden superar los 1000 caracteres.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  /* =================================================
       CONFIRMAR
    ================================================= */

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!gasto || confirmando) {
      return;
    }

    if (gasto.estado !== "pendiente") {
      await Swal.fire({
        icon: "warning",
        title: "Gasto no disponible",
        text: "Solo los gastos pendientes pueden confirmarse.",
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });

      return;
    }

    if (!validarFormulario()) {
      return;
    }

    if (!form.metodo_pago) {
      return;
    }

    const resultadoConfirmacion = await Swal.fire({
      icon: "question",
      title: "¿Confirmar pago del gasto?",
      html: `
                    <div style="text-align:left;line-height:1.7">
                        <p>
                            Se registrará un egreso financiero por
                            <strong>${formatearMoneda(montoGasto)}</strong>.
                        </p>

                        <p style="margin-top:8px">
                            El saldo será descontado de la cuenta
                            <strong>${
                              cuentaSeleccionada?.nombre ?? ""
                            }</strong>.
                        </p>

                        <p style="margin-top:8px;color:#b45309">
                            Esta acción generará una transacción financiera.
                        </p>
                    </div>
                `,
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar pago",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      heightAuto: false,
    });

    if (!resultadoConfirmacion.isConfirmed) {
      return;
    }

    const payload: ConfirmarGastoObraPayload = {
      cuenta_id: form.cuenta_id,

      fecha_pago: form.fecha_pago,

      metodo_pago: form.metodo_pago,

      referencia: form.referencia.trim() || null,

      observaciones: form.observaciones.trim() || null,
    };

    try {
      setConfirmando(true);

      const resultado = await confirmarGastoObra(gasto.id, payload);

      await Swal.fire({
        icon: "success",
        title: "Gasto confirmado",
        html: `
                    <div style="text-align:left;line-height:1.7">
                        <p>
                            El gasto fue pagado correctamente.
                        </p>

                        <p style="margin-top:8px">
                            <strong>Monto:</strong>
                            ${formatearMoneda(montoGasto)}
                        </p>

                        <p>
                            <strong>Cuenta:</strong>
                            ${
                              resultado.cuenta?.nombre ||
                              cuentaSeleccionada?.nombre ||
                              "-"
                            }
                        </p>

                        <p>
                            <strong>Nuevo saldo:</strong>
                            ${formatearMoneda(
                              resultado.cuenta?.saldo_actual ?? saldoPosterior,
                            )}
                        </p>

                        ${
                          resultado.transaccion?.id
                            ? `
                                    <p style="margin-top:8px">
                                        <strong>Transacción:</strong><br/>
                                        <span style="
                                            font-family:monospace;
                                            font-size:12px;
                                            word-break:break-all;
                                        ">
                                            ${resultado.transaccion.id}
                                        </span>
                                    </p>
                                `
                            : ""
                        }
                    </div>
                `,
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });

      if (onConfirmed) {
        await onConfirmed();
      }

      onClose();
    } catch (error) {
      const mensaje = obtenerMensajeError(error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo confirmar",
        text: mensaje,
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });
    } finally {
      setConfirmando(false);
    }
  };

  /* =================================================
       CERRAR
    ================================================= */

  const handleClose = () => {
    if (confirmando) {
      return;
    }

    onClose();
  };

  /* =================================================
       NO RENDERIZAR
    ================================================= */

  if (!isOpen || !gasto) {
    return null;
  }

  /* =================================================
       VALIDAR ESTADO
    ================================================= */

  const puedeConfirmar = gasto.estado === "pendiente";

  /* =================================================
       UI
    ================================================= */

  return (
    <div
      className="
                fixed inset-0 z-[100]
                flex items-center justify-center
                bg-slate-950/60
                px-4 py-6
                backdrop-blur-[2px]
            "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="
                    flex max-h-[94vh]
                    w-full max-w-3xl
                    flex-col overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                "
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* =================================================
                    HEADER
                ================================================= */}

        <div
          className="
                        flex items-start
                        justify-between
                        border-b
                        border-slate-200
                        px-6 py-5
                    "
        >
          <div
            className="
                            flex items-start
                            gap-3
                        "
          >
            <div
              className="
                                flex h-11 w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-emerald-600
                                text-white
                            "
            >
              <CheckCircle2 size={22} />
            </div>

            <div>
              <h2
                className="
                                    text-xl
                                    font-semibold
                                    text-slate-900
                                "
              >
                Confirmar gasto
              </h2>

              <p
                className="
                                    mt-1 text-sm
                                    text-slate-500
                                "
              >
                Registra el pago y genera el egreso financiero.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={confirmando}
            className="
                            rounded-lg p-2
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
          >
            <X size={21} />
          </button>
        </div>

        {/* =================================================
                    CONTENT
                ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="
                        flex min-h-0
                        flex-1 flex-col
                    "
        >
          <div
            className="
                            flex-1
                            overflow-y-auto
                            px-6 py-5
                        "
          >
            {/* =================================================
                            GASTO
                        ================================================= */}

            <div
              className="
                                mb-5
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                p-4
                            "
            >
              <div
                className="
                                    mb-4 flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
              >
                <div
                  className="
                                        flex items-center
                                        gap-2
                                    "
                >
                  <ReceiptText
                    size={18}
                    className="
                                            text-slate-500
                                        "
                  />

                  <p
                    className="
                                            text-sm
                                            font-semibold
                                            text-slate-800
                                        "
                  >
                    Resumen del gasto
                  </p>
                </div>

                <span
                  className="
                                        rounded-full
                                        bg-amber-100
                                        px-2.5 py-1
                                        text-xs
                                        font-medium
                                        text-amber-700
                                    "
                >
                  {gasto.estado}
                </span>
              </div>

              <div
                className="
                                    grid grid-cols-1
                                    gap-4
                                    sm:grid-cols-2
                                "
              >
                <div>
                  <p
                    className="
                                            text-xs
                                            text-slate-500
                                        "
                  >
                    Obra
                  </p>

                  <div
                    className="
                                            mt-1 flex
                                            items-center gap-2
                                            text-sm
                                            font-medium
                                            text-slate-800
                                        "
                  >
                    <Building2 size={16} />

                    <span>
                      {gasto.obra_codigo ? `${gasto.obra_codigo} - ` : ""}

                      {gasto.obra_nombre || gasto.obra_id}
                    </span>
                  </div>
                </div>

                <div>
                  <p
                    className="
                                            text-xs
                                            text-slate-500
                                        "
                  >
                    Fecha del gasto
                  </p>

                  <div
                    className="
                                            mt-1 flex
                                            items-center gap-2
                                            text-sm
                                            font-medium
                                            text-slate-800
                                        "
                  >
                    <CalendarDays size={16} />

                    {formatearFecha(gasto.fecha)}
                  </div>
                </div>

                <div>
                  <p
                    className="
                                            text-xs
                                            text-slate-500
                                        "
                  >
                    Descripción
                  </p>

                  <p
                    className="
                                            mt-1 text-sm
                                            font-medium
                                            text-slate-800
                                        "
                  >
                    {gasto.descripcion}
                  </p>
                </div>

                <div>
                  <p
                    className="
                                            text-xs
                                            text-slate-500
                                        "
                  >
                    Monto a pagar
                  </p>

                  <p
                    className="
                                            mt-1 text-xl
                                            font-bold
                                            text-slate-900
                                        "
                  >
                    {formatearMoneda(montoGasto)}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                            ADVERTENCIA SI NO ES PENDIENTE
                        ================================================= */}

            {!puedeConfirmar && (
              <div
                className="
                                    mb-5
                                    flex items-start
                                    gap-3
                                    rounded-xl
                                    border
                                    border-red-200
                                    bg-red-50
                                    px-4 py-3
                                "
              >
                <AlertCircle
                  size={19}
                  className="
                                        mt-0.5
                                        shrink-0
                                        text-red-600
                                    "
                />

                <div>
                  <p
                    className="
                                            text-sm
                                            font-medium
                                            text-red-900
                                        "
                  >
                    Este gasto no puede confirmarse
                  </p>

                  <p
                    className="
                                            mt-0.5
                                            text-xs
                                            leading-5
                                            text-red-700
                                        "
                  >
                    Solo los gastos pendientes pueden generar un egreso
                    financiero.
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                            AVISO FINANCIERO
                        ================================================= */}

            {puedeConfirmar && (
              <div
                className="
                                    mb-5
                                    flex items-start
                                    gap-3
                                    rounded-xl
                                    border
                                    border-emerald-200
                                    bg-emerald-50
                                    px-4 py-3
                                "
              >
                <ShieldCheck
                  size={19}
                  className="
                                        mt-0.5
                                        shrink-0
                                        text-emerald-600
                                    "
                />

                <div>
                  <p
                    className="
                                            text-sm
                                            font-medium
                                            text-emerald-900
                                        "
                  >
                    Movimiento financiero
                  </p>

                  <p
                    className="
                                            mt-0.5
                                            text-xs
                                            leading-5
                                            text-emerald-700
                                        "
                  >
                    Al confirmar, el sistema creará una transacción de egreso y
                    descontará automáticamente el monto de la cuenta
                    seleccionada.
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                            FORMULARIO
                        ================================================= */}

            <div
              className="
                                grid grid-cols-1
                                gap-5
                                md:grid-cols-2
                            "
            >
              {/* =================================================
                                CUENTA
                            ================================================= */}

              <div
                className="
                                    md:col-span-2
                                "
              >
                <label
                  htmlFor="confirmar-gasto-cuenta"
                  className="
                                        mb-1.5 block
                                        text-sm
                                        font-medium
                                        text-slate-700
                                    "
                >
                  Cuenta financiera
                  <span
                    className="
                                            text-red-500
                                        "
                  >
                    {" "}
                    *
                  </span>
                </label>

                <div
                  className="
                                        relative
                                    "
                >
                  <WalletCards
                    size={18}
                    className="
                                            pointer-events-none
                                            absolute
                                            left-3 top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                  />

                  <select
                    id="confirmar-gasto-cuenta"
                    value={form.cuenta_id}
                    onChange={(event) =>
                      actualizarCampo("cuenta_id", event.target.value)
                    }
                    disabled={confirmando || !puedeConfirmar}
                    className={`
                                            w-full
                                            appearance-none
                                            rounded-lg
                                            border
                                            bg-white
                                            py-2.5
                                            pl-10
                                            pr-9
                                            text-sm
                                            text-slate-800
                                            outline-none
                                            transition
                                            focus:ring-2
                                            focus:ring-slate-200
                                            disabled:cursor-not-allowed
                                            disabled:bg-slate-100
                                            ${
                                              errores.cuenta_id
                                                ? "border-red-400"
                                                : "border-slate-300 focus:border-slate-500"
                                            }
                                        `}
                  >
                    <option value="">Seleccione una cuenta</option>

                    {cuentasActivas.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.nombre}
                        {" — "}
                        {obtenerLabelTipoCuenta(cuenta.tipo)}
                        {" — "}
                        {formatearMoneda(cuenta.saldo_actual)}
                      </option>
                    ))}
                  </select>
                </div>

                {errores.cuenta_id && (
                  <p
                    className="
                                            mt-1
                                            text-xs
                                            text-red-600
                                        "
                  >
                    {errores.cuenta_id}
                  </p>
                )}

                {cuentasActivas.length === 0 && (
                  <p
                    className="
                                            mt-1
                                            text-xs
                                            text-amber-600
                                        "
                  >
                    No existen cuentas financieras activas disponibles.
                  </p>
                )}
              </div>

              {/* =================================================
                                INFO CUENTA
                            ================================================= */}

              {cuentaSeleccionada && (
                <div
                  className="
                                        md:col-span-2
                                        grid grid-cols-1
                                        gap-3
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-slate-50
                                        p-4
                                        sm:grid-cols-3
                                    "
                >
                  <div>
                    <div
                      className="
                                                flex items-center
                                                gap-2
                                            "
                    >
                      <Landmark
                        size={16}
                        className="
                                                    text-slate-500
                                                "
                      />

                      <p
                        className="
                                                    text-xs
                                                    text-slate-500
                                                "
                      >
                        Cuenta
                      </p>
                    </div>

                    <p
                      className="
                                                mt-1
                                                text-sm
                                                font-semibold
                                                text-slate-900
                                            "
                    >
                      {cuentaSeleccionada.nombre}
                    </p>
                  </div>

                  <div>
                    <div
                      className="
                                                flex items-center
                                                gap-2
                                            "
                    >
                      <DollarSign
                        size={16}
                        className="
                                                    text-slate-500
                                                "
                      />

                      <p
                        className="
                                                    text-xs
                                                    text-slate-500
                                                "
                      >
                        Saldo actual
                      </p>
                    </div>

                    <p
                      className="
                                                mt-1
                                                text-sm
                                                font-semibold
                                                text-slate-900
                                            "
                    >
                      {formatearMoneda(saldoCuenta)}
                    </p>
                  </div>

                  <div>
                    <div
                      className="
                                                flex items-center
                                                gap-2
                                            "
                    >
                      <Banknote
                        size={16}
                        className="
                                                    text-slate-500
                                                "
                      />

                      <p
                        className="
                                                    text-xs
                                                    text-slate-500
                                                "
                      >
                        Saldo posterior
                      </p>
                    </div>

                    <p
                      className={`
                                                mt-1
                                                text-sm
                                                font-bold
                                                ${
                                                  saldoSuficiente
                                                    ? "text-emerald-600"
                                                    : "text-red-600"
                                                }
                                            `}
                    >
                      {formatearMoneda(saldoPosterior)}
                    </p>
                  </div>

                  {!saldoSuficiente && (
                    <div
                      className="
                                                sm:col-span-3
                                                flex items-center
                                                gap-2
                                                rounded-lg
                                                bg-red-50
                                                px-3 py-2
                                                text-xs
                                                font-medium
                                                text-red-700
                                            "
                    >
                      <AlertCircle size={16} />
                      Saldo insuficiente para realizar este pago.
                    </div>
                  )}
                </div>
              )}

              {/* =================================================
                                FECHA
                            ================================================= */}

              <div>
                <label
                  htmlFor="confirmar-gasto-fecha"
                  className="
                                        mb-1.5 block
                                        text-sm
                                        font-medium
                                        text-slate-700
                                    "
                >
                  Fecha de pago
                  <span
                    className="
                                            text-red-500
                                        "
                  >
                    {" "}
                    *
                  </span>
                </label>

                <div
                  className="
                                        relative
                                    "
                >
                  <CalendarDays
                    size={18}
                    className="
                                            pointer-events-none
                                            absolute
                                            left-3 top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                  />

                  <input
                    id="confirmar-gasto-fecha"
                    type="date"
                    value={form.fecha_pago}
                    onChange={(event) =>
                      actualizarCampo("fecha_pago", event.target.value)
                    }
                    disabled={confirmando || !puedeConfirmar}
                    className={`
                                            w-full
                                            rounded-lg
                                            border
                                            bg-white
                                            py-2.5
                                            pl-10
                                            pr-3
                                            text-sm
                                            text-slate-800
                                            outline-none
                                            transition
                                            focus:ring-2
                                            focus:ring-slate-200
                                            disabled:cursor-not-allowed
                                            disabled:bg-slate-100
                                            ${
                                              errores.fecha_pago
                                                ? "border-red-400"
                                                : "border-slate-300 focus:border-slate-500"
                                            }
                                        `}
                  />
                </div>

                {errores.fecha_pago && (
                  <p
                    className="
                                            mt-1
                                            text-xs
                                            text-red-600
                                        "
                  >
                    {errores.fecha_pago}
                  </p>
                )}
              </div>

              {/* =================================================
                                MÉTODO
                            ================================================= */}

              <div>
                <label
                  htmlFor="confirmar-gasto-metodo"
                  className="
                                        mb-1.5 block
                                        text-sm
                                        font-medium
                                        text-slate-700
                                    "
                >
                  Método de pago
                  <span
                    className="
                                            text-red-500
                                        "
                  >
                    {" "}
                    *
                  </span>
                </label>

                <div
                  className="
                                        relative
                                    "
                >
                  <CreditCard
                    size={18}
                    className="
                                            pointer-events-none
                                            absolute
                                            left-3 top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                  />

                  <select
                    id="confirmar-gasto-metodo"
                    value={form.metodo_pago}
                    onChange={(event) =>
                      actualizarCampo(
                        "metodo_pago",
                        event.target.value as MetodoPagoGasto | "",
                      )
                    }
                    disabled={confirmando || !puedeConfirmar}
                    className={`
                                            w-full
                                            appearance-none
                                            rounded-lg
                                            border
                                            bg-white
                                            py-2.5
                                            pl-10
                                            pr-9
                                            text-sm
                                            text-slate-800
                                            outline-none
                                            transition
                                            focus:ring-2
                                            focus:ring-slate-200
                                            disabled:cursor-not-allowed
                                            disabled:bg-slate-100
                                            ${
                                              errores.metodo_pago
                                                ? "border-red-400"
                                                : "border-slate-300 focus:border-slate-500"
                                            }
                                        `}
                  >
                    <option value="">Seleccione un método</option>

                    {METODOS_PAGO.map((metodo) => (
                      <option key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {errores.metodo_pago && (
                  <p
                    className="
                                            mt-1
                                            text-xs
                                            text-red-600
                                        "
                  >
                    {errores.metodo_pago}
                  </p>
                )}
              </div>

              {/* =================================================
                                REFERENCIA
                            ================================================= */}

              <div
                className="
                                    md:col-span-2
                                "
              >
                <label
                  htmlFor="confirmar-gasto-referencia"
                  className="
                                        mb-1.5 block
                                        text-sm
                                        font-medium
                                        text-slate-700
                                    "
                >
                  Referencia de pago
                  <span
                    className="
                                            ml-1
                                            font-normal
                                            text-slate-400
                                        "
                  >
                    (opcional)
                  </span>
                </label>

                <input
                  id="confirmar-gasto-referencia"
                  type="text"
                  maxLength={100}
                  placeholder="N.º transferencia, cheque, depósito, recibo..."
                  value={form.referencia}
                  onChange={(event) =>
                    actualizarCampo("referencia", event.target.value)
                  }
                  disabled={confirmando || !puedeConfirmar}
                  className={`
                                        w-full
                                        rounded-lg
                                        border
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        text-slate-800
                                        outline-none
                                        transition
                                        placeholder:text-slate-400
                                        focus:ring-2
                                        focus:ring-slate-200
                                        disabled:cursor-not-allowed
                                        disabled:bg-slate-100
                                        ${
                                          errores.referencia
                                            ? "border-red-400"
                                            : "border-slate-300 focus:border-slate-500"
                                        }
                                    `}
                />

                <div
                  className="
                                        mt-1 flex
                                        justify-between
                                    "
                >
                  <div>
                    {errores.referencia && (
                      <p
                        className="
                                                    text-xs
                                                    text-red-600
                                                "
                      >
                        {errores.referencia}
                      </p>
                    )}
                  </div>

                  <span
                    className="
                                            text-xs
                                            text-slate-400
                                        "
                  >
                    {form.referencia.length}/100
                  </span>
                </div>
              </div>

              {/* =================================================
                                OBSERVACIONES
                            ================================================= */}

              <div
                className="
                                    md:col-span-2
                                "
              >
                <label
                  htmlFor="confirmar-gasto-observaciones"
                  className="
                                        mb-1.5 block
                                        text-sm
                                        font-medium
                                        text-slate-700
                                    "
                >
                  Observaciones del pago
                  <span
                    className="
                                            ml-1
                                            font-normal
                                            text-slate-400
                                        "
                  >
                    (opcional)
                  </span>
                </label>

                <textarea
                  id="confirmar-gasto-observaciones"
                  rows={3}
                  maxLength={1000}
                  placeholder="Información adicional relacionada con el pago..."
                  value={form.observaciones}
                  onChange={(event) =>
                    actualizarCampo("observaciones", event.target.value)
                  }
                  disabled={confirmando || !puedeConfirmar}
                  className={`
                                        w-full
                                        resize-none
                                        rounded-lg
                                        border
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        text-slate-800
                                        outline-none
                                        transition
                                        placeholder:text-slate-400
                                        focus:ring-2
                                        focus:ring-slate-200
                                        disabled:cursor-not-allowed
                                        disabled:bg-slate-100
                                        ${
                                          errores.observaciones
                                            ? "border-red-400"
                                            : "border-slate-300 focus:border-slate-500"
                                        }
                                    `}
                />

                <div
                  className="
                                        mt-1 flex
                                        justify-between
                                    "
                >
                  <div>
                    {errores.observaciones && (
                      <p
                        className="
                                                    text-xs
                                                    text-red-600
                                                "
                      >
                        {errores.observaciones}
                      </p>
                    )}
                  </div>

                  <span
                    className="
                                            text-xs
                                            text-slate-400
                                        "
                  >
                    {form.observaciones.length}/1000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
                        FOOTER
                    ================================================= */}

          <div
            className="
                            flex flex-col-reverse
                            gap-3
                            border-t
                            border-slate-200
                            bg-slate-50
                            px-6 py-4
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                        "
          >
            <div
              className="
                                text-xs
                                text-slate-500
                            "
            >
              <p>
                Monto a descontar:
                <span
                  className="
                                        ml-1
                                        font-bold
                                        text-slate-900
                                    "
                >
                  {formatearMoneda(montoGasto)}
                </span>
              </p>
            </div>

            <div
              className="
                                flex items-center
                                justify-end gap-3
                            "
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={confirmando}
                className="
                                    rounded-lg
                                    border
                                    border-slate-300
                                    bg-white
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    transition
                                    hover:bg-slate-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
              >
                Cancelar
              </button>

              {puedeConfirmar && (
                <button
                  type="submit"
                  disabled={
                    confirmando ||
                    cuentasActivas.length === 0 ||
                    !form.cuenta_id ||
                    (cuentaSeleccionada !== null && !saldoSuficiente)
                  }
                  className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-lg
                                        bg-emerald-600
                                        px-5
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-white
                                        transition
                                        hover:bg-emerald-700
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                >
                  {confirmando ? (
                    <>
                      <Loader2
                        size={18}
                        className="
                                                    animate-spin
                                                "
                      />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Confirmar pago
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmarGastoObraModal;
