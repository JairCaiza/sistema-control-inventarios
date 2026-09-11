import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  CloudSun,
  Eye,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { Link } from "react-router-dom";

import Swal from "sweetalert2";

import { getControlesDiarios } from "../../../gestion_obra/controldiario/services/controlDiarioService";

import CreateControlDiarioModal from "../../../gestion_obra/controldiario/components/CreateControlDiarioModalg";

/* =====================================================
   TIPO PARA LA VISTA GENERAL
===================================================== */

interface ControlDiarioGeneral {
  id?: string;

  obra_id: string;

  obra_codigo?: string | null;

  obra_nombre?: string | null;

  fecha: string;

  actividad: string;

  descripcion?: string | null;

  hora_inicio?: string | null;

  hora_fin?: string | null;

  avance?: number | null;

  observaciones?: string | null;

  clima?: string | null;
}

/* =====================================================
   ERROR API
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
   FECHA LOCAL
===================================================== */

const obtenerFechaLocal = () => {
  const fecha = new Date();

  const year = fecha.getFullYear();

  const month = String(fecha.getMonth() + 1).padStart(2, "0");

  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   FORMATEAR FECHA
===================================================== */

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const fecha = value.includes("T") ? value.split("T")[0] : value;

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [year, month, day] = partes;

  return `${day}/${month}/${year}`;
};

/* =====================================================
   FORMATEAR HORA
===================================================== */

const formatHora = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  return value.slice(0, 5);
};

/* =====================================================
   NOMBRE OBRA
===================================================== */

const obtenerNombreObra = (control: ControlDiarioGeneral) => {
  if (control.obra_nombre) {
    return control.obra_nombre;
  }

  if (control.obra_codigo) {
    return control.obra_codigo;
  }

  return "Obra sin nombre";
};

/* =====================================================
   COMPONENTE
===================================================== */

