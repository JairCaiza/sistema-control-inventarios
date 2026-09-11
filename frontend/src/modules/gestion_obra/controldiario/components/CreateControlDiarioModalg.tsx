import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  CalendarDays,
  Clock3,
  CloudSun,
  FileText,
  Gauge,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import { getObras, type Obra } from "../../obras/services/obrasService";

import { registrarControlDiario } from "../../obras/services/controlDiarioService";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

/* =====================================================
   FORM
===================================================== */

interface FormState {
  obra_id: string;
  fecha: string;
  actividad: string;
  descripcion: string;
  hora_inicio: string;
  hora_fin: string;
  avance: string;
  observaciones: string;
  clima: string;
}

/* =====================================================
   FORM VACÍO
===================================================== */

const crearFormInicial = (): FormState => ({
  obra_id: "",
  fecha: obtenerFechaLocal(),
  actividad: "",
  descripcion: "",
  hora_inicio: "",
  hora_fin: "",
  avance: "",
  observaciones: "",
  clima: "",
});

/* =====================================================
   FECHA LOCAL
===================================================== */

function obtenerFechaLocal() {
  const fecha = new Date();

  const year = fecha.getFullYear();

  const month = String(fecha.getMonth() + 1).padStart(2, "0");

  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =====================================================
   MENSAJE ERROR
===================================================== */

const obtenerMensajeError = (error: unknown, fallback: string) => {
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
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

/* =====================================================
   MODAL
===================================================== */

function CreateControlDiarioModalg({ open, onClose, onSuccess }: Props) {
  /* =================================================
     STATE
  ================================================= */

  const [form, setForm] = useState<FormState>(crearFormInicial());

  const [obras, setObras] = useState<Obra[]>([]);

  const [loadingObras, setLoadingObras] = useState(false);

  const [saving, setSaving] = useState(false);

  /* =================================================
     OBRAS DISPONIBLES
  ================================================= */

  const obrasDisponibles = useMemo(() => {
    return obras.filter(
      (obra) => obra.estado !== "finalizada" && obra.estado !== "cancelada",
    );
  }, [obras]);

  /* =================================================
     CARGAR OBRAS
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const cargarObras = async () => {
      try {
        setLoadingObras(true);

        const data = await getObras();

        setObras(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando obras:", error);

        await Swal.fire({
          icon: "error",
          title: "No se pudieron cargar las obras",
          text: obtenerMensajeError(
            error,
            "Ocurrió un error al consultar las obras.",
          ),
        });
      } finally {
        setLoadingObras(false);
      }
    };

    setForm(crearFormInicial());

    void cargarObras();
  }, [open]);

  /* =================================================
     BLOQUEAR SCROLL
  ================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, onClose]);

  /* =================================================
     CHANGE
  ================================================= */

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =================================================
     VALIDAR
  ================================================= */

  const validarFormulario = () => {
    if (!form.obra_id) {
      return "Seleccione una obra.";
    }

    if (!form.fecha) {
      return "Ingrese la fecha del control.";
    }

    if (!form.actividad.trim()) {
      return "Ingrese la actividad realizada.";
    }

    if (form.hora_inicio && form.hora_fin && form.hora_fin < form.hora_inicio) {
      return "La hora de finalización no puede ser anterior a la hora de inicio.";
    }

    if (form.avance !== "") {
      const avance = Number(form.avance);

      if (!Number.isFinite(avance) || avance < 0 || avance > 100) {
        return "El avance debe estar entre 0 y 100.";
      }
    }

    return null;
  };

  /* =================================================
     SUBMIT
  ================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      await Swal.fire({
        icon: "warning",
        title: "Revise la información",
        text: errorValidacion,
      });

      return;
    }

    try {
      setSaving(true);

     await registrarControlDiario({
       obra_id: form.obra_id,

       fecha: form.fecha,

       actividad: form.actividad.trim(),

       descripcion: form.descripcion.trim() || undefined,

       hora_inicio: form.hora_inicio || undefined,

       hora_fin: form.hora_fin || undefined,

       avance: form.avance === "" ? undefined : Number(form.avance),

       observaciones: form.observaciones.trim() || undefined,

       clima: form.clima.trim() || undefined,
     });

      await Swal.fire({
        icon: "success",
        title: "Control registrado",
        text: "El control diario fue registrado correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });

      setForm(crearFormInicial());

      onClose();

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Error registrando control diario:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        text: obtenerMensajeError(
          error,
          "Ocurrió un error al registrar el control diario.",
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  /* =================================================
     NO RENDER
  ================================================= */

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Registrar Control Diario
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Seleccione la obra y registre las actividades realizadas durante
              la jornada.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* =================================================
              OBRA
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Obra <span className="text-red-500">*</span>
            </label>

            <select
              value={form.obra_id}
              onChange={(event) => handleChange("obra_id", event.target.value)}
              disabled={loadingObras || saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)] disabled:bg-slate-100"
            >
              <option value="">
                {loadingObras ? "Cargando obras..." : "Seleccione una obra"}
              </option>

              {obrasDisponibles.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.codigo
                    ? `${obra.codigo} - ${obra.nombre}`
                    : obra.nombre}
                </option>
              ))}
            </select>

            {!loadingObras && obrasDisponibles.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                No existen obras disponibles para registrar controles.
              </p>
            )}
          </div>

          {/* =================================================
              FECHA + AVANCE
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Fecha <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={form.fecha}
                  onChange={(event) =>
                    handleChange("fecha", event.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Avance (%)
              </label>

              <div className="relative">
                <Gauge
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.avance}
                  onChange={(event) =>
                    handleChange("avance", event.target.value)
                  }
                  disabled={saving}
                  placeholder="Ej. 50"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              ACTIVIDAD
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Actividad <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={form.actividad}
              onChange={(event) =>
                handleChange("actividad", event.target.value)
              }
              disabled={saving}
              maxLength={250}
              placeholder="Ej. Fundición de columnas"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* =================================================
              DESCRIPCIÓN
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Descripción
            </label>

            <div className="relative">
              <FileText
                size={17}
                className="absolute left-3 top-3 text-slate-400"
              />

              <textarea
                value={form.descripcion}
                onChange={(event) =>
                  handleChange("descripcion", event.target.value)
                }
                disabled={saving}
                rows={3}
                placeholder="Describa el trabajo realizado..."
                className="w-full resize-none rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* =================================================
              HORAS
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hora inicio
              </label>

              <div className="relative">
                <Clock3
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(event) =>
                    handleChange("hora_inicio", event.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hora fin
              </label>

              <div className="relative">
                <Clock3
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={(event) =>
                    handleChange("hora_fin", event.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              CLIMA
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Clima
            </label>

            <div className="relative">
              <CloudSun
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={form.clima}
                onChange={(event) => handleChange("clima", event.target.value)}
                disabled={saving}
                placeholder="Ej. Soleado, nublado, lluvia..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* =================================================
              OBSERVACIONES
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Observaciones
            </label>

            <textarea
              value={form.observaciones}
              onChange={(event) =>
                handleChange("observaciones", event.target.value)
              }
              disabled={saving}
              rows={3}
              placeholder="Novedades, retrasos, inconvenientes o comentarios..."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || loadingObras || obrasDisponibles.length === 0}
              className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Registrando..." : "Registrar control"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateControlDiarioModalg;
