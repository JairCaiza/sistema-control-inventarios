import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";

import RegistrarJornadaModal from "./RegistrarJornadaModal";
import EditarJornadaModal from "./EditarJornadaModal";

import {
  listarJornadasPorContrato,
  obtenerClaseEstadoJornada,
  obtenerTextoEstadoJornada,
} from "../../service/jornadasAlquiler";

import type {
  JornadaAlquiler,
  JornadasContratoResponse,
} from "../../service/jornadasAlquiler";

import type { ActivoContratoJornada } from "./RegistrarJornadaModal";

/* =====================================================
   PROPS
===================================================== */

interface JornadasContratoProps {
  contratoId: string;
  numeroContrato?: string;
  fechaInicio: string;
  fechaFin: string;
  estadoContrato: string;
  activos: ActivoContratoJornada[];
}

/* =====================================================
   UTILIDADES
===================================================== */

const formatearDinero = (valor: number | string | null | undefined) => {
  const numero = Number(valor ?? 0);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

const formatearFecha = (fecha: string | null | undefined) => {
  if (!fecha) return "—";

  const valor = String(fecha).slice(0, 10);
  const partes = valor.split("-");

  if (partes.length !== 3) {
    return valor;
  }

  const [anio, mes, dia] = partes;

  return `${dia}/${mes}/${anio}`;
};

const obtenerNombreActivo = (jornada: JornadaAlquiler) => {
  return jornada.activo_nombre || "Activo";
};

const obtenerCodigoActivo = (jornada: JornadaAlquiler) => {
  return jornada.activo_codigo || "";
};

const obtenerMensajeError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
        };
      };
    };

    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      "No fue posible cargar las jornadas del contrato."
    );
  }

  return "No fue posible cargar las jornadas del contrato.";
};

/* =====================================================
   COMPONENTE
===================================================== */

const JornadasContrato = ({
  contratoId,
  numeroContrato,
  fechaInicio,
  fechaFin,
  estadoContrato,
  activos,
}: JornadasContratoProps) => {
  /* =================================================
     ESTADOS
  ================================================= */

  const [datos, setDatos] = useState<JornadasContratoResponse | null>(null);

  const [cargando, setCargando] = useState(true);

  const [recargando, setRecargando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [modalRegistrarAbierto, setModalRegistrarAbierto] = useState(false);

  const [jornadaSeleccionada, setJornadaSeleccionada] =
    useState<JornadaAlquiler | null>(null);

  /* =================================================
     CARGAR JORNADAS
  ================================================= */

  const cargarJornadas = useCallback(
    async (mostrarCargaPrincipal = false) => {
      if (!contratoId) return;

      try {
        setError(null);

        if (mostrarCargaPrincipal) {
          setCargando(true);
        } else {
          setRecargando(true);
        }

        const resultado = await listarJornadasPorContrato(contratoId);

        setDatos(resultado);
      } catch (errorCarga: unknown) {
        console.error("Error al cargar jornadas:", errorCarga);

        const mensaje = obtenerMensajeError(errorCarga);

        setError(mensaje);

        // Propagamos el error para que un modal no
        // indique éxito si falló la actualización
        // de los datos después de guardar.
        throw errorCarga;
      } finally {
        setCargando(false);
        setRecargando(false);
      }
    },
    [contratoId],
  );

  /* =================================================
     CARGA INICIAL
  ================================================= */

  useEffect(() => {
    void cargarJornadas(true).catch(() => {
      // El error ya está almacenado en el estado.
    });
  }, [cargarJornadas]);

  /* =================================================
     DESPUÉS DE REGISTRAR
  ================================================= */

  const handleRegistroExitoso = async () => {
    await cargarJornadas(false);
  };

  /* =================================================
     EDITAR JORNADA
  ================================================= */

  const abrirEditarJornada = (jornada: JornadaAlquiler) => {
    if (estadoContrato !== "activo") {
      return;
    }

    setJornadaSeleccionada(jornada);
  };

  const cerrarEditarJornada = () => {
    setJornadaSeleccionada(null);
  };

  const handleEdicionExitosa = async () => {
    await cargarJornadas(false);
  };

  /* =================================================
     DATOS DERIVADOS
  ================================================= */

  const resumen = datos?.resumen;
  const jornadas = datos?.jornadas ?? [];

  const contratoActivo = estadoContrato === "activo";

  const totalPrevisto = Number(
    resumen?.total_previsto ?? datos?.contrato?.total_previsto ?? 0,
  );

  const totalEfectivo = Number(resumen?.total_efectivo ?? 0);

  const pagado = Number(resumen?.pagado ?? datos?.contrato?.pagado ?? 0);

  const saldoPendiente = Number(resumen?.saldo_efectivo_pendiente ?? 0);

  const saldoFavor = Number(resumen?.saldo_a_favor_cliente ?? 0);

  /* =================================================
     CARGANDO
  ================================================= */

  if (cargando) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin text-orange-600" />
          Cargando jornadas del alquiler...
        </div>
      </div>
    );
  }

  /* =================================================
     ERROR INICIAL
  ================================================= */

  if (error && !datos) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertCircle size={20} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">
              No se pudieron cargar las jornadas
            </h3>

            <p className="mt-1 text-sm text-slate-600">{error}</p>

            <button
              type="button"
              onClick={() => {
                void cargarJornadas(true).catch(() => {});
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =================================================
     RENDER
  ================================================= */

  return (
    <>
      <section className="space-y-5">
        {/* =====================================
            CABECERA
        ====================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={21} className="text-orange-600" />

              <h2 className="text-lg font-semibold text-slate-900">
                Jornadas del alquiler
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Control de los días realmente trabajados y del valor efectivo del
              alquiler.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void cargarJornadas(false).catch(() => {});
              }}
              disabled={recargando}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={recargando ? "animate-spin" : ""}
              />
              Actualizar
            </button>

            {contratoActivo && (
              <button
                type="button"
                onClick={() => setModalRegistrarAbierto(true)}
                disabled={activos.length === 0}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={17} />
                Registrar jornada
              </button>
            )}
          </div>
        </div>

        {/* =====================================
            ERROR DE RECARGA
        ====================================== */}

        {error && datos && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />

            {error}
          </div>
        )}

        {/* =====================================
            CONTRATO NO ACTIVO
        ====================================== */}

        {!contratoActivo && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Clock3 size={19} className="mt-0.5 shrink-0 text-slate-500" />

            <div>
              <p className="text-sm font-medium text-slate-800">
                Contrato {estadoContrato}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Las jornadas registradas permanecen disponibles como historial.
                Actualmente solo se permite registrar y editar jornadas de
                contratos activos.
              </p>
            </div>
          </div>
        )}

        {/* =====================================
            RESUMEN ECONÓMICO
        ====================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* PREVISTO */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <CalendarDays size={19} />
              </div>

              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Planificado
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-500">Valor previsto</p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatearDinero(totalPrevisto)}
            </p>
          </div>

          {/* EFECTIVO */}

          <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CheckCircle2 size={19} />
              </div>

              <span className="text-xs font-medium uppercase tracking-wide text-green-600">
                Real
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-500">Valor efectivo</p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatearDinero(totalEfectivo)}
            </p>
          </div>

          {/* PAGADO */}

          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={19} />
              </div>

              <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                Pagos
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-500">Pagado</p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatearDinero(pagado)}
            </p>
          </div>

          {/* BALANCE */}

          <div
            className={`rounded-2xl border bg-white p-5 shadow-sm ${
              saldoFavor > 0
                ? "border-amber-200"
                : saldoPendiente > 0
                  ? "border-red-200"
                  : "border-green-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  saldoFavor > 0
                    ? "bg-amber-50 text-amber-600"
                    : saldoPendiente > 0
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-600"
                }`}
              >
                <DollarSign size={19} />
              </div>

              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Balance
              </span>
            </div>

            {saldoFavor > 0 ? (
              <>
                <p className="mt-4 text-sm text-slate-500">
                  Saldo a favor del cliente
                </p>

                <p className="mt-1 text-2xl font-semibold text-amber-600">
                  {formatearDinero(saldoFavor)}
                </p>
              </>
            ) : saldoPendiente > 0 ? (
              <>
                <p className="mt-4 text-sm text-slate-500">
                  Saldo efectivo pendiente
                </p>

                <p className="mt-1 text-2xl font-semibold text-red-600">
                  {formatearDinero(saldoPendiente)}
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-slate-500">Saldo efectivo</p>

                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {formatearDinero(0)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* =====================================
            ESTADÍSTICAS
        ====================================== */}

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            Registradas: {resumen?.jornadas_registradas ?? 0}
          </span>

          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
            Trabajadas: {resumen?.jornadas_trabajadas ?? 0}
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            No laborables: {resumen?.jornadas_no_laborables ?? 0}
          </span>

          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            Suspendidas: {resumen?.jornadas_suspendidas ?? 0}
          </span>

          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
            Canceladas: {resumen?.jornadas_canceladas ?? 0}
          </span>
        </div>

        {/* =====================================
            HISTORIAL
        ====================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-900">
              Historial de jornadas
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Una jornada corresponde a un activo específico del contrato.
            </p>
          </div>

          {jornadas.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <CalendarDays size={22} />
              </div>

              <h4 className="mt-4 font-medium text-slate-900">
                Aún no existen jornadas
              </h4>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Registra los días trabajados, no laborables o suspendidos para
                obtener el valor real del alquiler.
              </p>

              {contratoActivo && activos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalRegistrarAbierto(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  <Plus size={17} />
                  Registrar primera jornada
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fecha
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Activo
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cantidad
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tarifa
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Motivo
                    </th>

                    {contratoActivo && (
                      <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {jornadas.map((jornada) => {
                    const codigo = obtenerCodigoActivo(jornada);

                    return (
                      <tr
                        key={jornada.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">
                          {formatearFecha(jornada.fecha)}
                        </td>

                        <td className="px-5 py-4">
                          <p className="whitespace-nowrap text-sm font-medium text-slate-800">
                            {obtenerNombreActivo(jornada)}
                          </p>

                          {codigo && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {codigo}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${obtenerClaseEstadoJornada(
                              jornada.estado,
                            )}`}
                          >
                            {obtenerTextoEstadoJornada(jornada.estado)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-center text-sm text-slate-700">
                          {jornada.cantidad_efectiva}

                          <span className="text-slate-400">
                            {" "}
                            / {jornada.cantidad_contratada ?? "—"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-700">
                          {formatearDinero(jornada.precio_diario)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <span
                            className={`text-sm font-semibold ${
                              jornada.cobrable
                                ? "text-green-700"
                                : "text-slate-500"
                            }`}
                          >
                            {formatearDinero(jornada.total_dia)}
                          </span>
                        </td>

                        <td className="max-w-[260px] px-5 py-4 text-sm text-slate-600">
                          <span
                            title={
                              jornada.motivo || jornada.observaciones || ""
                            }
                            className="block truncate"
                          >
                            {jornada.motivo || jornada.observaciones || "—"}
                          </span>
                        </td>

                        {contratoActivo && (
                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => abrirEditarJornada(jornada)}
                              aria-label={`Editar jornada del ${formatearFecha(
                                jornada.fecha,
                              )}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =====================================
            EXPLICACIÓN DEL CÁLCULO
        ====================================== */}

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            ¿Cómo se calcula el valor efectivo?
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            El valor previsto corresponde al contrato original. El valor
            efectivo se obtiene únicamente de las jornadas cobrables
            registradas. Los pagos representan dinero recibido y se comparan con
            el valor efectivo para determinar deuda o saldo a favor.
          </p>
        </div>
      </section>

      {/* =====================================
          MODAL REGISTRAR
      ====================================== */}

      <RegistrarJornadaModal
        open={modalRegistrarAbierto}
        onClose={() => setModalRegistrarAbierto(false)}
        contratoId={contratoId}
        numeroContrato={numeroContrato}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        activos={activos}
        onSuccess={handleRegistroExitoso}
      />

      {/* =====================================
          MODAL EDITAR
      ====================================== */}

      {contratoActivo && jornadaSeleccionada && (
        <EditarJornadaModal
          key={jornadaSeleccionada.id}
          open={true}
          onClose={cerrarEditarJornada}
          jornada={jornadaSeleccionada}
          numeroContrato={numeroContrato}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onSuccess={handleEdicionExitosa}
        />
      )}
    </>
  );
};

export default JornadasContrato;