function ControlDiarioPage() {
  /* =================================================
     STATES
  ================================================= */

  const [controles, setControles] = useState<ControlDiarioGeneral[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [filtroObra, setFiltroObra] = useState("");

  const [filtroFecha, setFiltroFecha] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  /* =================================================
     CARGAR CONTROLES
  ================================================= */

  const loadControles = useCallback(async (mostrarLoader = true) => {
    try {
      if (mostrarLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await getControlesDiarios();

      const controlesGeneral = Array.isArray(data)
        ? (data as ControlDiarioGeneral[])
        : [];

      setControles(controlesGeneral);
    } catch (error) {
      console.error("Error cargando controles diarios:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudieron cargar los controles",

        text: obtenerMensajeError(
          error,
          "Ocurrió un error al consultar los controles diarios.",
        ),

        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, []);

  /* =================================================
     CARGAR AL ENTRAR
  ================================================= */

  useEffect(() => {
    void loadControles();
  }, [loadControles]);

  /* =================================================
     OBRAS DEL SELECT
  ================================================= */

  const obras = useMemo(() => {
    const mapa = new Map<string, string>();

    controles.forEach((control) => {
      if (!control.obra_id) {
        return;
      }

      mapa.set(control.obra_id, obtenerNombreObra(control));
    });

    return Array.from(mapa.entries())
      .map(([id, nombre]) => ({
        id,
        nombre,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [controles]);

  /* =================================================
     FILTROS
  ================================================= */

  const controlesFiltrados = useMemo(() => {
    const texto = search.trim().toLowerCase();

    return controles.filter((control) => {
      const obraNombre = (control.obra_nombre ?? "").toLowerCase();

      const obraCodigo = (control.obra_codigo ?? "").toLowerCase();

      const actividad = (control.actividad ?? "").toLowerCase();

      const descripcion = (control.descripcion ?? "").toLowerCase();

      const observaciones = (control.observaciones ?? "").toLowerCase();

      const coincideBusqueda =
        !texto ||
        obraNombre.includes(texto) ||
        obraCodigo.includes(texto) ||
        actividad.includes(texto) ||
        descripcion.includes(texto) ||
        observaciones.includes(texto);

      const coincideObra = !filtroObra || control.obra_id === filtroObra;

      const fechaControl = control.fecha ? control.fecha.split("T")[0] : "";

      const coincideFecha = !filtroFecha || fechaControl === filtroFecha;

      return coincideBusqueda && coincideObra && coincideFecha;
    });
  }, [controles, search, filtroObra, filtroFecha]);

  /* =================================================
     KPIS
  ================================================= */

  const resumen = useMemo(() => {
    const totalControles = controlesFiltrados.length;

    const obrasConActividad = new Set(
      controlesFiltrados.map((control) => control.obra_id).filter(Boolean),
    ).size;

    const avances = controlesFiltrados
      .map((control) => control.avance)
      .filter(
        (avance): avance is number =>
          typeof avance === "number" && Number.isFinite(avance),
      );

    const avancePromedio =
      avances.length > 0
        ? avances.reduce((total, avance) => total + avance, 0) / avances.length
        : null;

    const hoy = obtenerFechaLocal();

    const controlesHoy = controlesFiltrados.filter((control) => {
      const fechaControl = control.fecha ? control.fecha.split("T")[0] : "";

      return fechaControl === hoy;
    }).length;

    return {
      totalControles,
      obrasConActividad,
      avancePromedio,
      controlesHoy,
    };
  }, [controlesFiltrados]);

  /* =================================================
     LIMPIAR FILTROS
  ================================================= */

  const limpiarFiltros = () => {
    setSearch("");
    setFiltroObra("");
    setFiltroFecha("");
  };

  /* =================================================
     LOADING
  ================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw size={30} className="animate-spin" />

        <p className="text-sm">Cargando controles diarios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Gestión de obras
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Control Diario
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Consulta general de actividades, horarios, avances y novedades
            registradas en todas las obras.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={refreshing}
            onClick={() => void loadControles(false)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={17} />
            Nuevo control
          </button>
        </div>
      </div>

      {/* =================================================
          KPIS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* CONTROLES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Controles registrados</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.totalControles}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <ClipboardList size={22} />
            </div>
          </div>
        </div>

        {/* OBRAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Obras con actividad</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.obrasConActividad}
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Building2 size={22} />
            </div>
          </div>
        </div>

        {/* AVANCE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Avance promedio</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.avancePromedio !== null
                  ? `${resumen.avancePromedio.toFixed(1)}%`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <BarChart3 size={22} />
            </div>
          </div>
        </div>

        {/* HOY */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Controles de hoy</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {resumen.controlesHoy}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <CalendarDays size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
          {/* BUSCADOR */}

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por obra, actividad, descripción u observación..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>

          {/* SELECT OBRA */}

          <select
            value={filtroObra}
            onChange={(event) => setFiltroObra(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Todas las obras</option>

            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nombre}
              </option>
            ))}
          </select>

          {/* FECHA */}

          <input
            type="date"
            value={filtroFecha}
            onChange={(event) => setFiltroFecha(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />

          <button
            type="button"
            onClick={limpiarFiltros}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            Registros diarios
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Información tomada directamente de los controles diarios registrados
            en cada obra.
          </p>
        </div>

        {controlesFiltrados.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <ClipboardList size={38} className="text-slate-300" />

            <p className="mt-3 font-semibold text-slate-700">
              No hay controles para mostrar
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Registra un nuevo control o modifica los filtros.
            </p>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Nuevo control
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Fecha
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Obra
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Actividad
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                    Horario
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                    Avance
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                    Clima
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {controlesFiltrados.map((control, index) => (
                  <tr
                    key={
                      control.id ??
                      `${control.obra_id}-${control.fecha}-${index}`
                    }
                    className="transition hover:bg-slate-50"
                  >
                    {/* FECHA */}

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays size={15} className="text-slate-400" />

                        {formatDate(control.fecha)}
                      </div>
                    </td>

                    {/* OBRA */}

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {obtenerNombreObra(control)}
                      </p>

                      {control.obra_codigo && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {control.obra_codigo}
                        </p>
                      )}
                    </td>

                    {/* ACTIVIDAD */}

                    <td className="max-w-[350px] px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {control.actividad}
                      </p>

                      {control.descripcion && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {control.descripcion}
                        </p>
                      )}

                      {control.observaciones && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                          Obs: {control.observaciones}
                        </p>
                      )}
                    </td>

                    {/* HORARIO */}

                    <td className="whitespace-nowrap px-5 py-4 text-center text-sm text-slate-600">
                      {control.hora_inicio || control.hora_fin ? (
                        <>
                          {formatHora(control.hora_inicio)}

                          {" - "}

                          {formatHora(control.hora_fin)}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* AVANCE */}

                    <td className="px-5 py-4">
                      <div className="flex flex-col items-center">
                        {control.avance !== null &&
                        control.avance !== undefined ? (
                          <>
                            <span className="text-sm font-semibold text-slate-700">
                              {control.avance}%
                            </span>

                            <div className="mt-1 h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-[var(--color-primary)]"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, Number(control.avance)),
                                  )}%`,
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* CLIMA */}

                    <td className="px-5 py-4 text-center">
                      {control.clima ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                          <CloudSun size={14} />

                          {control.clima}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    {/* ACCIÓN */}

                    <td className="px-5 py-4 text-center">
                      <Link
                        to={`/dashboard/obras/${control.obra_id}`}
                        title="Ver obra"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cyan-600 transition hover:bg-cyan-50"
                      >
                        <Eye size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-500">
            Mostrando <strong>{controlesFiltrados.length}</strong> de{" "}
            <strong>{controles.length}</strong> control(es).
          </p>
        </div>
      </div>

      {/* =================================================
          INFORMACIÓN
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="font-semibold text-blue-900">Control Diario general</p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            Consulta los controles de todas las obras y registra nuevas
            actividades seleccionando la obra correspondiente.
          </p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <p className="font-semibold text-violet-900">
            Control desde una obra
          </p>

          <p className="mt-1 text-sm leading-6 text-violet-800">
            Desde el detalle de la obra se utiliza el mismo formulario, pero la
            obra ya está seleccionada.
          </p>
        </div>
      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      <CreateControlDiarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={async () => {
          setModalOpen(false);

          await loadControles(false);
        }}
      />
    </div>
  );
}

export default ControlDiarioPage;
