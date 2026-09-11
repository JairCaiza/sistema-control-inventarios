import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FileText,
  Loader2,
  PlusCircle,
  ReceiptText,
  Save,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import {
  crearGastoObra,
  type CrearGastoObraPayload,
  type TipoGastoObra,
} from "../services/gastoObraService";

/* =====================================================
   TIPOS AUXILIARES
===================================================== */

export interface ObraOption {
  id: string;
  codigo?: string | null;
  nombre: string;
  estado?: string | null;
}

export interface ControlDiarioOption {
  id: string;
  obra_id: string;
  fecha?: string | null;
  actividad?: string | null;
  descripcion?: string | null;
}

interface CreateGastoObraModalProps {
  isOpen: boolean;

  onClose: () => void;

  onCreated?: () => void | Promise<void>;

  obras: ObraOption[];

  controlesDiarios?: ControlDiarioOption[];
}

/* =====================================================
   TIPOS DE GASTO
===================================================== */

const TIPOS_GASTO: Array<{
  value: TipoGastoObra;
  label: string;
}> = [
  {
    value: "materiales",
    label: "Materiales",
  },
  {
    value: "transporte",
    label: "Transporte",
  },
  {
    value: "alimentacion",
    label: "Alimentación",
  },
  {
    value: "combustible",
    label: "Combustible",
  },
  {
    value: "herramientas",
    label: "Herramientas",
  },
  {
    value: "servicios",
    label: "Servicios",
  },
  {
    value: "mantenimiento",
    label: "Mantenimiento",
  },
  {
    value: "administrativo",
    label: "Administrativo",
  },
  {
    value: "otro",
    label: "Otro",
  },
];

/* =====================================================
   ESTADO INICIAL
===================================================== */

interface FormState {
  obra_id: string;
  control_diario_id: string;
  tipo: TipoGastoObra | "";
  descripcion: string;
  monto: string;
  fecha: string;
  referencia: string;
  observaciones: string;
}

