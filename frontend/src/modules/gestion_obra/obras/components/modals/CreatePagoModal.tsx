import { useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import Swal from "sweetalert2";

import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  DollarSign,
  Info,
  Loader2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { getObraById, type Obra } from "../../services/obrasService";

import { getEmpleadosObra } from "../../services/empleadosObrasService";

import {
  crearPagoDesdeObra,
  existePagoEnPeriodo,
  getPagosEmpleadoObra,
  type PagoEmpleadoObra,
  type TipoPagoEmpleado,
} from "../../services/pagosService";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;

  onClose: () => void;

  onCreated?: () => void | Promise<void>;
}

/* =====================================================
   EMPLEADO ASIGNADO A OBRA
===================================================== */

interface EmpleadoAsignado {
  /*
   * En getEmpleadosObra normalmente id representa
   * el id de empleados_obras, es decir,
   * la asignación.
   */
  id?: string;

  asignacion_id?: string;

  empleado_id: string;

  obra_id?: string;

  nombres?: string;

  apellidos?: string;

  cedula?: string;

  cargo?: string | null;

  cargo_obra?: string | null;

  tipo_pago?: string | null;

  salario_base?: number | string | null;

  salario_acordado?: number | string | null;

  activo?: boolean;
}

/* =====================================================
   FORM
===================================================== */

interface FormState {
  empleado_id: string;

  asignacion_id: string;

  tipo_pago: TipoPagoEmpleado;

  fecha_inicio_periodo: string;

  fecha_fin_periodo: string;

  periodo_descripcion: string;

  monto: string;

  referencia: string;

  observaciones: string;
}

/* =====================================================
   CONSTANTES
===================================================== */

const FORM_INICIAL: FormState = {
  empleado_id: "",

  asignacion_id: "",

  tipo_pago: "semanal",

  fecha_inicio_periodo: "",

  fecha_fin_periodo: "",

  periodo_descripcion: "",

  monto: "",

  referencia: "",

  observaciones: "",
};

const TIPOS_PAGO: {
  value: TipoPagoEmpleado;
  label: string;
  descripcion: string;
}[] = [
  {
    value: "diario",
    label: "Diario",
    descripcion: "Pago correspondiente a una sola jornada.",
  },

  {
    value: "semanal",
    label: "Semanal",
    descripcion: "Pago correspondiente a un período semanal.",
  },

  {
    value: "quincenal",
    label: "Quincenal",
    descripcion: "Pago correspondiente a una quincena.",
  },

  {
    value: "mensual",
    label: "Mensual",
    descripcion: "Pago correspondiente a un período mensual.",
  },

  {
    value: "otro",
    label: "Otro",
    descripcion: "Pago extraordinario u ocasional.",
  },
];

/* =====================================================
   HELPERS
===================================================== */

const obtenerMensajeError = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;

          detail?: string;
        };
      };
    };

    return (
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      "No fue posible registrar el pago."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ha ocurrido un error inesperado.";
};

/* =====================================================
   FORMATEAR MONEDA
===================================================== */

const moneda = (valor: number | string | null | undefined) => {
  const numero = Number(valor ?? 0);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

/* =====================================================
   FORMATEAR FECHA
===================================================== */

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) {
    return "";
  }

  const fechaNormalizada = fecha.includes("T") ? fecha.split("T")[0] : fecha;

  const partes = fechaNormalizada.split("-");

  if (partes.length !== 3) {
    return fechaNormalizada;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

/* =====================================================
   NOMBRE EMPLEADO
===================================================== */

const obtenerNombreEmpleado = (empleado: EmpleadoAsignado) => {
  const nombre = `${empleado.nombres ?? ""} ${empleado.apellidos ?? ""}`.trim();

  return nombre || "Empleado sin nombre";
};

/* =====================================================
   ASIGNACION ID
===================================================== */

const obtenerAsignacionId = (empleado: EmpleadoAsignado) => {
  return empleado.asignacion_id || empleado.id || "";
};

/* =====================================================
   TIPO PAGO VALIDO
===================================================== */

const esTipoPagoValido = (value?: string | null): value is TipoPagoEmpleado => {
  return (
    value === "diario" ||
    value === "semanal" ||
    value === "quincenal" ||
    value === "mensual" ||
    value === "otro"
  );
};

/* =====================================================
   DESCRIPCIÓN AUTOMÁTICA
===================================================== */

const construirDescripcionPeriodo = (
  tipo: TipoPagoEmpleado,

  inicio: string,

  fin: string,
) => {
  if (tipo === "otro" && !inicio && !fin) {
    return "";
  }

  if (!inicio || !fin) {
    return "";
  }

  if (tipo === "diario") {
    return `Jornada ${formatearFecha(inicio)}`;
  }

  if (tipo === "semanal") {
    return `Semana ${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
  }

  if (tipo === "quincenal") {
    return `Quincena ${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
  }

  if (tipo === "mensual") {
    return `Período mensual ${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
  }

  return `Pago ocasional ${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
};

/* =====================================================
   COMPONENTE
===================================================== */

function CreatePagoModal({ open, onClose, onCreated }: Props) {
  const { id: obraId } = useParams<{
    id: string;
  }>();

  /* =================================================
     STATES
  ================================================= */

  const [obra, setObra] = useState<Obra | null>(null);

  const [empleados, setEmpleados] = useState<EmpleadoAsignado[]>([]);

  const [form, setForm] = useState<FormState>(FORM_INICIAL);

  const [loading, setLoading] = useState(false);

  const [loadingData, setLoadingData] = useState(false);

  const [checkingPeriodo, setCheckingPeriodo] = useState(false);

  const [pagoConflicto, setPagoConflicto] = useState<PagoEmpleadoObra | null>(
    null,
  );

  /* =================================================
     EMPLEADO SELECCIONADO
  ================================================= */

  const empleadoSeleccionado = useMemo(() => {
    return (
      empleados.find((empleado) => empleado.empleado_id === form.empleado_id) ??
      null
    );
  }, [empleados, form.empleado_id]);

  /* =================================================
     TIPO ACTUAL
  ================================================= */

  const tipoActual = useMemo(() => {
    return TIPOS_PAGO.find((tipo) => tipo.value === form.tipo_pago);
  }, [form.tipo_pago]);

  /* =================================================
     CARGAR INFORMACIÓN
  ================================================= */

  useEffect(() => {
    if (!open || !obraId) {
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoadingData(true);

        setPagoConflicto(null);

        const [obraData, empleadosData] = await Promise.all([
          getObraById(obraId),

          getEmpleadosObra(obraId),
        ]);

        setObra(obraData);

        const lista = Array.isArray(empleadosData)
          ? (empleadosData as EmpleadoAsignado[])
          : [];

        setEmpleados(lista.filter((empleado) => empleado.activo !== false));

        setForm(FORM_INICIAL);
      } catch (error) {
        console.error("Error cargando información para pago:", error);

        await Swal.fire({
          icon: "error",

          title: "No se pudo preparar el pago",

          text: obtenerMensajeError(error),
        });

        onClose();
      } finally {
        setLoadingData(false);
      }
    };

    void cargarDatos();
  }, [open, obraId, onClose]);

  /* =================================================
     BLOQUEAR SCROLL
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const original = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  /* =================================================
     CERRAR CON ESCAPE
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onClose]);

  /* =================================================
     EMPLEADO CAMBIA
  ================================================= */

  const handleEmpleadoChange = (empleadoId: string) => {
    const empleado = empleados.find((item) => item.empleado_id === empleadoId);

    if (!empleado) {
      setForm((previous) => ({
        ...previous,

        empleado_id: "",

        asignacion_id: "",

        monto: "",
      }));

      setPagoConflicto(null);

      return;
    }

    const salario = Number(
      empleado.salario_acordado ?? empleado.salario_base ?? 0,
    );

    const tipoEmpleado = esTipoPagoValido(empleado.tipo_pago)
      ? empleado.tipo_pago
      : form.tipo_pago;

    setForm((previous) => ({
      ...previous,

      empleado_id: empleado.empleado_id,

      asignacion_id: obtenerAsignacionId(empleado),

      tipo_pago: tipoEmpleado,

      monto: Number.isFinite(salario) && salario > 0 ? salario.toFixed(2) : "",
    }));

    setPagoConflicto(null);
  };

  /* =================================================
     CAMBIAR TIPO PAGO
  ================================================= */

  const handleTipoPagoChange = (tipo: TipoPagoEmpleado) => {
    setPagoConflicto(null);

    setForm((previous) => {
      let fechaFin = previous.fecha_fin_periodo;

      /*
       * Pago diario:
       * inicio y fin deben
       * representar el mismo día.
       */
      if (tipo === "diario" && previous.fecha_inicio_periodo) {
        fechaFin = previous.fecha_inicio_periodo;
      }

      const descripcion = construirDescripcionPeriodo(
        tipo,

        previous.fecha_inicio_periodo,

        fechaFin,
      );

      return {
        ...previous,

        tipo_pago: tipo,

        fecha_fin_periodo: fechaFin,

        periodo_descripcion: descripcion,
      };
    });
  };

  /* =================================================
     CAMBIAR FECHA INICIO
  ================================================= */

  const handleFechaInicioChange = (fecha: string) => {
    setPagoConflicto(null);

    setForm((previous) => {
      const fechaFin =
        previous.tipo_pago === "diario" ? fecha : previous.fecha_fin_periodo;

      return {
        ...previous,

        fecha_inicio_periodo: fecha,

        fecha_fin_periodo: fechaFin,

        periodo_descripcion: construirDescripcionPeriodo(
          previous.tipo_pago,

          fecha,

          fechaFin,
        ),
      };
    });
  };

  /* =================================================
     CAMBIAR FECHA FIN
  ================================================= */

  const handleFechaFinChange = (fecha: string) => {
    setPagoConflicto(null);

    setForm((previous) => ({
      ...previous,

      fecha_fin_periodo: fecha,

      periodo_descripcion: construirDescripcionPeriodo(
        previous.tipo_pago,

        previous.fecha_inicio_periodo,

        fecha,
      ),
    }));
  };

  /* =================================================
     COMPROBAR PERÍODO
  ================================================= */

  useEffect(() => {
    if (!open || !obraId || !form.empleado_id) {
      setPagoConflicto(null);

      return;
    }

    /*
     * Para pagos normales necesitamos
     * ambas fechas.
     */
    if (
      form.tipo_pago !== "otro" &&
      (!form.fecha_inicio_periodo || !form.fecha_fin_periodo)
    ) {
      setPagoConflicto(null);

      return;
    }

    /*
     * Para "otro" sin fechas no existe
     * período que comprobar.
     */
    if (!form.fecha_inicio_periodo || !form.fecha_fin_periodo) {
      setPagoConflicto(null);

      return;
    }

    let activo = true;

    const timer = window.setTimeout(async () => {
      try {
        setCheckingPeriodo(true);

        const pagos = await getPagosEmpleadoObra(
          form.empleado_id,

          obraId,
        );

        if (!activo) {
          return;
        }

        const conflicto = existePagoEnPeriodo(
          pagos,

          form.fecha_inicio_periodo,

          form.fecha_fin_periodo,
        );

        setPagoConflicto(conflicto);
      } catch (error) {
        /*
         * No bloqueamos el formulario si
         * falla esta comprobación frontend.
         *
         * El backend seguirá siendo la
         * protección definitiva.
         */
        console.error("No se pudo comprobar el período:", error);

        if (activo) {
          setPagoConflicto(null);
        }
      } finally {
        if (activo) {
          setCheckingPeriodo(false);
        }
      }
    }, 400);

    return () => {
      activo = false;

      window.clearTimeout(timer);
    };
  }, [
    open,
    obraId,
    form.empleado_id,
    form.tipo_pago,
    form.fecha_inicio_periodo,
    form.fecha_fin_periodo,
  ]);

  /* =================================================
     VALIDAR
  ================================================= */

  const validarFormulario = (): string[] => {
    const errores: string[] = [];

    if (!obraId) {
      errores.push("No se pudo identificar la obra.");
    }

    if (!form.empleado_id) {
      errores.push("Seleccione un empleado.");
    }

    if (!form.asignacion_id) {
      errores.push(
        "El empleado seleccionado no posee una asignación válida en esta obra.",
      );
    }

    const requierePeriodo = form.tipo_pago !== "otro";

    if (requierePeriodo && !form.fecha_inicio_periodo) {
      errores.push("Ingrese la fecha de inicio del período.");
    }

    if (requierePeriodo && !form.fecha_fin_periodo) {
      errores.push("Ingrese la fecha de fin del período.");
    }

    if (
      (form.fecha_inicio_periodo && !form.fecha_fin_periodo) ||
      (!form.fecha_inicio_periodo && form.fecha_fin_periodo)
    ) {
      errores.push("Debe indicar ambas fechas del período.");
    }

    if (
      form.fecha_inicio_periodo &&
      form.fecha_fin_periodo &&
      form.fecha_fin_periodo < form.fecha_inicio_periodo
    ) {
      errores.push("La fecha final no puede ser anterior a la fecha inicial.");
    }

    if (
      form.tipo_pago === "diario" &&
      form.fecha_inicio_periodo &&
      form.fecha_fin_periodo &&
      form.fecha_inicio_periodo !== form.fecha_fin_periodo
    ) {
      errores.push("El pago diario debe corresponder a una sola fecha.");
    }

    if (!form.periodo_descripcion.trim()) {
      errores.push("Ingrese la descripción del período.");
    }

    const monto = Number(form.monto);

    if (!Number.isFinite(monto) || monto <= 0) {
      errores.push("Ingrese un monto mayor a cero.");
    }

    if (pagoConflicto) {
      errores.push(
        "El período seleccionado ya está cubierto total o parcialmente por otro pago.",
      );
    }

    return errores;
  };

  /* =================================================
     SUBMIT
  ================================================= */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading || !obraId) {
      return;
    }

    const errores = validarFormulario();

    if (errores.length > 0) {
      await Swal.fire({
        icon: "warning",

        title: "Revise el formulario",

        html: `
            <div style="
              text-align:left;
              line-height:1.7;
            ">
              ${errores.map((error) => `<div>• ${error}</div>`).join("")}
            </div>
          `,
      });

      return;
    }

    try {
      setLoading(true);

      const pago = await crearPagoDesdeObra({
        empleado_id: form.empleado_id,

        obra_id: obraId,

        asignacion_id: form.asignacion_id,

        tipo_pago: form.tipo_pago,

        periodo_descripcion: form.periodo_descripcion.trim(),

        fecha_inicio_periodo: form.fecha_inicio_periodo || null,

        fecha_fin_periodo: form.fecha_fin_periodo || null,

        monto: Number(form.monto),

        referencia: form.referencia.trim() || null,

        observaciones: form.observaciones.trim() || null,
      });

      await Swal.fire({
        icon: "success",

        title: "Pago registrado",

        text: `Se registró una obligación de ${moneda(
          pago.monto,
        )}. El pago permanece pendiente y todavía no afecta ninguna cuenta financiera.`,

        confirmButtonText: "Aceptar",
      });

      setForm(FORM_INICIAL);

      setPagoConflicto(null);

      if (onCreated) {
        await onCreated();
      }

      onClose();
    } catch (error) {
      console.error("Error registrando pago desde obra:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo registrar el pago",

        text: obtenerMensajeError(error),

        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =================================================
     NO RENDER
  ================================================= */

  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-3xl
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

        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <WalletCards size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Registrar pago de empleado
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registra una obligación de pago vinculada a esta obra.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={19} />
          </button>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="flex-1 overflow-y-auto">
          {loadingData ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={30} className="animate-spin" />

              <p className="text-sm">Cargando personal de la obra...</p>
            </div>
          ) : (
            <form
              id="form-pago-obra"
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              {/* =============================================
                  AVISO FINANCIERO
              ============================================= */}

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />

                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Registro pendiente
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Registrar este pago no descuenta dinero. El movimiento
                      financiero solamente se generará al confirmar el pago
                      desde el módulo de Pagos Empleados.
                    </p>
                  </div>
                </div>
              </div>

              {/* =============================================
                  OBRA
              ============================================= */}

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <BriefcaseBusiness size={17} className="text-amber-600" />

                  <h3 className="text-sm font-bold text-slate-800">Obra</h3>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    {obra?.nombre || "Obra"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Código: {obra?.codigo || "—"}
                  </p>
                </div>
              </section>

              <div className="border-t border-slate-200" />

              {/* =============================================
                  EMPLEADO
              ============================================= */}

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <UserRound size={17} className="text-amber-600" />

                  <h3 className="text-sm font-bold text-slate-800">Empleado</h3>
                </div>

                {empleados.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle
                        size={20}
                        className="shrink-0 text-amber-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          No hay empleados disponibles
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-700">
                          Primero debe asignar un empleado activo a esta obra.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Empleado *
                    </label>

                    <select
                      value={form.empleado_id}
                      onChange={(event) =>
                        handleEmpleadoChange(event.target.value)
                      }
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:bg-slate-100"
                    >
                      <option value="">Seleccione un empleado</option>

                      {empleados.map((empleado) => (
                        <option
                          key={
                            obtenerAsignacionId(empleado) ||
                            empleado.empleado_id
                          }
                          value={empleado.empleado_id}
                        >
                          {obtenerNombreEmpleado(empleado)}

                          {empleado.cargo_obra
                            ? ` - ${empleado.cargo_obra}`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {empleadoSeleccionado && (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Cargo</p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {empleadoSeleccionado.cargo_obra ||
                              empleadoSeleccionado.cargo ||
                              "No registrado"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Salario acordado
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {moneda(
                              empleadoSeleccionado.salario_acordado ??
                                empleadoSeleccionado.salario_base,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Tipo habitual
                          </p>

                          <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                            {empleadoSeleccionado.tipo_pago || "No definido"}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              <div className="border-t border-slate-200" />

              {/* =============================================
                  TIPO Y MONTO
              ============================================= */}

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <DollarSign size={17} className="text-amber-600" />

                  <h3 className="text-sm font-bold text-slate-800">
                    Información del pago
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Tipo de pago *
                    </label>

                    <select
                      value={form.tipo_pago}
                      onChange={(event) =>
                        handleTipoPagoChange(
                          event.target.value as TipoPagoEmpleado,
                        )
                      }
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)]"
                    >
                      {TIPOS_PAGO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1 text-xs text-slate-400">
                      {tipoActual?.descripcion}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Monto *
                    </label>

                    <div className="relative">
                      <CircleDollarSign
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.monto}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,

                            monto: event.target.value,
                          }))
                        }
                        disabled={loading}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
                      />
                    </div>

                    {empleadoSeleccionado &&
                      Number(empleadoSeleccionado.salario_acordado ?? 0) >
                        0 && (
                        <p className="mt-1 text-xs text-slate-400">
                          Valor sugerido desde la asignación:{" "}
                          {moneda(empleadoSeleccionado.salario_acordado)}
                        </p>
                      )}
                  </div>
                </div>
              </section>

              {/* =============================================
                  PERÍODO
              ============================================= */}

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays size={17} className="text-amber-600" />

                  <h3 className="text-sm font-bold text-slate-800">
                    Período pagado
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Inicio {form.tipo_pago !== "otro" ? "*" : ""}
                    </label>

                    <input
                      type="date"
                      value={form.fecha_inicio_periodo}
                      onChange={(event) =>
                        handleFechaInicioChange(event.target.value)
                      }
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Fin {form.tipo_pago !== "otro" ? "*" : ""}
                    </label>

                    <input
                      type="date"
                      value={form.fecha_fin_periodo}
                      onChange={(event) =>
                        handleFechaFinChange(event.target.value)
                      }
                      disabled={loading || form.tipo_pago === "diario"}
                      min={form.fecha_inicio_periodo || undefined}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)] disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* COMPROBANDO */}

                {checkingPeriodo && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <Loader2 size={15} className="animate-spin" />
                    Comprobando si este período ya fue registrado...
                  </div>
                )}

                {/* CONFLICTO */}

                {!checkingPeriodo && pagoConflicto && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle
                        size={20}
                        className="shrink-0 text-rose-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-rose-900">
                          Período ocupado
                        </p>

                        <p className="mt-1 text-xs leading-5 text-rose-700">
                          Ya existe un pago{" "}
                          <strong>{pagoConflicto.estado}</strong> para este
                          empleado que cubre{" "}
                          {formatearFecha(pagoConflicto.fecha_inicio_periodo)} -{" "}
                          {formatearFecha(pagoConflicto.fecha_fin_periodo)}.
                        </p>

                        <p className="mt-1 text-xs font-medium text-rose-800">
                          {pagoConflicto.periodo_descripcion} —{" "}
                          {moneda(pagoConflicto.monto)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* DISPONIBLE */}

                {!checkingPeriodo &&
                  !pagoConflicto &&
                  form.empleado_id &&
                  form.fecha_inicio_periodo &&
                  form.fecha_fin_periodo && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={16} />
                      El período seleccionado está disponible.
                    </div>
                  )}
              </section>

              {/* =============================================
                  DESCRIPCIÓN
              ============================================= */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Descripción del período *
                </label>

                <input
                  type="text"
                  maxLength={100}
                  value={form.periodo_descripcion}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,

                      periodo_descripcion: event.target.value,
                    }))
                  }
                  disabled={loading}
                  placeholder="Ej. Semana 07/09/2026 - 13/09/2026"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)]"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Se genera automáticamente, pero puede modificarse si es
                  necesario.
                </p>
              </div>

              {/* =============================================
                  REFERENCIA
              ============================================= */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Referencia
                </label>

                <input
                  type="text"
                  maxLength={100}
                  value={form.referencia}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,

                      referencia: event.target.value,
                    }))
                  }
                  disabled={loading}
                  placeholder="Ej. Pago semana 36"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)]"
                />
              </div>

              {/* =============================================
                  OBSERVACIONES
              ============================================= */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Observaciones
                </label>

                <textarea
                  rows={3}
                  maxLength={1000}
                  value={form.observaciones}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,

                      observaciones: event.target.value,
                    }))
                  }
                  disabled={loading}
                  placeholder="Detalles adicionales del pago..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)]"
                />
              </div>

              {/* =============================================
                  REGLA
              ============================================= */}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Clock3 size={19} className="shrink-0 text-amber-600" />

                  <p className="text-xs leading-5 text-amber-800">
                    Un período con pago <strong>pendiente</strong> o{" "}
                    <strong>pagado</strong> no puede registrarse nuevamente. Los
                    pagos anulados no bloquean el período.
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <div className="hidden text-xs text-slate-400 sm:block">
            El pago se guardará como pendiente.
          </div>

          <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              form="form-pago-obra"
              disabled={
                loading ||
                loadingData ||
                checkingPeriodo ||
                empleados.length === 0 ||
                Boolean(pagoConflicto)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <WalletCards size={17} />
                  Registrar pago
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePagoModal;
