import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FileText,
  Loader2,
  Pencil,
  ReceiptText,
  Save,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import {
  actualizarGastoObra,
  obtenerGastoObraPorId,
  type ActualizarGastoObraPayload,
  type GastoObra,
  type TipoGastoObra,
} from "../services/gastoObraService";

import type { ObraOption, ControlDiarioOption } from "./CreateGastoObraModal";

/* =====================================================
   PROPS
===================================================== */

interface EditGastoObraModalProps {
  isOpen: boolean;

  gastoId: string | null;

  onClose: () => void;

  onUpdated?: () => void | Promise<void>;

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
   FORM
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

const estadoInicial: FormState = {
  obra_id: "",
  control_diario_id: "",
  tipo: "",
  descripcion: "",
  monto: "",
  fecha: "",
  referencia: "",
  observaciones: "",
};

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

  return "No se pudo actualizar el gasto de obra.";
};

const obtenerFechaInput = (fecha?: string | null) => {
  if (!fecha) {
    return "";
  }

  return fecha.split("T")[0];
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) {
    return "";
  }

  const fechaLimpia = fecha.split("T")[0];

  const partes = fechaLimpia.split("-");

  if (partes.length !== 3) {
    return fechaLimpia;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

/* =====================================================
   COMPONENTE
===================================================== */

const EditGastoObraModal = ({
  isOpen,
  gastoId,
  onClose,
  onUpdated,
  obras,
  controlesDiarios = [],
}: EditGastoObraModalProps) => {
  /* =================================================
       ESTADOS
    ================================================= */

  const [gasto, setGasto] = useState<GastoObra | null>(null);

  const [form, setForm] = useState<FormState>(estadoInicial);

  const [cargando, setCargando] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [errores, setErrores] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  /* =================================================
       CONTROLES FILTRADOS
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
       CARGAR GASTO
    ================================================= */

  useEffect(() => {
    if (!isOpen || !gastoId) {
      return;
    }

    const cargarGasto = async () => {
      try {
        setCargando(true);
        setErrores({});
        setGasto(null);

        const data = await obtenerGastoObraPorId(gastoId);

        setGasto(data);

        setForm({
          obra_id: data.obra_id || "",

          control_diario_id: data.control_diario_id || "",

          tipo: data.tipo || "",

          descripcion: data.descripcion || "",

          monto: String(data.monto ?? ""),

          fecha: obtenerFechaInput(data.fecha),

          referencia: data.referencia || "",

          observaciones: data.observaciones || "",
        });
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

    void cargarGasto();
  }, [isOpen, gastoId, onClose]);

  /* =================================================
       RESET
    ================================================= */

  useEffect(() => {
    if (!isOpen) {
      setGasto(null);
      setForm(estadoInicial);
      setErrores({});
      setCargando(false);
      setGuardando(false);
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
      if (event.key === "Escape" && !guardando) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, guardando, onClose]);

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
       CAMBIO OBRA
    ================================================= */

  const handleObraChange = (obraId: string) => {
    setForm((prev) => ({
      ...prev,
      obra_id: obraId,

      control_diario_id: "",
    }));

    setErrores((prev) => ({
      ...prev,
      obra_id: undefined,

      control_diario_id: undefined,
    }));
  };

  /* =================================================
       VALIDAR
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
       GUARDAR
    ================================================= */

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!gasto || !gastoId || guardando) {
      return;
    }

    if (gasto.estado !== "pendiente") {
      await Swal.fire({
        icon: "warning",
        title: "Gasto no editable",
        text: "Solo los gastos pendientes pueden modificarse.",
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });

      return;
    }

    if (!validarFormulario()) {
      return;
    }

    if (!form.tipo) {
      return;
    }

    const payload: ActualizarGastoObraPayload = {
      obra_id: form.obra_id,

      control_diario_id: form.control_diario_id || null,

      tipo: form.tipo,

      descripcion: form.descripcion.trim(),

      monto: Number(form.monto),

      fecha: form.fecha,

      referencia: form.referencia.trim() || null,

      observaciones: form.observaciones.trim() || null,
    };

    try {
      setGuardando(true);

      await actualizarGastoObra(gastoId, payload);

      await Swal.fire({
        icon: "success",
        title: "Gasto actualizado",
        text: "Los cambios se guardaron correctamente.",
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });

      if (onUpdated) {
        await onUpdated();
      }

      onClose();
    } catch (error) {
      const mensaje = obtenerMensajeError(error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: mensaje,
        confirmButtonText: "Aceptar",
        heightAuto: false,
      });
    } finally {
      setGuardando(false);
    }
  };

  /* =================================================
       CERRAR
    ================================================= */

  const handleClose = () => {
    if (guardando) {
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

  const puedeEditar = gasto?.estado === "pendiente";

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
                                items-center justify-center
                                rounded-xl
                                bg-slate-900
                                text-white
                            "
            >
              <Pencil size={21} />
            </div>

            <div>
              <h2
                className="
                                    text-xl font-semibold
                                    text-slate-900
                                "
              >
                Editar gasto de obra
              </h2>

              <p
                className="
                                    mt-1 text-sm
                                    text-slate-500
                                "
              >
                Modifica la información del gasto mientras se encuentre
                pendiente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={guardando}
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
                    LOADING
                ================================================= */}

        {cargando && (
          <div
            className="
                            flex min-h-[420px]
                            items-center justify-center
                        "
          >
            <div
              className="
                                flex flex-col
                                items-center gap-3
                                text-slate-500
                            "
            >
              <Loader2 size={30} className="animate-spin" />

              <span className="text-sm">Cargando información del gasto...</span>
            </div>
          </div>
        )}

        {/* =================================================
                    CONTENIDO
                ================================================= */}

        {!cargando && gasto && (
          <form
            onSubmit={handleSubmit}
            className="
                                flex min-h-0
                                flex-1 flex-col
                            "
          >
            {/* =================================================
                                AVISO
                            ================================================= */}

            {puedeEditar ? (
              <div
                className="
                                        mx-6 mt-5
                                        flex items-start gap-3
                                        rounded-xl
                                        border border-blue-200
                                        bg-blue-50
                                        px-4 py-3
                                    "
              >
                <AlertCircle
                  size={19}
                  className="
                                            mt-0.5 shrink-0
                                            text-blue-600
                                        "
                />

                <div>
                  <p
                    className="
                                                text-sm font-medium
                                                text-blue-900
                                            "
                  >
                    Gasto pendiente
                  </p>

                  <p
                    className="
                                                mt-0.5 text-xs
                                                leading-5
                                                text-blue-700
                                            "
                  >
                    Puedes modificar este registro porque todavía no existe una
                    transacción financiera asociada.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="
                                        mx-6 mt-5
                                        flex items-start gap-3
                                        rounded-xl
                                        border border-red-200
                                        bg-red-50
                                        px-4 py-3
                                    "
              >
                <AlertCircle
                  size={19}
                  className="
                                            mt-0.5 shrink-0
                                            text-red-600
                                        "
                />

                <div>
                  <p
                    className="
                                                text-sm font-medium
                                                text-red-900
                                            "
                  >
                    Este gasto ya no puede editarse
                  </p>

                  <p
                    className="
                                                mt-0.5 text-xs
                                                leading-5
                                                text-red-700
                                            "
                  >
                    Solo los gastos en estado pendiente pueden modificarse.
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                                DATOS
                            ================================================= */}

            <div
              className="
                                    flex-1 overflow-y-auto
                                    px-6 py-5
                                "
            >
              <div
                className="
                                        grid grid-cols-1
                                        gap-5
                                        md:grid-cols-2
                                    "
              >
                {/* =================================================
                                        OBRA
                                    ================================================= */}

                <div>
                  <label
                    htmlFor="edit-gasto-obra"
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
                                                    absolute left-3
                                                    top-1/2
                                                    -translate-y-1/2
                                                    text-slate-400
                                                "
                    />

                    <select
                      id="edit-gasto-obra"
                      value={form.obra_id}
                      onChange={(event) => handleObraChange(event.target.value)}
                      disabled={guardando || !puedeEditar}
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
                                                    disabled:cursor-not-allowed
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
                </div>

                {/* =================================================
                                        TIPO
                                    ================================================= */}

                <div>
                  <label
                    htmlFor="edit-gasto-tipo"
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
                                                    absolute left-3
                                                    top-1/2
                                                    -translate-y-1/2
                                                    text-slate-400
                                                "
                    />

                    <select
                      id="edit-gasto-tipo"
                      value={form.tipo}
                      onChange={(event) =>
                        actualizarCampo(
                          "tipo",
                          event.target.value as TipoGastoObra | "",
                        )
                      }
                      disabled={guardando || !puedeEditar}
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
                                                    disabled:cursor-not-allowed
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
                                        CONTROL
                                    ================================================= */}

                <div>
                  <label
                    htmlFor="edit-gasto-control"
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
                    id="edit-gasto-control"
                    value={form.control_diario_id}
                    onChange={(event) =>
                      actualizarCampo("control_diario_id", event.target.value)
                    }
                    disabled={guardando || !puedeEditar || !form.obra_id}
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
                </div>

                {/* =================================================
                                        FECHA
                                    ================================================= */}

                <div>
                  <label
                    htmlFor="edit-gasto-fecha"
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
                                                    absolute left-3
                                                    top-1/2
                                                    -translate-y-1/2
                                                    text-slate-400
                                                "
                    />

                    <input
                      id="edit-gasto-fecha"
                      type="date"
                      value={form.fecha}
                      onChange={(event) =>
                        actualizarCampo("fecha", event.target.value)
                      }
                      disabled={guardando || !puedeEditar}
                      className={`
                                                    w-full rounded-lg
                                                    border bg-white
                                                    py-2.5 pl-10 pr-3
                                                    text-sm text-slate-800
                                                    outline-none
                                                    transition
                                                    focus:ring-2
                                                    focus:ring-slate-200
                                                    disabled:cursor-not-allowed
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
                    htmlFor="edit-gasto-monto"
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
                                                    absolute left-3
                                                    top-1/2
                                                    -translate-y-1/2
                                                    text-slate-400
                                                "
                    />

                    <input
                      id="edit-gasto-monto"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={form.monto}
                      onChange={(event) =>
                        actualizarCampo("monto", event.target.value)
                      }
                      disabled={guardando || !puedeEditar}
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
                                                    disabled:cursor-not-allowed
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
                    htmlFor="edit-gasto-referencia"
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
                    id="edit-gasto-referencia"
                    type="text"
                    maxLength={100}
                    placeholder="Factura, recibo, comprobante..."
                    value={form.referencia}
                    onChange={(event) =>
                      actualizarCampo("referencia", event.target.value)
                    }
                    disabled={guardando || !puedeEditar}
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
                    htmlFor="edit-gasto-descripcion"
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
                      id="edit-gasto-descripcion"
                      rows={3}
                      maxLength={500}
                      placeholder="Describe claramente el gasto..."
                      value={form.descripcion}
                      onChange={(event) =>
                        actualizarCampo("descripcion", event.target.value)
                      }
                      disabled={guardando || !puedeEditar}
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
                                                    disabled:cursor-not-allowed
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
                    htmlFor="edit-gasto-observaciones"
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
                    id="edit-gasto-observaciones"
                    rows={3}
                    maxLength={1000}
                    placeholder="Información adicional sobre el gasto..."
                    value={form.observaciones}
                    onChange={(event) =>
                      actualizarCampo("observaciones", event.target.value)
                    }
                    disabled={guardando || !puedeEditar}
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
              <div>
                <p
                  className="
                                            text-xs
                                            text-slate-500
                                        "
                >
                  Estado actual:
                  <span
                    className={`
                                                ml-1 font-semibold
                                                ${
                                                  gasto.estado === "pendiente"
                                                    ? "text-amber-600"
                                                    : gasto.estado === "pagado"
                                                      ? "text-emerald-600"
                                                      : "text-red-600"
                                                }
                                            `}
                  >
                    {gasto.estado}
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
                  disabled={guardando}
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
                  Cerrar
                </button>

                {puedeEditar && (
                  <button
                    type="submit"
                    disabled={guardando}
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
                    {guardando ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Guardar cambios
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditGastoObraModal;