const obtenerFechaActual = () => {
  const fecha = new Date();

  const year = fecha.getFullYear();

  const month = String(fecha.getMonth() + 1).padStart(2, "0");

  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const crearEstadoInicial = (): FormState => ({
  obra_id: "",
  control_diario_id: "",
  tipo: "",
  descripcion: "",
  monto: "",
  fecha: obtenerFechaActual(),
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

  return "No se pudo registrar el gasto de obra.";
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) {
    return "";
  }

  const partes = fecha.split("T")[0].split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

/* =====================================================
   COMPONENTE
===================================================== */

const CreateGastoObraModal = ({
  isOpen,
  onClose,
  onCreated,
  obras,
  controlesDiarios = [],
}: CreateGastoObraModalProps) => {
  /* =================================================
       STATE
    ================================================= */

  const [form, setForm] = useState<FormState>(crearEstadoInicial());

  const [enviando, setEnviando] = useState(false);

  const [errores, setErrores] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  /* =================================================
       CONTROLES DE LA OBRA SELECCIONADA
    ================================================= */

  const controlesFiltrados = useMemo(() => {
    if (!form.obra_id) {
      return [];
    }

    return controlesDiarios.filter(
      (control) => control.obra_id === form.obra_id,
    );
  }, [controlesDiarios, form.obra_id]);

  /* =================================================
       RESET AL ABRIR / CERRAR
    ================================================= */

  useEffect(() => {
    if (isOpen) {
      setForm(crearEstadoInicial());

      setErrores({});
      setEnviando(false);
    }
  }, [isOpen]);

  /* =================================================
       BLOQUEAR SCROLL DEL BODY
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
       ESC PARA CERRAR
    ================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !enviando) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, enviando, onClose]);

  /* =================================================
       CAMBIAR CAMPO
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
       CAMBIO DE OBRA
    ================================================= */

  const handleObraChange = (obraId: string) => {
    setForm((prev) => ({
      ...prev,
      obra_id: obraId,

      /*
       * Al cambiar la obra eliminamos
       * cualquier control diario anterior.
       */
      control_diario_id: "",
    }));

    setErrores((prev) => ({
      ...prev,
      obra_id: undefined,
      control_diario_id: undefined,
    }));
  };

  /* =================================================
       VALIDAR FORMULARIO
    ================================================= */

  const validarFormulario = () => {
    const nuevosErrores: Partial<Record<keyof FormState, string>> = {};

    if (!form.obra_id) {
      nuevosErrores.obra_id = "Seleccione una obra.";
    }

    if (!form.tipo) {
      nuevosErrores.tipo = "Seleccione un tipo de gasto.";
    }

    const descripcion = form.descripcion.trim();

    if (!descripcion) {
      nuevosErrores.descripcion = "La descripción es obligatoria.";
    } else if (descripcion.length < 3) {
      nuevosErrores.descripcion =
        "La descripción debe tener al menos 3 caracteres.";
    } else if (descripcion.length > 500) {
      nuevosErrores.descripcion =
        "La descripción no puede superar los 500 caracteres.";
    }

    if (!form.monto.trim()) {
      nuevosErrores.monto = "El monto es obligatorio.";
    } else {
      const monto = Number(form.monto);

      if (!Number.isFinite(monto) || monto <= 0) {
        nuevosErrores.monto = "El monto debe ser mayor a cero.";
      }
    }

    if (!form.fecha) {
      nuevosErrores.fecha = "La fecha es obligatoria.";
    }

    if (form.referencia.trim().length > 100) {
      nuevosErrores.referencia =
        "La referencia no puede superar los 100 caracteres.";
    }

    if (form.observaciones.trim().length > 1000) {
      nuevosErrores.observaciones =
        "Las observaciones no pueden superar los 1000 caracteres.";
    }

    /*
     * Protección adicional:
     * si eligió un control, verificamos
     * que siga perteneciendo a la obra.
     */

    if (form.control_diario_id) {
      const controlValido = controlesFiltrados.some(
        (control) => control.id === form.control_diario_id,
      );

      if (!controlValido) {
        nuevosErrores.control_diario_id =
          "El control diario no pertenece a la obra seleccionada.";
      }
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  /* =================================================
       SUBMIT
    ================================================= */

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (enviando) {
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    if (!form.tipo) {
      return;
    }

    const monto = Number(form.monto);

    const payload: CrearGastoObraPayload = {
      obra_id: form.obra_id,

      control_diario_id: form.control_diario_id || null,

      tipo: form.tipo,

      descripcion: form.descripcion.trim(),

      monto,

      fecha: form.fecha,

      referencia: form.referencia.trim() || null,

      observaciones: form.observaciones.trim() || null,
    };

    try {
      setEnviando(true);

      await crearGastoObra(payload);

      await Swal.fire({
        icon: "success",
        title: "Gasto registrado",
        text: "El gasto de obra se registró correctamente y quedó pendiente de confirmación.",
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });

      setForm(crearEstadoInicial());

      setErrores({});

      if (onCreated) {
        await onCreated();
      }

      onClose();
    } catch (error) {
      const mensaje = obtenerMensajeError(error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        text: mensaje,
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });
    } finally {
      setEnviando(false);
    }
  };

  /* =================================================
       CERRAR
    ================================================= */

  const handleClose = () => {
    if (enviando) {
      return;
    }

    onClose();
  };

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
                    w-full max-w-4xl
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
                        flex items-start justify-between
                        border-b border-slate-200
                        px-6 py-5
                    "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                                flex h-11 w-11
                                shrink-0 items-center justify-center
                                rounded-xl
                                bg-slate-900
                                text-white
                            "
            >
              <PlusCircle size={22} />
            </div>

            <div>
              <h2
                className="
                                    text-xl font-semibold
                                    text-slate-900
                                "
              >
                Registrar gasto de obra
              </h2>

              <p
                className="
                                    mt-1 text-sm
                                    text-slate-500
                                "
              >
                Registra un nuevo gasto operativo asociado a una obra.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={enviando}
            className="
                            rounded-lg p-2
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
            title="Cerrar"
          >
            <X size={21} />
          </button>
        </div>

        {/* =================================================
                    AVISO
                ================================================= */}

        <div
          className="
                        mx-6 mt-5
                        flex items-start gap-3
                        rounded-xl
                        border border-amber-200
                        bg-amber-50
                        px-4 py-3
                    "
        >
          <AlertCircle
            size={19}
            className="
                            mt-0.5 shrink-0
                            text-amber-600
                        "
          />

          <div>
            <p
              className="
                                text-sm font-medium
                                text-amber-900
                            "
            >
              Este registro no mueve dinero todavía
            </p>

            <p
              className="
                                mt-0.5 text-xs
                                leading-5
                                text-amber-700
                            "
            >
              El gasto se guardará en estado pendiente. El saldo de una cuenta
              financiera solo se descontará cuando posteriormente confirmes el
              pago.
            </p>
          </div>
        </div>

        {/* =================================================
                    FORM
                ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="
                        flex min-h-0 flex-1
                        flex-col
                    "
        >
          <div
            className="
                            flex-1 overflow-y-auto
                            px-6 py-5
                        "
          >
            <div
              className="
                                grid grid-cols-1
                                gap-5 md:grid-cols-2
                            "
            >
              {/* =================================================
                                OBRA
                            ================================================= */}

              <div className="md:col-span-1">
                <label
                  htmlFor="gasto-obra"
                  className="
                                        mb-1.5 block
                                        text-sm font-medium
                                        text-slate-700
                                    "
                >
                  Obra
                  <span className="text-red-500"> *</span>
                </label>

                <div className="relative">
                  <ClipboardList
                    size={18}
                    className="
                                            pointer-events-none
                                            absolute left-3 top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                  />

                  <select
                    id="gasto-obra"
                    value={form.obra_id}
                    onChange={(event) => handleObraChange(event.target.value)}
                    disabled={enviando}
                    className={`
                                            w-full appearance-none
                                            rounded-lg border
                                            bg-white
                                            py-2.5 pl-10 pr-9
                                            text-sm text-slate-800
                                            outline-none
                                            transition
                                            focus:ring-2
                                            focus:ring-slate-200
                                            disabled:bg-slate-100
                                            ${
                                              errores.obra_id
                                                ? "border-red-400"
                                                : "border-slate-300 focus:border-slate-500"
                                            }
                                        `}
                  >
                    <option value="">Seleccione una obra</option>

                    {obras.map((obra) => (
                      <option key={obra.id} value={obra.id}>
                        {obra.codigo ? `${obra.codigo} - ` : ""}
                        {obra.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {errores.obra_id && (
                  <p
                    className="
                                            mt-1 text-xs
                                            text-red-600
                                        "
                  >
                    {errores.obra_id}
                  </p>
                )}

                {obras.length === 0 && (
                  <p
                    className="
                                            mt-1 text-xs
                                            text-amber-600
                                        "
                  >
                    No existen obras disponibles para seleccionar.
                  </p>
                )}
              </div>

              {/* =================================================
                                TIPO
                            ================================================= */}

              <div>
                <label
                  htmlFor="gasto-tipo"
                  className="
                                        mb-1.5 block
                                        text-sm font-medium
                                        text-slate-700
                                    "
                >
                  Tipo de gasto
                  <span className="text-red-500"> *</span>
                </label>

                <div className="relative">
                  <ReceiptText
                    size={18}
                    className="
                                            pointer-events-none
                                            absolute left-3 top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                  />

                  <select
                    id="gasto-tipo"
                    value={form.tipo}
                    onChange={(event) =>
                      actualizarCampo(
                        "tipo",
                        event.target.value as TipoGastoObra | "",
                      )
                    }
                    disabled={enviando}
                    className={`
                                            w-full appearance-none
                                            rounded-lg border
                                            bg-white
                                            py-2.5 pl-10 pr-9
                                            text-sm text-slate-800
                                            outline-none
                                            transition
                                            focus:ring-2
                                            focus:ring-slate-200
                                            disabled:bg-slate-100
                                            ${
                                              errores.tipo
                                                ? "border-red-400"
                                                : "border-slate-300 focus:border-slate-500"
                                            }
                                        `}
                  >
                    <option value="">Seleccione un tipo</option>

                    {TIPOS_GASTO.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {errores.tipo && (
                  <p className="mt-1 text-xs text-red-600">{errores.tipo}</p>
                )}
              </div>

              {/* =================================================
                                CONTROL DIARIO
                            ================================================= */}

              <div>
                <label
                  htmlFor="gasto-control"
                  className="
                                        mb-1.5 block
                                        text-sm font-medium
                                        text-slate-700
                                    "
                >
                  Control diario
                  <span
                    className="
                                            ml-1 font-normal
                                            text-slate-400
                                        "
                  >
                    (opcional)
                  </span>
                </label>

                <select
                  id="gasto-control"
                  value={form.control_diario_id}
                  onChange={(event) =>
                    actualizarCampo("control_diario_id", event.target.value)
                  }
                  disabled={enviando || !form.obra_id}
                  className={`
                                        w-full rounded-lg
                                        border bg-white
                                        px-3 py-2.5
                                        text-sm text-slate-800
                                        outline-none
                                        transition
                                        focus:ring-2
                                        focus:ring-slate-200
                                        disabled:cursor-not-allowed
                                        disabled:bg-slate-100
                                        disabled:text-slate-400
                                        ${
                                          errores.control_diario_id
                                            ? "border-red-400"
                                            : "border-slate-300 focus:border-slate-500"
                                        }
                                    `}
                >
                  <option value="">
                    {!form.obra_id
                      ? "Seleccione primero una obra"
                      : "Sin control diario"}
                  </option>

                  {controlesFiltrados.map((control) => (
                    <option key={control.id} value={control.id}>
                      {control.fecha
                        ? `${formatearFecha(control.fecha)} - `
                        : ""}
                      {control.actividad ||
                        control.descripcion ||
                        "Control diario"}
                    </option>
                  ))}
                </select>

                {errores.control_diario_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {errores.control_diario_id}
                  </p>
                )}

                {form.obra_id && controlesFiltrados.length === 0 && (
                  <p
                    className="
                                                mt-1 text-xs
                                                text-slate-500
                                            "
                  >
                    La obra seleccionada no tiene controles diarios disponibles.
                  </p>
                )}
              </div>

              {/* =================================================
                                FECHA
                            ================================================= */}

              <div>
                <label
                  htmlFor="gasto-fecha"
                  className="
                                        mb-1.5 block
                                        text-sm font-medium
                                        text-slate-700
                                    "
                >
                  Fecha del gasto
                  <span className="text-red-500"> *</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="
                                            pointer-events-none
                                            absolute left-3 top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                  />

                  <input
                    id="gasto-fecha"
                    type="date"
                    value={form.fecha}
                    onChange={(event) =>
                      actualizarCampo("fecha", event.target.value)
                    }
                    disabled={enviando}
                    className={`
                                            w-full rounded-lg
                                            border bg-white
                                            py-2.5 pl-10 pr-3
                                            text-sm text-slate-800
                                            outline-none
                                            transition
                                            focus:ring-2
                                            focus:ring-slate-200
                                            disabled:bg-slate-100
                                            ${
                                              errores.fecha
                                                ? "border-red-400"
                                                : "border-slate-300 focus:border-slate-500"
                                            }
                                        `}
                  />
                </div>

                {errores.fecha && (
                  <p className="mt-1 text-xs text-red-600">{errores.fecha}</p>
                )}
              </div>

              {/* =================================================
                                MONTO
                            ================================================= */}

              <div>
                <label
                  htmlFor="gasto-monto"
                  className="
                                        mb-1.5 block
                                        text-sm font-medium
                                        text-slate-700
                                    "
                >
                  Monto
                  <span className="text-red-500"> *</span>
                </label>

                <div className="relative">
                  <DollarSign
                    size={18}
                    className="
                                            pointer-events-none
                                            absolute left-3 top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                  />

                  <input
                    id="gasto-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.monto}
                    onChange={(event) =>
                      actualizarCampo("monto", event.target.value)
                    }
                    disabled={enviando}
                    className={`
                                            w-full rounded-lg
                                            border bg-white
                                            py-2.5 pl-10 pr-3
                                            text-sm text-slate-800
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:ring-2
                                            focus:ring-slate-200
                                            disabled:bg-slate-100
                                            ${
                                              errores.monto
                                                ? "border-red-400"
                                                : "border-slate-300 focus:border-slate-500"
                                            }
                                        `}
                  />
                </div>

                {errores.monto && (
                  <p className="mt-1 text-xs text-red-600">{errores.monto}</p>
                )}
              </div>

              {/* =================================================
                                REFERENCIA
                            ================================================= */}

              <div>
                <label
                  htmlFor="gasto-referencia"
                  className="
                                        mb-1.5 block
                                        text-sm font-medium
                                        text-slate-700
                                    "
                >
                  Referencia
                  <span
                    className="
                                            ml-1 font-normal
                                            text-slate-400
                                        "
                  >
                    (opcional)
                  </span>
                </label>

                <input
                  id="gasto-referencia"
                  type="text"
                  maxLength={100}
                  placeholder="Factura, recibo, comprobante..."
                  value={form.referencia}
                  onChange={(event) =>
                    actualizarCampo("referencia", event.target.value)
                  }
                  disabled={enviando}
                  className={`
                                        w-full rounded-lg
                                        border bg-white
                                        px-3 py-2.5
                                        text-sm text-slate-800
                                        outline-none
                                        transition
                                        placeholder:text-slate-400
                                        focus:ring-2
                                        focus:ring-slate-200
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
                      <p className="text-xs text-red-600">
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
                                DESCRIPCIÓN
                            ================================================= */}

              <div className="md:col-span-2">
                <label
                  htmlFor="gasto-descripcion"
                  className="
                                        mb-1.5 block
                                        text-sm font-medium
                                        text-slate-700
                                    "
                >
                  Descripción
                  <span className="text-red-500"> *</span>
                </label>

                <div className="relative">
                  <FileText
                    size={18}
                    className="
                                            pointer-events-none
                                            absolute left-3 top-3
                                            text-slate-400
                                        "
                  />

                  <textarea
                    id="gasto-descripcion"
                    rows={3}
                    maxLength={500}
                    placeholder="Describe claramente el gasto realizado..."
                    value={form.descripcion}
                    onChange={(event) =>
                      actualizarCampo("descripcion", event.target.value)
                    }
                    disabled={enviando}
                    className={`
                                            w-full resize-none
                                            rounded-lg border
                                            bg-white
                                            py-2.5 pl-10 pr-3
                                            text-sm text-slate-800
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:ring-2
                                            focus:ring-slate-200
                                            disabled:bg-slate-100
                                            ${
                                              errores.descripcion
                                                ? "border-red-400"
                                                : "border-slate-300 focus:border-slate-500"
                                            }
                                        `}
                  />
                </div>

                <div
                  className="
                                        mt-1 flex
                                        justify-between gap-4
                                    "
                >
                  <div>
                    {errores.descripcion && (
                      <p className="text-xs text-red-600">
                        {errores.descripcion}
                      </p>
                    )}
                  </div>

                  <span
                    className="
                                            shrink-0 text-xs
                                            text-slate-400
                                        "
                  >
                    {form.descripcion.length}/500
                  </span>
                </div>
              </div>

              {/* =================================================
                                OBSERVACIONES
                            ================================================= */}

              <div className="md:col-span-2">
                <label
                  htmlFor="gasto-observaciones"
                  className="
                                        mb-1.5 block
                                        text-sm font-medium
                                        text-slate-700
                                    "
                >
                  Observaciones
                  <span
                    className="
                                            ml-1 font-normal
                                            text-slate-400
                                        "
                  >
                    (opcional)
                  </span>
                </label>

                <textarea
                  id="gasto-observaciones"
                  rows={3}
                  maxLength={1000}
                  placeholder="Información adicional sobre el gasto..."
                  value={form.observaciones}
                  onChange={(event) =>
                    actualizarCampo("observaciones", event.target.value)
                  }
                  disabled={enviando}
                  className={`
                                        w-full resize-none
                                        rounded-lg border
                                        bg-white
                                        px-3 py-2.5
                                        text-sm text-slate-800
                                        outline-none
                                        transition
                                        placeholder:text-slate-400
                                        focus:ring-2
                                        focus:ring-slate-200
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
                                        justify-between gap-4
                                    "
                >
                  <div>
                    {errores.observaciones && (
                      <p className="text-xs text-red-600">
                        {errores.observaciones}
                      </p>
                    )}
                  </div>

                  <span
                    className="
                                            shrink-0 text-xs
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
                            border-t border-slate-200
                            bg-slate-50
                            px-6 py-4
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                        "
          >
            <p
              className="
                                text-xs
                                text-slate-500
                            "
            >
              Los campos marcados con
              <span className="font-semibold text-red-500"> *</span> son
              obligatorios.
            </p>

            <div
              className="
                                flex items-center
                                justify-end gap-3
                            "
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={enviando}
                className="
                                    rounded-lg
                                    border border-slate-300
                                    bg-white
                                    px-4 py-2.5
                                    text-sm font-medium
                                    text-slate-700
                                    transition
                                    hover:bg-slate-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={enviando || obras.length === 0}
                className="
                                    inline-flex
                                    items-center justify-center
                                    gap-2
                                    rounded-lg
                                    bg-slate-900
                                    px-5 py-2.5
                                    text-sm font-medium
                                    text-white
                                    transition
                                    hover:bg-slate-800
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
              >
                {enviando ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Registrar gasto
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGastoObraModal;
