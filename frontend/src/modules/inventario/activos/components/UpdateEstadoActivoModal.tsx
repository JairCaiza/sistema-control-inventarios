import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import {
  updateEstadoActivo,
  type Activo,
  type ExistenciaActivo,
} from "../../activos/service/activoService";

import {
  ArrowRight,
  Boxes,
  MapPin,
  Package,
  AlertTriangle,
  Wrench,
  XCircle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from "lucide-react";

interface Props {
  open: boolean;

  onClose: () => void;

  activo: Activo | null;

  onUpdated: () => void;
}

type EstadoManual =
  | "disponible"
  | "mantenimiento"
  | "danado"
  | "perdido"
  | "dado_baja";

/* =====================================================
   ESTADOS MANUALES PERMITIDOS
===================================================== */

const estadosDestino: {
  value: EstadoManual;
  label: string;
}[] = [
  {
    value: "disponible",
    label: "Disponible",
  },
  {
    value: "mantenimiento",
    label: "Mantenimiento",
  },
  {
    value: "danado",
    label: "Dañado",
  },
  {
    value: "perdido",
    label: "Perdido",
  },
  {
    value: "dado_baja",
    label: "Dado de baja",
  },
];

/* =====================================================
   LABEL ESTADO
===================================================== */

const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case "disponible":
      return "Disponible";

    case "alquilado":
      return "Alquilado";

    case "mantenimiento":
      return "Mantenimiento";

    case "danado":
      return "Dañado";

    case "perdido":
      return "Perdido";

    case "dado_baja":
      return "Dado de baja";

    default:
      return estado;
  }
};

/* =====================================================
   COLOR ESTADO
===================================================== */

