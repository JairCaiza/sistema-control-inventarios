import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileDown,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

import {
  changeSocioStatus,
  deleteSocio,
  getSocios,
  type FiltrosSocios,
  type Socio,
} from "../service/sociosService";

import RegistrarSocioModal from "../components/RegistrarSocioModal";

/* =====================================================
   FILTROS INICIALES
===================================================== */

const filtrosIniciales: FiltrosSocios = {
  buscar: "",
  activo: "",
  fecha_ingreso: "",
};

/* =====================================================
   FORMATEADORES
===================================================== */

const formatearDinero = (valor: number | string | undefined) => {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaNormalizada = fecha.includes("T") ? fecha.split("T")[0] : fecha;

  const [anio, mes, dia] = fechaNormalizada.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
};

/* =====================================================
   COMPONENTE
===================================================== */

function SociosPage() {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [socios, setSocios] = useState<Socio[]>([]);

  const [filtros, setFiltros] = useState<FiltrosSocios>(filtrosIniciales);

  const [filtrosAplicados, setFiltrosAplicados] =
    useState<FiltrosSocios>(filtrosIniciales);

  const [cargando, setCargando] = useState<boolean>(true);

  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [error, setError] = useState<string>("");

  const [modalRegistrarAbierto, setModalRegistrarAbierto] =
    useState<boolean>(false);

  /* =====================================================
     CARGAR SOCIOS
  ===================================================== */

  const cargarSocios = useCallback(async () => {
    try {
      setCargando(true);

      setError("");

      const datos = await getSocios(filtrosAplicados);

      setSocios(datos);
    } catch (error: unknown) {
      console.error("Error al cargar socios:", error);

      setError("No se pudo cargar el listado de socios.");
    } finally {
      setCargando(false);
    }
  }, [filtrosAplicados]);

  useEffect(() => {
    cargarSocios();
  }, [cargarSocios]);

  /* =====================================================
     KPIs
  ===================================================== */

  const totalSocios = socios.length;

  const totalActivos = useMemo(
    () => socios.filter((socio) => socio.activo).length,
    [socios],
  );

  /*
   * IMPORTANTE:
   * Capital real =
   * aportes confirmados
   * -
   * retiros confirmados
   *
   * Por eso usamos capital_neto.
   */
  const capitalTotal = useMemo(
    () =>
      socios.reduce(
        (total, socio) => total + Number(socio.capital_neto || 0),
        0,
      ),
    [socios],
  );

  const totalAportes = useMemo(
    () =>
      socios.reduce(
        (total, socio) => total + Number(socio.total_aportes || 0),
        0,
      ),
    [socios],
  );

  const totalRetiros = useMemo(
    () =>
      socios.reduce(
        (total, socio) => total + Number(socio.total_retiros || 0),
        0,
      ),
    [socios],
  );

  const promedioCapital = totalSocios > 0 ? capitalTotal / totalSocios : 0;

  /* =====================================================
     FILTROS
  ===================================================== */

  const handleFiltroChange = (
    campo: keyof FiltrosSocios,

    valor: string | boolean,
  ) => {
    setFiltros((estadoAnterior) => ({
      ...estadoAnterior,

      [campo]: valor,
    }));
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados({
      buscar: filtros.buscar?.trim() || "",

      activo: filtros.activo,

      fecha_ingreso: filtros.fecha_ingreso || "",
    });
  };

  const limpiarFiltros = () => {
    setFiltros(filtrosIniciales);

    setFiltrosAplicados(filtrosIniciales);
  };

  const handleBuscarConEnter = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      aplicarFiltros();
    }
  };

  /* =====================================================
     CREAR
  ===================================================== */

  const handleCreate = () => {
    setModalRegistrarAbierto(true);
  };

  const handleSocioCreado = async (socioCreado: Socio) => {
    console.log("Socio registrado:", socioCreado);

    await cargarSocios();
  };

  /* =====================================================
     VER
  ===================================================== */

  const handleView = (socio: Socio) => {
    console.log("Ver socio:", socio);
  };

  /* =====================================================
     EDITAR
  ===================================================== */

  const handleEdit = (socio: Socio) => {
    console.log("Editar socio:", socio);
  };

  /* =====================================================
     CAMBIAR ESTADO
  ===================================================== */

  const handleChangeStatus = async (socio: Socio) => {
    const nuevoEstado = !socio.activo;

    const mensaje = nuevoEstado
      ? `¿Deseas activar al socio ${socio.nombre}?`
      : `¿Deseas desactivar al socio ${socio.nombre}?`;

    const confirmado = window.confirm(mensaje);

    if (!confirmado) {
      return;
    }

    try {
      setProcesandoId(socio.id);

      setError("");

      await changeSocioStatus(socio.id, nuevoEstado);

      await cargarSocios();
    } catch (error: unknown) {
      console.error("Error al cambiar estado:", error);

      setError("No se pudo cambiar el estado del socio.");
    } finally {
      setProcesandoId(null);
    }
  };

  /* =====================================================
     ELIMINAR
  ===================================================== */

  const handleDelete = async (socio: Socio) => {
    const confirmado = window.confirm(
      `¿Deseas eliminar al socio ${socio.nombre}? Esta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    try {
      setProcesandoId(socio.id);

      setError("");

      await deleteSocio(socio.id);

      await cargarSocios();
    } catch (error: unknown) {
      console.error("Error al eliminar socio:", error);

      setError(
        "No se pudo eliminar el socio. Puede tener aportes o distribuciones relacionadas.",
      );
    } finally {
      setProcesandoId(null);
    }
  };

  /* =====================================================
     EXPORTAR CSV
  ===================================================== */

  const handleExport = () => {
    if (socios.length === 0) {
      window.alert("No existen socios para exportar.");

      return;
    }

    const encabezados = [
      "Nombre",
      "Identificación",
      "Contacto",
      "Aportes",
      "Retiros",
      "Capital neto",
      "Participación",
      "Estado",
      "Fecha de ingreso",
    ];

    const filas = socios.map((socio) => [
      socio.nombre,

      socio.identificacion,

      socio.contacto || "",

      Number(socio.total_aportes || 0).toFixed(2),

      Number(socio.total_retiros || 0).toFixed(2),

      Number(socio.capital_neto || 0).toFixed(2),

      `${Number(socio.porcentaje_participacion || 0).toFixed(2)}%`,

      socio.activo ? "Activo" : "Inactivo",

      socio.fecha_ingreso || "",
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => {
            const texto = String(valor).replace(/"/g, '""');

            return `"${texto}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${contenido}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = `socios-${new Date().toISOString().split("T")[0]}.csv`;

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Socios
          </h1>

          <p className="mt-1 text-gray-500">
            Administración de socios, capital aportado y participación
            societaria calculada automáticamente.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={cargarSocios}
            disabled={cargando}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={18} className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <FileDown size={18} />
            Exportar
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition hover:opacity-90"
          >
            <Plus size={18} />
            Nuevo socio
          </button>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =================================================
          KPIs
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL SOCIOS */}

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total de socios</p>

          <h2 className="text-2xl font-bold text-gray-800">{totalSocios}</h2>

          <Users className="mt-2 text-gray-600" />
        </div>

        {/* ACTIVOS */}

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Socios activos</p>

          <h2 className="text-2xl font-bold text-green-600">{totalActivos}</h2>

          <TrendingUp className="mt-2 text-green-600" />
        </div>

        {/* CAPITAL TOTAL */}

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Capital neto total</p>

          <h2 className="text-2xl font-bold text-blue-600">
            {formatearDinero(capitalTotal)}
          </h2>

          <DollarSign className="mt-2 text-blue-600" />
        </div>

        {/* PROMEDIO */}

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Capital promedio</p>

          <h2 className="text-2xl font-bold text-purple-600">
            {formatearDinero(promedioCapital)}
          </h2>

          <TrendingDown className="mt-2 text-purple-600" />
        </div>
      </div>

      {/* =================================================
          RESUMEN CAPITAL
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-green-50 p-4">
          <p className="text-sm text-green-700">Aportes confirmados</p>

          <p className="mt-1 text-xl font-bold text-green-700">
            {formatearDinero(totalAportes)}
          </p>
        </div>

        <div className="rounded-xl border bg-red-50 p-4">
          <p className="text-sm text-red-700">Retiros confirmados</p>

          <p className="mt-1 text-xl font-bold text-red-700">
            {formatearDinero(totalRetiros)}
          </p>
        </div>

        <div className="rounded-xl border bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Capital disponible</p>

          <p className="mt-1 text-xl font-bold text-blue-700">
            {formatearDinero(capitalTotal)}
          </p>
        </div>
      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="rounded-xl border bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Filtros</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            value={filtros.buscar || ""}
            onChange={(event) =>
              handleFiltroChange("buscar", event.target.value)
            }
            onKeyDown={handleBuscarConEnter}
            placeholder="Nombre, identificación o contacto"
            className="rounded-lg border px-4 py-2 outline-none focus:border-[var(--color-primary)]"
          />

          <select
            value={filtros.activo === "" ? "" : String(filtros.activo)}
            onChange={(event) => {
              const valor = event.target.value;

              handleFiltroChange(
                "activo",

                valor === "" ? "" : valor === "true",
              );
            }}
            className="rounded-lg border px-4 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Todos los estados</option>

            <option value="true">Activo</option>

            <option value="false">Inactivo</option>
          </select>

          <input
            type="date"
            value={filtros.fecha_ingreso || ""}
            onChange={(event) =>
              handleFiltroChange("fecha_ingreso", event.target.value)
            }
            className="rounded-lg border px-4 py-2 outline-none focus:border-[var(--color-primary)]"
          />

          <button
            type="button"
            onClick={aplicarFiltros}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition hover:opacity-90"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={limpiarFiltros}
            className="rounded-lg border px-4 py-2 transition hover:bg-gray-100"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold">Listado de socios</h2>

            <p className="mt-1 text-sm text-gray-500">
              La participación se calcula automáticamente según el capital neto.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {socios.length} {socios.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {cargando ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw size={22} className="animate-spin" />
              Cargando socios...
            </div>
          </div>
        ) : socios.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <Users size={42} className="mb-3 text-gray-300" />

            <p className="font-medium text-gray-600">
              No existen socios registrados
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Registra un nuevo socio o modifica los filtros.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Nombre</th>

                  <th className="p-3 text-left">Identificación</th>

                  <th className="p-3 text-left">Contacto</th>

                  <th className="p-3 text-right">Aportes</th>

                  <th className="p-3 text-right">Retiros</th>

                  <th className="p-3 text-right">Capital neto</th>

                  <th className="p-3 text-right">Participación</th>

                  <th className="p-3 text-center">Estado</th>

                  <th className="p-3 text-left">Ingreso</th>

                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {socios.map((socio) => {
                  const procesando = procesandoId === socio.id;

                  return (
                    <tr
                      key={socio.id}
                      className="border-t transition hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium text-gray-800">
                        {socio.nombre}
                      </td>

                      <td className="p-3 text-sm text-gray-600">
                        {socio.identificacion}
                      </td>

                      <td className="p-3 text-sm text-gray-600">
                        {socio.contacto || "Sin contacto"}
                      </td>

                      <td className="p-3 text-right font-semibold text-green-600">
                        {formatearDinero(socio.total_aportes)}
                      </td>

                      <td className="p-3 text-right font-semibold text-red-600">
                        {formatearDinero(socio.total_retiros)}
                      </td>

                      <td className="p-3 text-right font-bold text-blue-600">
                        {formatearDinero(socio.capital_neto)}
                      </td>

                      <td className="p-3 text-right font-semibold">
                        {Number(socio.porcentaje_participacion || 0).toFixed(2)}
                        %
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            socio.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {socio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="p-3 text-sm text-gray-600">
                        {formatearFecha(socio.fecha_ingreso)}
                      </td>

                      <td className="p-3">
                        <div className="flex justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleView(socio)}
                            disabled={procesando}
                            title="Ver socio"
                            className="text-blue-600 transition hover:text-blue-800 disabled:opacity-40"
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(socio)}
                            disabled={procesando}
                            title="Editar socio"
                            className="text-amber-600 transition hover:text-amber-800 disabled:opacity-40"
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChangeStatus(socio)}
                            disabled={procesando}
                            title={
                              socio.activo
                                ? "Desactivar socio"
                                : "Activar socio"
                            }
                            className={`transition disabled:opacity-40 ${
                              socio.activo
                                ? "text-orange-600 hover:text-orange-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                          >
                            {socio.activo ? <FaToggleOn /> : <FaToggleOff />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(socio)}
                            disabled={procesando}
                            title="Eliminar socio"
                            className="text-red-600 transition hover:text-red-800 disabled:opacity-40"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          NOTA
      ================================================= */}

      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        El porcentaje de participación no se almacena manualmente. Se calcula
        automáticamente según el capital neto de cada socio respecto al capital
        total.
      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      <RegistrarSocioModal
        isOpen={modalRegistrarAbierto}
        onClose={() => setModalRegistrarAbierto(false)}
        onSocioCreado={handleSocioCreado}
      />
    </div>
  );
}

export default SociosPage;
