import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileText,
  Hash,
  Landmark,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Tag,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import Swal from "sweetalert2";

import {
  obtenerGastoObraPorId,
  type GastoObra,
} from "../services/gastoObraService";

/* =====================================================
   PROPS
===================================================== */

interface GastoObraDetailModalProps {
  isOpen: boolean;

  gastoId: string | null;

  onClose: () => void;
}

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

  return "No se pudo cargar la información del gasto.";
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

const formatearFechaHora = (fecha?: string | null) => {
  if (!fecha) {
    return "-";
  }

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const capitalizar = (valor?: string | null) => {
  if (!valor) {
    return "-";
  }

  return valor
    .replace(/_/g, " ")
    .split(" ")
    .map((palabra) =>
      palabra
        ? palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
        : palabra,
    )
    .join(" ");
};

const estadoConfig = (estado?: string) => {
  switch (estado) {
    case "pagado":
      return {
        label: "Pagado",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };

    case "anulado":
      return {
        label: "Anulado",
        className: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
      };

    default:
      return {
        label: "Pendiente",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: AlertCircle,
      };
  }
};

/* =====================================================
   CAMPO VISUAL
===================================================== */

interface CampoDetalleProps {
  label: string;

  value: string | number | null | undefined;

  icon?: React.ComponentType<{
    size?: number;
    className?: string;
  }>;

  mono?: boolean;

  full?: boolean;
}

const CampoDetalle = ({
  label,
  value,
  icon: Icon,
  mono = false,
  full = false,
}: CampoDetalleProps) => {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p
        className="
                    mb-1 flex items-center
                    gap-2 text-xs
                    font-medium uppercase
                    tracking-wide
                    text-slate-500
                "
      >
        {Icon && <Icon size={15} className="text-slate-400" />}

        {label}
      </p>

      <p
        className={`
                    break-words
                    text-sm
                    font-medium
                    text-slate-900
                    ${mono ? "font-mono text-xs" : ""}
                `}
      >
        {value !== null && value !== undefined && value !== "" ? value : "-"}
      </p>
    </div>
  );
};

/* =====================================================
   COMPONENTE
===================================================== */

