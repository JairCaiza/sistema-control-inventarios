import { useEffect, useMemo, useState } from "react";

import {
  getHistorialActivo,
  type Movimiento,
} from "../../movimientos/services/movimientoService";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  History,
  MapPin,
  Package,
  RefreshCw,
  Wrench,
  X,
  AlertTriangle,
  FileText,
  CalendarDays,
} from "lucide-react";

/* =====================================================
   EXTENSIÓN TEMPORAL DEL TIPO MOVIMIENTO
===================================================== */

/*
 * Hasta que actualicemos movimientoService.ts,
 * extendemos el Movimiento existente con los
 * nuevos campos que devuelve el backend.
 */
type MovimientoInventario = Movimiento & {
  ubicacion_origen_id?: string | null;

  ubicacion_destino_id?: string | null;

  ubicacion_origen?: string | null;

  ubicacion_destino?: string | null;

  estado_origen?: string | null;

  estado_destino?: string | null;

  referencia_id?: string | null;

  origen_modulo?: string | null;
};

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;

  activoId: string | null;

  onClose: () => void;
}

/* =====================================================
   LABEL ESTADO
===================================================== */

const getEstadoLabel = (estado?: string | null) => {
  if (!estado) {
    return "—";
  }

  switch (estado.toLowerCase()) {
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

const getEstadoClass = (estado?: string | null) => {
  switch (estado?.toLowerCase()) {
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
      return "bg-gray-100 text-gray-600";
  }
};

/* =====================================================
   LABEL MOVIMIENTO
===================================================== */

const getTipoMovimientoLabel = (tipo?: string) => {
  switch (tipo) {
    case "entrada":
      return "Entrada";

    case "salida":
      return "Salida";

    case "transferencia":
      return "Transferencia";

    case "cambio_estado":
      return "Cambio de estado";

    case "ajuste":
      return "Ajuste";

    default:
      return tipo || "Movimiento";
  }
};

/* =====================================================
   ESTILO MOVIMIENTO
===================================================== */

const getTipoMovimientoClass = (tipo?: string) => {
  switch (tipo) {
    case "entrada":
      return "bg-green-100 text-green-700";

    case "salida":
      return "bg-red-100 text-red-700";

    case "transferencia":
      return "bg-blue-100 text-blue-700";

    case "cambio_estado":
      return "bg-purple-100 text-purple-700";

    case "ajuste":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

/* =====================================================
   ICONO MOVIMIENTO
===================================================== */

const getTipoMovimientoIcon = (tipo?: string) => {
  switch (tipo) {
    case "entrada":
      return <ArrowDownToLine size={16} />;

    case "salida":
      return <ArrowUpFromLine size={16} />;

    case "transferencia":
      return <ArrowRightLeft size={16} />;

    case "cambio_estado":
      return <Wrench size={16} />;

    case "ajuste":
      return <AlertTriangle size={16} />;

    default:
      return <Package size={16} />;
  }
};

/* =====================================================
   FORMATEAR FECHA
===================================================== */

const formatearFecha = (fecha?: string) => {
  if (!fecha) {
    return "—";
  }

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return fecha;
  }

  return date.toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/* =====================================================
   COMPONENTE
===================================================== */

function ActivoDetalleModal({ open, activoId, onClose }: Props) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     CARGAR HISTORIAL
  ===================================================== */

  const loadHistorial = async () => {
    try {
      if (!activoId) {
        return;
      }

      setLoading(true);

      setError("");

      const data = await getHistorialActivo(activoId);

      setMovimientos((data || []) as MovimientoInventario[]);
    } catch (errorHistorial) {
      console.error("Error cargando historial:", errorHistorial);

      setError("No se pudo cargar el historial del activo.");

      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && activoId) {
      loadHistorial();
    }
  }, [open, activoId]);

  /* =====================================================
     RESUMEN
  ===================================================== */

  const resumen = useMemo(() => {
    return {
      total: movimientos.length,

      entradas: movimientos.filter((m) => m.tipo_movimiento === "entrada")
        .length,

      salidas: movimientos.filter((m) => m.tipo_movimiento === "salida").length,

      cambiosEstado: movimientos.filter(
        (m) => m.tipo_movimiento === "cambio_estado",
      ).length,
    };
  }, [movimientos]);

  /* =====================================================
     NO RENDER
  ===================================================== */

  if (!open) {
    return null;
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start justify-between border-b bg-white px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)]">
              <History size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Historial del Activo
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Trazabilidad completa de movimientos, cambios de estado y
                ubicaciones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadHistorial}
              disabled={loading || !activoId}
              title="Actualizar historial"
              className="rounded-lg border p-2 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <RefreshCw size={19} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="flex-1 overflow-y-auto p-6">
          {/* =================================================
              RESUMEN
          ================================================= */}

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <History size={17} />

                <span className="text-xs font-medium uppercase">
                  Movimientos
                </span>
              </div>

              <p className="mt-2 text-2xl font-bold text-gray-800">
                {resumen.total}
              </p>
            </div>

            <div className="rounded-xl border bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <ArrowDownToLine size={17} />

                <span className="text-xs font-medium uppercase">Entradas</span>
              </div>

              <p className="mt-2 text-2xl font-bold text-green-700">
                {resumen.entradas}
              </p>
            </div>

            <div className="rounded-xl border bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <ArrowUpFromLine size={17} />

                <span className="text-xs font-medium uppercase">Salidas</span>
              </div>

              <p className="mt-2 text-2xl font-bold text-red-700">
                {resumen.salidas}
              </p>
            </div>

            <div className="rounded-xl border bg-purple-50 p-4">
              <div className="flex items-center gap-2 text-purple-700">
                <Wrench size={17} />

                <span className="text-xs font-medium uppercase">
                  Cambios estado
                </span>
              </div>

              <p className="mt-2 text-2xl font-bold text-purple-700">
                {resumen.cambiosEstado}
              </p>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <RefreshCw size={22} className="animate-spin" />
                Cargando historial...
              </div>
            </div>
          ) : movimientos.length === 0 ? (
            /* =================================================
               VACÍO
            ================================================= */

            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-gray-50 px-4 text-center">
              <History size={44} className="mb-3 text-gray-300" />

              <p className="font-semibold text-gray-600">
                No existen movimientos
              </p>

              <p className="mt-1 max-w-md text-sm text-gray-400">
                Cuando el activo registre entradas, salidas, ajustes,
                transferencias o cambios de estado aparecerán aquí.
              </p>
            </div>
          ) : (
            /* =================================================
               TABLA
            ================================================= */

            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Fecha
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Movimiento
                      </th>

                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Cantidad
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Ubicación
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Estado
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Motivo
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Referencia
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Origen
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimientos.map((movimiento) => {
                      const tieneCambioUbicacion = Boolean(
                        movimiento.ubicacion_origen ||
                        movimiento.ubicacion_destino,
                      );

                      const tieneCambioEstado = Boolean(
                        movimiento.estado_origen || movimiento.estado_destino,
                      );

                      return (
                        <tr
                          key={movimiento.id}
                          className="border-t align-top transition hover:bg-gray-50"
                        >
                          {/* FECHA */}

                          <td className="px-4 py-4">
                            <div className="flex min-w-36 items-start gap-2 text-sm text-gray-600">
                              <CalendarDays
                                size={16}
                                className="mt-0.5 shrink-0 text-gray-400"
                              />

                              <span>
                                {formatearFecha(movimiento.fecha_creacion)}
                              </span>
                            </div>
                          </td>

                          {/* TIPO */}

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${getTipoMovimientoClass(
                                movimiento.tipo_movimiento,
                              )}`}
                            >
                              {getTipoMovimientoIcon(
                                movimiento.tipo_movimiento,
                              )}

                              {getTipoMovimientoLabel(
                                movimiento.tipo_movimiento,
                              )}
                            </span>
                          </td>

                          {/* CANTIDAD */}

                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex min-w-10 justify-center rounded-lg bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                              {movimiento.cantidad}
                            </span>
                          </td>

                          {/* UBICACIÓN */}

                          <td className="px-4 py-4">
                            {tieneCambioUbicacion ? (
                              <div className="min-w-48 space-y-1 text-sm">
                                {movimiento.ubicacion_origen && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin
                                      size={14}
                                      className="text-red-400"
                                    />

                                    <span>{movimiento.ubicacion_origen}</span>
                                  </div>
                                )}

                                {movimiento.ubicacion_destino && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin
                                      size={14}
                                      className="text-green-500"
                                    />

                                    <span>{movimiento.ubicacion_destino}</span>
                                  </div>
                                )}

                                {movimiento.ubicacion_origen &&
                                  movimiento.ubicacion_destino && (
                                    <p className="pl-6 text-[11px] text-gray-400">
                                      Origen → Destino
                                    </p>
                                  )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* ESTADO */}

                          <td className="px-4 py-4">
                            {tieneCambioEstado ? (
                              <div className="flex min-w-52 flex-wrap items-center gap-2">
                                {movimiento.estado_origen && (
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getEstadoClass(
                                      movimiento.estado_origen,
                                    )}`}
                                  >
                                    {getEstadoLabel(movimiento.estado_origen)}
                                  </span>
                                )}

                                {movimiento.estado_origen &&
                                  movimiento.estado_destino && (
                                    <span className="text-gray-400">→</span>
                                  )}

                                {movimiento.estado_destino && (
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getEstadoClass(
                                      movimiento.estado_destino,
                                    )}`}
                                  >
                                    {getEstadoLabel(movimiento.estado_destino)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* MOTIVO */}

                          <td className="max-w-xs px-4 py-4 text-sm text-gray-600">
                            {movimiento.motivo || "Sin motivo registrado"}
                          </td>

                          {/* REFERENCIA */}

                          <td className="px-4 py-4">
                            {movimiento.referencia ? (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FileText size={15} className="text-gray-400" />

                                <span>{movimiento.referencia}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* ORIGEN MÓDULO */}

                          <td className="px-4 py-4">
                            {movimiento.origen_modulo ? (
                              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                                {movimiento.origen_modulo}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex justify-between border-t bg-gray-50 px-6 py-4">
          <p className="hidden text-sm text-gray-500 sm:block">
            Los movimientos constituyen el Kardex histórico del activo y no
            deberían modificarse manualmente.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border bg-white px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActivoDetalleModal;
