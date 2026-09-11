import { useEffect, useMemo, useState } from "react";

import {
  X,
  UserRound,
  Building2,
  CalendarDays,
  DollarSign,
  FileText,
  Loader2,
  Save,
  BriefcaseBusiness,
  WalletCards,
  Info,
} from "lucide-react";

import Swal from "sweetalert2";

import { getEmpleados, type Empleado } from "../services/empleadosService";

import {
  createPagoEmpleado,
  getAsignacionesPagoEmpleado,
  type AsignacionPagoEmpleado,
  type CrearPagoEmpleadoPayload,
  type TipoPagoEmpleado,
} from "../services/pagoEmpleadoService";

import { api } from "../../../../services/api";

/* =====================================================
   TYPES
===================================================== */

interface CreatePagoEmpleadoModalProps {
  isOpen: boolean;

  onClose: () => void;

  onCreated?: () => void | Promise<void>;
}

interface Obra {
  id: string;

  codigo?: string;

  nombre: string;

  estado?: string;

  activo?: boolean;
}

interface FormPagoEmpleado {
  empleado_id: string;

  obra_id: string;

  asignacion_id: string;

  tipo_pago: TipoPagoEmpleado;

  periodo_descripcion: string;

  fecha_inicio_periodo: string;

  fecha_fin_periodo: string;

  monto: string;

  referencia: string;

  observaciones: string;
}

/* =====================================================
   INITIAL FORM
===================================================== */