const GastoObraDetailModal = ({
  isOpen,
  gastoId,
  onClose,
}: GastoObraDetailModalProps) => {
  /* =================================================
       ESTADOS
    ================================================= */

  const [gasto, setGasto] = useState<GastoObra | null>(null);

  const [cargando, setCargando] = useState(false);

  /* =================================================
       ESTADO VISUAL
    ================================================= */

  const estado = useMemo(() => estadoConfig(gasto?.estado), [gasto?.estado]);

  const EstadoIcon = estado.icon;

  /* =================================================
       CARGAR GASTO
    ================================================= */

  useEffect(() => {
    if (!isOpen || !gastoId) {
      return;
    }

    const cargar = async () => {
      try {
        setCargando(true);

        setGasto(null);

        const data = await obtenerGastoObraPorId(gastoId);

        setGasto(data);
      } catch (error) {
        const mensaje = obtenerMensajeError(error);

        await Swal.fire({
          icon: "error",
          title: "No se pudo cargar el gasto",
          text: mensaje,
          confirmButtonText: "Aceptar",
          heightAuto: false,
        });

        onClose();
      } finally {
        setCargando(false);
      }
    };

    void cargar();
  }, [isOpen, gastoId, onClose]);

  /* =================================================
       RESET
    ================================================= */

  useEffect(() => {
    if (!isOpen) {
      setGasto(null);

      setCargando(false);
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
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  /* =================================================
       NO RENDERIZAR
    ================================================= */

  if (!isOpen) {
    return null;
  }

  /* =================================================
       UI
    ================================================= */

  return (
    <div
      className="
                fixed inset-0 z-[100]
                flex items-center
                justify-center
                bg-slate-950/60
                px-4 py-6
                backdrop-blur-[2px]
            "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
                    flex max-h-[94vh]
                    w-full max-w-4xl
                    flex-col
                    overflow-hidden
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
                                bg-slate-900
                                text-white
                            "
            >
              <ReceiptText size={22} />
            </div>

            <div>
              <div
                className="
                                    flex flex-wrap
                                    items-center
                                    gap-3
                                "
              >
                <h2
                  className="
                                        text-xl
                                        font-semibold
                                        text-slate-900
                                    "
                >
                  Detalle del gasto de obra
                </h2>

                {gasto && (
                  <span
                    className={`
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-full
                                            border
                                            px-2.5
                                            py-1
                                            text-xs
                                            font-semibold
                                            ${estado.className}
                                        `}
                  >
                    <EstadoIcon size={14} />

                    {estado.label}
                  </span>
                )}
              </div>

              <p
                className="
                                    mt-1 text-sm
                                    text-slate-500
                                "
              >
                Consulta la información operativa y financiera del registro.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
                            rounded-lg
                            p-2
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-700
                        "
            title="Cerrar"
          >
            <X size={21} />
          </button>
        </div>

        {/* =================================================
                    LOADING
                ================================================= */}

        {cargando && (
          <div
            className="
                            flex min-h-[450px]
                            items-center
                            justify-center
                        "
          >
            <div
              className="
                                flex flex-col
                                items-center
                                gap-3
                                text-slate-500
                            "
            >
              <Loader2 size={30} className="animate-spin" />

              <p
                className="
                                    text-sm
                                "
              >
                Cargando información del gasto...
              </p>
            </div>
          </div>
        )}

        {/* =================================================
                    CONTENIDO
                ================================================= */}

        {!cargando && gasto && (
          <div
            className="
                                flex-1
                                overflow-y-auto
                                px-6 py-5
                            "
          >
            {/* =================================================
                                RESUMEN PRINCIPAL
                            ================================================= */}

            <div
              className="
                                    mb-5
                                    grid grid-cols-1
                                    gap-4
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    p-5
                                    sm:grid-cols-3
                                "
            >
              <div>
                <p
                  className="
                                            text-xs
                                            font-medium
                                            uppercase
                                            tracking-wide
                                            text-slate-500
                                        "
                >
                  Monto
                </p>

                <p
                  className="
                                            mt-1
                                            text-2xl
                                            font-bold
                                            text-slate-900
                                        "
                >
                  {formatearMoneda(gasto.monto)}
                </p>
              </div>

              <div>
                <p
                  className="
                                            text-xs
                                            font-medium
                                            uppercase
                                            tracking-wide
                                            text-slate-500
                                        "
                >
                  Tipo
                </p>

                <p
                  className="
                                            mt-1
                                            text-sm
                                            font-semibold
                                            text-slate-900
                                        "
                >
                  {capitalizar(gasto.tipo)}
                </p>
              </div>

              <div>
                <p
                  className="
                                            text-xs
                                            font-medium
                                            uppercase
                                            tracking-wide
                                            text-slate-500
                                        "
                >
                  Fecha
                </p>

                <p
                  className="
                                            mt-1
                                            text-sm
                                            font-semibold
                                            text-slate-900
                                        "
                >
                  {formatearFecha(gasto.fecha)}
                </p>
              </div>
            </div>

            {/* =================================================
                                DATOS DEL GASTO
                            ================================================= */}

            <section
              className="
                                    mb-5
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                "
            >
              <div
                className="
                                        flex items-center
                                        gap-2
                                        border-b
                                        border-slate-200
                                        px-5 py-4
                                    "
              >
                <FileText size={18} className="text-slate-500" />

                <h3
                  className="
                                            text-sm
                                            font-semibold
                                            text-slate-900
                                        "
                >
                  Información del gasto
                </h3>
              </div>

              <div
                className="
                                        grid grid-cols-1
                                        gap-5
                                        p-5
                                        md:grid-cols-2
                                    "
              >
                <CampoDetalle
                  label="Obra"
                  value={
                    gasto.obra_codigo
                      ? `${gasto.obra_codigo} - ${gasto.obra_nombre || ""}`
                      : gasto.obra_nombre || gasto.obra_id
                  }
                  icon={Building2}
                />

                <CampoDetalle
                  label="Tipo de gasto"
                  value={capitalizar(gasto.tipo)}
                  icon={Tag}
                />

                <CampoDetalle
                  label="Fecha del gasto"
                  value={formatearFecha(gasto.fecha)}
                  icon={CalendarDays}
                />

                <CampoDetalle
                  label="Monto"
                  value={formatearMoneda(gasto.monto)}
                  icon={CircleDollarSign}
                />

                <CampoDetalle
                  label="Descripción"
                  value={gasto.descripcion}
                  icon={FileText}
                  full
                />

                <CampoDetalle
                  label="Referencia"
                  value={gasto.referencia}
                  icon={Hash}
                />

                <CampoDetalle
                  label="Observaciones"
                  value={gasto.observaciones}
                  icon={ClipboardList}
                  full
                />
              </div>
            </section>

            {/* =================================================
                                CONTROL DIARIO
                            ================================================= */}

            {gasto.control_diario_id && (
              <section
                className="
                                        mb-5
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-white
                                    "
              >
                <div
                  className="
                                            flex items-center
                                            gap-2
                                            border-b
                                            border-slate-200
                                            px-5 py-4
                                        "
                >
                  <ClipboardList size={18} className="text-slate-500" />

                  <h3
                    className="
                                                text-sm
                                                font-semibold
                                                text-slate-900
                                            "
                  >
                    Control diario asociado
                  </h3>
                </div>

                <div
                  className="
                                            grid grid-cols-1
                                            gap-5
                                            p-5
                                            md:grid-cols-2
                                        "
                >
                  <CampoDetalle
                    label="Fecha del control"
                    value={formatearFecha(gasto.control_diario_fecha)}
                    icon={CalendarDays}
                  />

                  <CampoDetalle
                    label="Actividad"
                    value={gasto.control_diario_actividad}
                    icon={ClipboardList}
                  />

                  <CampoDetalle
                    label="Descripción"
                    value={gasto.control_diario_descripcion}
                    icon={FileText}
                    full
                  />

                  <CampoDetalle
                    label="ID control diario"
                    value={gasto.control_diario_id}
                    icon={Hash}
                    mono
                    full
                  />
                </div>
              </section>
            )}

            {/* =================================================
                                DATOS FINANCIEROS
                            ================================================= */}

            <section
              className="
                                    mb-5
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                "
            >
              <div
                className="
                                        flex items-center
                                        gap-2
                                        border-b
                                        border-slate-200
                                        px-5 py-4
                                    "
              >
                <WalletCards size={18} className="text-slate-500" />

                <h3
                  className="
                                            text-sm
                                            font-semibold
                                            text-slate-900
                                        "
                >
                  Información financiera
                </h3>
              </div>

              {gasto.estado === "pendiente" ? (
                <div
                  className="
                                            flex items-start
                                            gap-3
                                            p-5
                                        "
                >
                  <AlertCircle
                    size={20}
                    className="
                                                mt-0.5
                                                shrink-0
                                                text-amber-500
                                            "
                  />

                  <div>
                    <p
                      className="
                                                    text-sm
                                                    font-semibold
                                                    text-slate-900
                                                "
                    >
                      Gasto pendiente de pago
                    </p>

                    <p
                      className="
                                                    mt-1
                                                    text-sm
                                                    leading-6
                                                    text-slate-500
                                                "
                    >
                      Todavía no existe una transacción financiera asociada ni
                      se ha descontado saldo de ninguna cuenta.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="
                                            grid grid-cols-1
                                            gap-5
                                            p-5
                                            md:grid-cols-2
                                        "
                >
                  <CampoDetalle
                    label="Cuenta financiera"
                    value={gasto.cuenta_nombre || gasto.cuenta_id}
                    icon={Landmark}
                  />

                  <CampoDetalle
                    label="Tipo de cuenta"
                    value={capitalizar(gasto.cuenta_tipo)}
                    icon={WalletCards}
                  />

                  <CampoDetalle
                    label="Fecha de pago"
                    value={formatearFecha(gasto.fecha_pago)}
                    icon={CalendarDays}
                  />

                  <CampoDetalle
                    label="Método de pago"
                    value={capitalizar(gasto.metodo_pago)}
                    icon={CreditCard}
                  />

                  <CampoDetalle
                    label="Monto registrado"
                    value={formatearMoneda(
                      gasto.transaccion_monto ?? gasto.monto,
                    )}
                    icon={Banknote}
                  />

                  <CampoDetalle
                    label="Tipo de transacción"
                    value={capitalizar(gasto.transaccion_tipo)}
                    icon={ShieldCheck}
                  />

                  <CampoDetalle
                    label="Fecha transacción"
                    value={formatearFecha(gasto.transaccion_fecha)}
                    icon={CalendarDays}
                  />

                  <CampoDetalle
                    label="Origen"
                    value={capitalizar(gasto.transaccion_origen_modulo)}
                    icon={ReceiptText}
                  />

                  <CampoDetalle
                    label="Descripción financiera"
                    value={gasto.transaccion_descripcion}
                    icon={FileText}
                    full
                  />
                </div>
              )}
            </section>

            {/* =================================================
                                TRANSACCIÓN
                            ================================================= */}

            {gasto.transaccion_id && (
              <section
                className="
                                        mb-5
                                        rounded-xl
                                        border
                                        border-emerald-200
                                        bg-emerald-50/40
                                    "
              >
                <div
                  className="
                                            flex items-center
                                            gap-2
                                            border-b
                                            border-emerald-200
                                            px-5 py-4
                                        "
                >
                  <ShieldCheck size={18} className="text-emerald-600" />

                  <h3
                    className="
                                                text-sm
                                                font-semibold
                                                text-emerald-900
                                            "
                  >
                    Trazabilidad financiera
                  </h3>
                </div>

                <div
                  className="
                                            grid grid-cols-1
                                            gap-5
                                            p-5
                                            md:grid-cols-2
                                        "
                >
                  <CampoDetalle
                    label="ID transacción"
                    value={gasto.transaccion_id}
                    icon={Hash}
                    mono
                    full
                  />

                  <CampoDetalle
                    label="Origen módulo"
                    value={gasto.transaccion_origen_modulo}
                    icon={ReceiptText}
                  />

                  <CampoDetalle
                    label="Origen ID"
                    value={gasto.transaccion_origen_id}
                    icon={Hash}
                    mono
                  />
                </div>
              </section>
            )}

            {/* =================================================
                                INFORMACIÓN TÉCNICA
                            ================================================= */}

            <section
              className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                "
            >
              <div
                className="
                                        flex items-center
                                        gap-2
                                        border-b
                                        border-slate-200
                                        px-5 py-4
                                    "
              >
                <Hash size={18} className="text-slate-500" />

                <h3
                  className="
                                            text-sm
                                            font-semibold
                                            text-slate-900
                                        "
                >
                  Información del registro
                </h3>
              </div>

              <div
                className="
                                        grid grid-cols-1
                                        gap-5
                                        p-5
                                        md:grid-cols-2
                                    "
              >
                <CampoDetalle
                  label="ID del gasto"
                  value={gasto.id}
                  icon={Hash}
                  mono
                  full
                />

                <CampoDetalle
                  label="Fecha de creación"
                  value={formatearFechaHora(gasto.fecha_creacion)}
                  icon={CalendarDays}
                />

                <CampoDetalle
                  label="Última actualización"
                  value={formatearFechaHora(gasto.fecha_actualizacion)}
                  icon={CalendarDays}
                />
              </div>
            </section>
          </div>
        )}

        {/* =================================================
                    FOOTER
                ================================================= */}

        <div
          className="
                        flex items-center
                        justify-between
                        gap-3
                        border-t
                        border-slate-200
                        bg-slate-50
                        px-6 py-4
                    "
        >
          <div
            className="
                            hidden text-xs
                            text-slate-500
                            sm:block
                        "
          >
            {gasto && `Registro ${gasto.id}`}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
                            ml-auto
                            rounded-lg
                            bg-slate-900
                            px-5 py-2.5
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-slate-800
                        "
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GastoObraDetailModal;