const getEstadoClass = (estado: string) => {
  switch (estado) {
    case "disponible":
      return "bg-green-100 text-green-700";

    case "alquilado":
      return "bg-blue-100 text-blue-700";

    case "mantenimiento":
      return "bg-yellow-100 text-yellow-700";

    case "danado":
      return "bg-orange-100 text-orange-700";

    case "perdido":
      return "bg-red-100 text-red-700";

    case "dado_baja":
      return "bg-gray-200 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

/* =====================================================
   ICONO ESTADO
===================================================== */

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "disponible":
      return <CheckCircle2 size={16} />;

    case "mantenimiento":
      return <Wrench size={16} />;

    case "danado":
      return <AlertTriangle size={16} />;

    case "perdido":
      return <XCircle size={16} />;

    default:
      return <Package size={16} />;
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

function UpdateEstadoActivoModal({ open, onClose, activo, onUpdated }: Props) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [existenciaId, setExistenciaId] = useState("");

  const [estadoDestino, setEstadoDestino] =
    useState<EstadoManual>("mantenimiento");

  const [cantidad, setCantidad] = useState("1");

  const [motivo, setMotivo] = useState("");

  const [saving, setSaving] = useState(false);

  /* =====================================================
     EXISTENCIAS DISPONIBLES PARA CAMBIO MANUAL
  ===================================================== */

  const existenciasDisponibles = useMemo(() => {
    if (!activo) {
      return [];
    }

    /*
     * No permitimos mover manualmente
     * existencias alquiladas.
     *
     * Alquilado debe regresar mediante
     * Devoluciones.
     */
    return (activo.existencias || []).filter(
      (existencia) =>
        existencia.cantidad > 0 && existencia.estado !== "alquilado",
    );
  }, [activo]);

  /* =====================================================
     EXISTENCIA SELECCIONADA
  ===================================================== */

  const existenciaSeleccionada = useMemo<ExistenciaActivo | undefined>(() => {
    return existenciasDisponibles.find(
      (existencia) => existencia.id === existenciaId,
    );
  }, [existenciasDisponibles, existenciaId]);

  /* =====================================================
     RESET AL ABRIR
  ===================================================== */

  useEffect(() => {
    if (!open || !activo) {
      return;
    }

    const primeraExistencia = (activo.existencias || []).find(
      (existencia) =>
        existencia.cantidad > 0 && existencia.estado !== "alquilado",
    );

    setExistenciaId(primeraExistencia?.id || "");

    setCantidad("1");

    setMotivo("");

    /*
     * Elegimos un destino distinto
     * del estado origen.
     */
    if (primeraExistencia?.estado === "mantenimiento") {
      setEstadoDestino("disponible");
    } else {
      setEstadoDestino("mantenimiento");
    }
  }, [open, activo]);

  /* =====================================================
     CUANDO CAMBIA EXISTENCIA
  ===================================================== */

  useEffect(() => {
    if (!existenciaSeleccionada) {
      return;
    }

    setCantidad("1");

    /*
     * Nunca dejamos por defecto
     * el mismo estado origen/destino.
     */
    if (existenciaSeleccionada.estado === estadoDestino) {
      const alternativa = estadosDestino.find(
        (estado) => estado.value !== existenciaSeleccionada.estado,
      );

      if (alternativa) {
        setEstadoDestino(alternativa.value);
      }
    }
  }, [existenciaSeleccionada, estadoDestino]);

  /* =====================================================
     NO RENDER
  ===================================================== */

  if (!open || !activo) {
    return null;
  }

  /* =====================================================
     VALIDAR
  ===================================================== */

  const validar = (): string | null => {
    if (!existenciaSeleccionada) {
      return "Debe seleccionar una existencia válida.";
    }

    if (existenciaSeleccionada.estado === estadoDestino) {
      return "El estado destino debe ser diferente al estado actual.";
    }

    const cantidadNumero = Number(cantidad);

    if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
      return "La cantidad debe ser un número entero mayor que cero.";
    }

    if (cantidadNumero > existenciaSeleccionada.cantidad) {
      return `Solo existen ${existenciaSeleccionada.cantidad} unidades disponibles en esta existencia.`;
    }

    if (activo.tipo_control === "unidad" && cantidadNumero !== 1) {
      return "Un activo individual solo puede cambiar una unidad.";
    }

    return null;
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorValidacion = validar();

    if (errorValidacion) {
      await Swal.fire({
        icon: "warning",

        title: "Revise la información",

        text: errorValidacion,
      });

      return;
    }

    if (!existenciaSeleccionada) {
      return;
    }

    const cantidadNumero = Number(cantidad);

    const confirmacion = await Swal.fire({
      icon: "question",

      title: "Confirmar cambio de estado",

      html: `
          <div style="text-align:left; line-height:1.7">

            <p>
              <strong>Activo:</strong>
              ${activo.nombre}
            </p>

            <p>
              <strong>Código:</strong>
              ${activo.codigo}
            </p>

            <p>
              <strong>Ubicación:</strong>
              ${existenciaSeleccionada.ubicacion}
            </p>

            <p>
              <strong>Cantidad:</strong>
              ${cantidadNumero}
            </p>

            <p>
              <strong>Cambio:</strong>
              ${getEstadoLabel(existenciaSeleccionada.estado)}
              →
              ${getEstadoLabel(estadoDestino)}
            </p>

          </div>
        `,

      showCancelButton: true,

      confirmButtonText: "Sí, actualizar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#2563eb",
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      setSaving(true);

      await updateEstadoActivo(activo.id, {
        ubicacion_id: existenciaSeleccionada.ubicacion_id,

        estado_origen: existenciaSeleccionada.estado as EstadoManual,

        estado_destino: estadoDestino,

        cantidad: cantidadNumero,

        motivo: motivo.trim() || null,
      });

      await Swal.fire({
        icon: "success",

        title: "Estado actualizado",

        text: "El movimiento de inventario fue registrado correctamente.",

        timer: 2000,

        showConfirmButton: false,

        timerProgressBar: true,
      });

      onUpdated();

      onClose();
    } catch (error: any) {
      console.error("Error actualizando estado:", error);

      const errores = error?.response?.data?.errores;

      const mensaje =
        Array.isArray(errores) && errores.length > 0
          ? errores.join("\n")
          : error?.response?.data?.message ||
            "No se pudo actualizar el estado.";

      await Swal.fire({
        icon: "error",

        title: "No se pudo actualizar",

        text: mensaje,
      });
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Cambiar estado del activo
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Mueva una cantidad específica entre estados de inventario.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            <X size={21} />
          </button>
        </div>

        {/* =================================================
            INFORMACIÓN DEL ACTIVO
        ================================================= */}

        <div className="border-b bg-gray-50 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {activo.nombre}
              </p>

              <p className="text-sm text-gray-500">Código: {activo.codigo}</p>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <Boxes size={17} className="text-gray-500" />

              <span className="text-gray-500">Control:</span>

              <span className="font-semibold capitalize text-gray-800">
                {activo.tipo_control === "unidad"
                  ? "Individual"
                  : "Por cantidad"}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* =================================================
              EXISTENCIA ORIGEN
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Existencia a modificar *
            </label>

            {existenciasDisponibles.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No existen unidades disponibles para realizar un cambio manual
                de estado. Las existencias alquiladas deben regresar mediante el
                proceso de devolución.
              </div>
            ) : (
              <select
                value={existenciaId}
                onChange={(e) => setExistenciaId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
              >
                {existenciasDisponibles.map((existencia) => (
                  <option key={existencia.id} value={existencia.id}>
                    {existencia.ubicacion} · {getEstadoLabel(existencia.estado)}{" "}
                    · {existencia.cantidad} unidad(es)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* =================================================
              RESUMEN ORIGEN
          ================================================= */}

          {existenciaSeleccionada && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500">
                  <MapPin size={17} />

                  <span className="text-xs font-medium uppercase">
                    Ubicación
                  </span>
                </div>

                <p className="font-semibold text-gray-800">
                  {existenciaSeleccionada.ubicacion}
                </p>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                  Estado actual
                </p>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getEstadoClass(
                    existenciaSeleccionada.estado,
                  )}`}
                >
                  {getEstadoIcon(existenciaSeleccionada.estado)}

                  {getEstadoLabel(existenciaSeleccionada.estado)}
                </span>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                  Cantidad actual
                </p>

                <p className="text-2xl font-bold text-gray-800">
                  {existenciaSeleccionada.cantidad}
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              MOVIMIENTO
          ================================================= */}

          {existenciaSeleccionada && (
            <>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />

                <ArrowRight size={20} className="text-gray-400" />

                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* CANTIDAD */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Cantidad a mover *
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={existenciaSeleccionada.cantidad}
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    disabled={activo.tipo_control === "unidad"}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Máximo disponible: {existenciaSeleccionada.cantidad}
                  </p>
                </div>

                {/* DESTINO */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nuevo estado *
                  </label>

                  <select
                    value={estadoDestino}
                    onChange={(e) =>
                      setEstadoDestino(e.target.value as EstadoManual)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  >
                    {estadosDestino
                      .filter(
                        (estado) =>
                          estado.value !== existenciaSeleccionada.estado,
                      )
                      .map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* MOTIVO */}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Motivo
                  </label>

                  <textarea
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ejemplo: mantenimiento preventivo, equipo dañado, pérdida reportada..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* PREVISUALIZACIÓN */}

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />

                  <div className="text-sm leading-6 text-blue-800">
                    Se moverán{" "}
                    <strong>{Number(cantidad) || 0} unidad(es)</strong> desde{" "}
                    <strong>
                      {getEstadoLabel(existenciaSeleccionada.estado)}
                    </strong>{" "}
                    hacia <strong>{getEstadoLabel(estadoDestino)}</strong> en la
                    ubicación{" "}
                    <strong>{existenciaSeleccionada.ubicacion}</strong>.
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                El estado <strong>Alquilado</strong> no puede asignarse
                manualmente. Se genera automáticamente al registrar activos en
                un contrato y se revierte mediante una devolución.
              </div>
            </>
          )}

          {/* =================================================
              BOTONES
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || !existenciaSeleccionada}
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <ArrowRight size={18} />
                  Cambiar estado
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateEstadoActivoModal;