const INITIAL_FORM: FormPagoEmpleado = {
  empleado_id: "",

  obra_id: "",

  asignacion_id: "",

  tipo_pago: "semanal",

  periodo_descripcion: "",

  fecha_inicio_periodo: "",

  fecha_fin_periodo: "",

  monto: "",

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

    const mensaje = axiosError.response?.data?.message;

    const errores = axiosError.response?.data?.errors;

    if (Array.isArray(errores) && errores.length > 0) {
      const detalle = errores
        .map((item) => item.mensaje)
        .filter(Boolean)
        .join("\n");

      if (detalle) {
        return mensaje ? `${mensaje}\n\n${detalle}` : detalle;
      }
    }

    if (mensaje) {
      return mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
};

/* =====================================================
   COMPONENT
===================================================== */

function CreatePagoEmpleadoModal({
  isOpen,
  onClose,
  onCreated,
}: CreatePagoEmpleadoModalProps) {
  /* ===================================================
     STATES
  =================================================== */

  const [form, setForm] = useState<FormPagoEmpleado>(INITIAL_FORM);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  const [obras, setObras] = useState<Obra[]>([]);

  const [asignaciones, setAsignaciones] = useState<AsignacionPagoEmpleado[]>(
    [],
  );

  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  const [loadingAsignaciones, setLoadingAsignaciones] = useState(false);

  const [errorAsignacion, setErrorAsignacion] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  /* ===================================================
     EMPLEADO SELECCIONADO
  =================================================== */

  const empleadoSeleccionado = useMemo(() => {
    return empleados.find((empleado) => empleado.id === form.empleado_id);
  }, [empleados, form.empleado_id]);

  /* ===================================================
     OBRA SELECCIONADA
  =================================================== */

  const obraSeleccionada = useMemo(() => {
    return obras.find((obra) => obra.id === form.obra_id);
  }, [obras, form.obra_id]);

  /* ===================================================
     ASIGNACIÓN SELECCIONADA
  =================================================== */

  const asignacionSeleccionada = useMemo(() => {
    return asignaciones.find(
      (asignacion) => asignacion.id === form.asignacion_id,
    );
  }, [asignaciones, form.asignacion_id]);

  /* ===================================================
     RESET
  =================================================== */

  const resetForm = () => {
    setForm(INITIAL_FORM);

    setAsignaciones([]);

    setErrorAsignacion(null);
  };

  /* ===================================================
     CERRAR
  =================================================== */

  const handleClose = () => {
    if (saving) {
      return;
    }

    resetForm();

    onClose();
  };

  /* ===================================================
     CARGAR EMPLEADOS Y OBRAS
  =================================================== */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let mounted = true;

    const cargarCatalogos = async () => {
      try {
        setLoadingCatalogos(true);

        const [empleadosResponse, obrasResponse] = await Promise.all([
          getEmpleados(),

          api.get("/obras"),
        ]);

        if (!mounted) {
          return;
        }

        const empleadosActivos = empleadosResponse.filter(
          (empleado) => empleado.activo,
        );

        const obrasData = Array.isArray(obrasResponse.data?.data)
          ? obrasResponse.data.data
          : [];

        setEmpleados(empleadosActivos);

        setObras(obrasData);
      } catch (error) {
        console.error("Error cargando catálogos:", error);

        await Swal.fire({
          icon: "error",

          title: "No se pudieron cargar los datos",

          text: obtenerMensajeError(error),

          confirmButtonText: "Aceptar",
        });
      } finally {
        if (mounted) {
          setLoadingCatalogos(false);
        }
      }
    };

    void cargarCatalogos();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  /* ===================================================
     CARGAR ASIGNACIONES ACTIVAS
  =================================================== */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    /*
     * Para consultar una asignación necesitamos:
     *
     * empleado_id
     * obra_id
     */

    if (!form.empleado_id || !form.obra_id) {
      setAsignaciones([]);

      setErrorAsignacion(null);

      setForm((prev) => ({
        ...prev,

        asignacion_id: "",
      }));

      return;
    }

    let mounted = true;

    const cargarAsignaciones = async () => {
      try {
        setLoadingAsignaciones(true);

        setErrorAsignacion(null);

        const data = await getAsignacionesPagoEmpleado(
          form.empleado_id,
          form.obra_id,
        );

        if (!mounted) {
          return;
        }

        setAsignaciones(data);

        /*
         * Si existe exactamente una asignación activa,
         * la seleccionamos automáticamente.
         */

        if (data.length === 1) {
          setForm((prev) => ({
            ...prev,

            asignacion_id: data[0].id,
          }));

          return;
        }

        /*
         * Si no hay ninguna asignación activa,
         * dejamos el campo vacío.
         */

        if (data.length === 0) {
          setForm((prev) => ({
            ...prev,

            asignacion_id: "",
          }));

          setErrorAsignacion(
            "El empleado seleccionado no tiene una asignación activa en esta obra.",
          );

          return;
        }

        /*
         * Si hay varias asignaciones activas,
         * el usuario debe escoger una.
         */

        setForm((prev) => ({
          ...prev,

          asignacion_id: "",
        }));
      } catch (error) {
        console.error("Error cargando asignaciones:", error);

        if (!mounted) {
          return;
        }

        setAsignaciones([]);

        setForm((prev) => ({
          ...prev,

          asignacion_id: "",
        }));

        setErrorAsignacion(obtenerMensajeError(error));
      } finally {
        if (mounted) {
          setLoadingAsignaciones(false);
        }
      }
    };

    void cargarAsignaciones();

    return () => {
      mounted = false;
    };
  }, [isOpen, form.empleado_id, form.obra_id]);

  /* ===================================================
     SINCRONIZAR TIPO DE PAGO
  =================================================== */

  useEffect(() => {
    if (!empleadoSeleccionado) {
      return;
    }

    const tipo = empleadoSeleccionado.tipo_pago;

    if (tipo === "diario" || tipo === "semanal" || tipo === "mensual") {
      setForm((prev) => ({
        ...prev,

        tipo_pago: tipo,
      }));
    }
  }, [empleadoSeleccionado]);

  /* ===================================================
     HANDLE CHANGE
  =================================================== */

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,

      [name]: value,
    }));
  };

  /* ===================================================
     CAMBIAR EMPLEADO
  =================================================== */

  const handleEmpleadoChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,

      empleado_id: value,

      asignacion_id: "",
    }));

    setAsignaciones([]);

    setErrorAsignacion(null);
  };

  /* ===================================================
     CAMBIAR OBRA
  =================================================== */

  const handleObraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,

      obra_id: value,

      asignacion_id: "",
    }));

    setAsignaciones([]);

    setErrorAsignacion(null);
  };

  /* ===================================================
     VALIDAR FORMULARIO
  =================================================== */

  const validarFormulario = (): string | null => {
    if (!form.empleado_id) {
      return "Debe seleccionar un empleado.";
    }

    if (!form.tipo_pago) {
      return "Debe seleccionar el tipo de pago.";
    }

    if (!form.periodo_descripcion.trim()) {
      return "Debe ingresar una descripción del período.";
    }

    const monto = Number(form.monto);

    if (!Number.isFinite(monto) || monto <= 0) {
      return "El monto debe ser mayor a cero.";
    }

    if (
      form.fecha_inicio_periodo &&
      form.fecha_fin_periodo &&
      form.fecha_fin_periodo < form.fecha_inicio_periodo
    ) {
      return "La fecha final del período no puede ser anterior a la fecha inicial.";
    }

    /*
     * Si existe obra:
     *
     * debe existir una asignación activa.
     */

    if (form.obra_id && asignaciones.length === 0) {
      return "El empleado seleccionado no tiene una asignación activa en esta obra.";
    }

    if (form.obra_id && !form.asignacion_id) {
      return "Debe seleccionar la asignación del empleado en la obra.";
    }

    return null;
  };

  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      await Swal.fire({
        icon: "warning",

        title: "Revise la información",

        text: errorValidacion,

        confirmButtonText: "Aceptar",
      });

      return;
    }

    try {
      setSaving(true);

      const payload: CrearPagoEmpleadoPayload = {
        empleado_id: form.empleado_id,

        obra_id: form.obra_id || null,

        asignacion_id: form.asignacion_id || null,

        tipo_pago: form.tipo_pago,

        periodo_descripcion: form.periodo_descripcion.trim(),

        fecha_inicio_periodo: form.fecha_inicio_periodo || null,

        fecha_fin_periodo: form.fecha_fin_periodo || null,

        monto: Number(form.monto),

        referencia: form.referencia.trim() || null,

        observaciones: form.observaciones.trim() || null,
      };

      await createPagoEmpleado(payload);

      await Swal.fire({
        icon: "success",

        title: "Pago registrado",

        text: "El pago fue registrado correctamente y quedó pendiente de confirmación.",

        timer: 2200,

        showConfirmButton: false,
      });

      resetForm();

      if (onCreated) {
        await onCreated();
      }

      onClose();
    } catch (error) {
      console.error("Error creando pago:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo registrar el pago",

        text: obtenerMensajeError(error),

        confirmButtonText: "Aceptar",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ===================================================
     NO RENDER
  =================================================== */

  if (!isOpen) {
    return null;
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* OVERLAY */}

      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={handleClose}
      />

      {/* MODAL */}

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--color-primary)]/10 p-3">
              <WalletCards size={24} className="text-[var(--color-primary)]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Nuevo pago de empleado
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Registre una obligación de pago para el personal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        {/* LOADING */}

        {loadingCatalogos ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
            <Loader2
              size={34}
              className="animate-spin text-[var(--color-primary)]"
            />

            <p className="text-sm text-gray-500">
              Cargando empleados y obras...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* BODY */}

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* INFORMACIÓN */}

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />

                  <div>
                    <p className="font-semibold text-blue-900">
                      Registro pendiente
                    </p>

                    <p className="mt-1 text-sm text-blue-700">
                      Este formulario no descuenta dinero de ninguna cuenta. El
                      movimiento financiero se generará cuando el pago sea
                      confirmado posteriormente.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  EMPLEADO
              ================================================= */}

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <UserRound
                    size={19}
                    className="text-[var(--color-primary)]"
                  />

                  <h3 className="font-semibold text-gray-800">Empleado</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Empleado *
                    </label>

                    <select
                      name="empleado_id"
                      value={form.empleado_id}
                      onChange={handleEmpleadoChange}
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                      <option value="">Seleccione un empleado</option>

                      {empleados.map((empleado) => (
                        <option key={empleado.id} value={empleado.id}>
                          {empleado.nombres} {empleado.apellidos}
                          {" - "}
                          {empleado.cedula}
                        </option>
                      ))}
                    </select>
                  </div>

                  {empleadoSeleccionado && (
                    <>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Cargo
                        </p>

                        <p className="mt-1 font-medium text-gray-800">
                          {empleadoSeleccionado.cargo || "No especificado"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Tipo de pago habitual
                        </p>

                        <p className="mt-1 font-medium capitalize text-gray-800">
                          {empleadoSeleccionado.tipo_pago}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </section>

              <hr />

              {/* =================================================
                  OBRA / ASIGNACIÓN
              ================================================= */}

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Building2
                    size={19}
                    className="text-[var(--color-primary)]"
                  />

                  <h3 className="font-semibold text-gray-800">
                    Vinculación con obra
                  </h3>
                </div>

                <p className="mb-4 text-sm text-gray-500">
                  La obra es opcional. Déjela vacía para pagos administrativos o
                  personal que no pertenece a una obra específica.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* OBRA */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Obra
                    </label>

                    <select
                      name="obra_id"
                      value={form.obra_id}
                      onChange={handleObraChange}
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                      <option value="">Sin obra / Pago administrativo</option>

                      {obras.map((obra) => (
                        <option key={obra.id} value={obra.id}>
                          {obra.codigo ? `${obra.codigo} - ` : ""}

                          {obra.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ASIGNACIÓN */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Asignación
                    </label>

                    <select
                      name="asignacion_id"
                      value={form.asignacion_id}
                      onChange={handleChange}
                      disabled={
                        saving ||
                        !form.obra_id ||
                        !form.empleado_id ||
                        loadingAsignaciones ||
                        asignaciones.length === 0
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                      <option value="">
                        {loadingAsignaciones
                          ? "Cargando asignaciones..."
                          : !form.empleado_id
                            ? "Seleccione un empleado"
                            : !form.obra_id
                              ? "Seleccione una obra"
                              : asignaciones.length === 0
                                ? "Sin asignaciones activas"
                                : "Seleccione una asignación"}
                      </option>

                      {asignaciones.map((asignacion) => (
                        <option key={asignacion.id} value={asignacion.id}>
                          {asignacion.cargo_obra || "Asignación de obra"}

                          {asignacion.salario_acordado != null
                            ? ` - $${Number(
                                asignacion.salario_acordado,
                              ).toFixed(2)}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LOADING ASIGNACIÓN */}

                {loadingAsignaciones && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    <Loader2 size={17} className="animate-spin" />
                    Consultando asignaciones activas del empleado...
                  </div>
                )}

                {/* ERROR ASIGNACIÓN */}

                {form.empleado_id &&
                  form.obra_id &&
                  !loadingAsignaciones &&
                  errorAsignacion && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      {errorAsignacion}
                    </div>
                  )}

                {/* ASIGNACIÓN ENCONTRADA */}

                {obraSeleccionada && asignacionSeleccionada && (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        Obra
                      </p>

                      <p className="mt-1 font-medium text-gray-800">
                        {obraSeleccionada.nombre}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        Cargo en obra
                      </p>

                      <p className="mt-1 font-medium text-gray-800">
                        {asignacionSeleccionada.cargo_obra || "No especificado"}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        Salario acordado
                      </p>

                      <p className="mt-1 font-medium text-gray-800">
                        {asignacionSeleccionada.salario_acordado != null
                          ? `$${Number(
                              asignacionSeleccionada.salario_acordado,
                            ).toFixed(2)}`
                          : "No especificado"}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <hr />

              {/* =================================================
                  DATOS DEL PAGO
              ================================================= */}

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <DollarSign
                    size={19}
                    className="text-[var(--color-primary)]"
                  />

                  <h3 className="font-semibold text-gray-800">
                    Información del pago
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* TIPO PAGO */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Tipo de pago *
                    </label>

                    <select
                      name="tipo_pago"
                      value={form.tipo_pago}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                      <option value="diario">Diario</option>

                      <option value="semanal">Semanal</option>

                      <option value="quincenal">Quincenal</option>

                      <option value="mensual">Mensual</option>

                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {/* MONTO */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Monto *
                    </label>

                    <div className="relative">
                      <DollarSign
                        size={17}
                        className="absolute left-3 top-3 text-gray-400"
                      />

                      <input
                        type="number"
                        name="monto"
                        min="0.01"
                        step="0.01"
                        value={form.monto}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      />
                    </div>
                  </div>

                  {/* PERIODO */}

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Descripción del período *
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="absolute left-3 top-3 text-gray-400"
                      />

                      <input
                        type="text"
                        name="periodo_descripcion"
                        maxLength={100}
                        value={form.periodo_descripcion}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="Ej. Semana 1 - Septiembre 2026"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      />
                    </div>
                  </div>

                  {/* FECHA INICIO */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Inicio del período
                    </label>

                    <input
                      type="date"
                      name="fecha_inicio_periodo"
                      value={form.fecha_inicio_periodo}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    />
                  </div>

                  {/* FECHA FIN */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Fin del período
                    </label>

                    <input
                      type="date"
                      name="fecha_fin_periodo"
                      value={form.fecha_fin_periodo}
                      onChange={handleChange}
                      disabled={saving}
                      min={form.fecha_inicio_periodo || undefined}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    />
                  </div>

                  {/* REFERENCIA */}

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Referencia
                    </label>

                    <div className="relative">
                      <BriefcaseBusiness
                        size={17}
                        className="absolute left-3 top-3 text-gray-400"
                      />

                      <input
                        type="text"
                        name="referencia"
                        maxLength={100}
                        value={form.referencia}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="Ej. Nómina septiembre / orden interna"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      />
                    </div>
                  </div>

                  {/* OBSERVACIONES */}

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Observaciones
                    </label>

                    <div className="relative">
                      <FileText
                        size={17}
                        className="absolute left-3 top-3 text-gray-400"
                      />

                      <textarea
                        name="observaciones"
                        rows={3}
                        maxLength={1000}
                        value={form.observaciones}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="Información adicional sobre el pago..."
                        className="w-full resize-none rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  RESUMEN
              ================================================= */}

              {empleadoSeleccionado && Number(form.monto) > 0 && (
                <section className="rounded-xl border bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Resumen del registro
                  </h3>

                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500">Empleado:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {empleadoSeleccionado.nombres}{" "}
                        {empleadoSeleccionado.apellidos}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Monto:</span>{" "}
                      <span className="font-semibold text-gray-900">
                        ${Number(form.monto).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Tipo:</span>{" "}
                      <span className="font-medium capitalize">
                        {form.tipo_pago}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Estado inicial:</span>{" "}
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                        Pendiente
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Obra:</span>{" "}
                      <span className="font-medium">
                        {obraSeleccionada?.nombre || "No vinculado a una obra"}
                      </span>
                    </div>

                    {asignacionSeleccionada && (
                      <>
                        <div>
                          <span className="text-gray-500">Cargo en obra:</span>{" "}
                          <span className="font-medium">
                            {asignacionSeleccionada.cargo_obra ||
                              "No especificado"}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-500">
                            Salario acordado:
                          </span>{" "}
                          <span className="font-medium">
                            {asignacionSeleccionada.salario_acordado != null
                              ? `$${Number(
                                  asignacionSeleccionada.salario_acordado,
                                ).toFixed(2)}`
                              : "No especificado"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving || loadingCatalogos || loadingAsignaciones}
                className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Registrar pago
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreatePagoEmpleadoModal;
