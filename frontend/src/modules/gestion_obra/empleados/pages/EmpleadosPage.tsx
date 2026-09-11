import { useEffect, useMemo, useState } from "react";

import {
  BriefcaseBusiness,
  CircleDollarSign,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  UserX,
} from "lucide-react";

import { Link } from "react-router-dom";

import Swal from "sweetalert2";

import {
  deleteEmpleado,
  getEmpleados,
  toggleEmpleadoStatus,
  type Empleado,
  type TipoPagoEmpleado,
} from "../services/empleadosService";

import CreateEmpleadoModal from "../components/CreateEmpleadoModal";

import EditEmpleadoModal from "../components/EditEmpleadoModal";

/* =====================================================
   FILTROS
===================================================== */

type EstadoFiltro = "todos" | "activos" | "inactivos";

type TipoPagoFiltro = "todos" | TipoPagoEmpleado;

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
   FORMATEAR MONEDA
===================================================== */

const formatearMoneda = (value?: number | string | null) => {
  const numero = Number(value ?? 0);

  if (!Number.isFinite(numero)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(numero);
};

/* =====================================================
   LABEL TIPO PAGO
===================================================== */

const obtenerLabelTipoPago = (tipo: TipoPagoEmpleado) => {
  const labels: Record<TipoPagoEmpleado, string> = {
    diario: "Diario",
    semanal: "Semanal",
    quincenal: "Quincenal",
    mensual: "Mensual",
  };

  return labels[tipo];
};

/* =====================================================
   COMPONENTE
===================================================== */

function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(
    null,
  );

  const [search, setSearch] = useState("");

  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");

  const [tipoPagoFiltro, setTipoPagoFiltro] = useState<TipoPagoFiltro>("todos");

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* =================================================
     CARGAR EMPLEADOS
  ================================================= */

  const loadEmpleados = async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) {
        setLoading(true);
      }

      const data = await getEmpleados();

      setEmpleados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando empleados:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudieron cargar los empleados",
        text: obtenerMensajeError(
          error,
          "Ocurrió un error al obtener la información de empleados.",
        ),
        confirmButtonText: "Aceptar",
      });
    } finally {
      if (mostrarLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadEmpleados();
  }, []);

  /* =================================================
     FILTRADO
  ================================================= */

  const empleadosFiltrados = useMemo(() => {
    const texto = search.trim().toLowerCase();

    return empleados.filter((empleado) => {
      const nombreCompleto =
        `${empleado.nombres} ${empleado.apellidos}`.toLowerCase();

      const coincideBusqueda =
        !texto ||
        nombreCompleto.includes(texto) ||
        empleado.cedula?.toLowerCase().includes(texto) ||
        empleado.cargo?.toLowerCase().includes(texto) ||
        empleado.telefono?.toLowerCase().includes(texto) ||
        empleado.correo?.toLowerCase().includes(texto);

      const coincideEstado =
        estadoFiltro === "todos" ||
        (estadoFiltro === "activos" && empleado.activo) ||
        (estadoFiltro === "inactivos" && !empleado.activo);

      const coincideTipoPago =
        tipoPagoFiltro === "todos" || empleado.tipo_pago === tipoPagoFiltro;

      return coincideBusqueda && coincideEstado && coincideTipoPago;
    });
  }, [empleados, search, estadoFiltro, tipoPagoFiltro]);

  /* =================================================
     KPIs
  ================================================= */

  const totalEmpleados = empleados.length;

  const empleadosActivos = empleados.filter(
    (empleado) => empleado.activo,
  ).length;

  const empleadosInactivos = empleados.filter(
    (empleado) => !empleado.activo,
  ).length;

  const empleadosEnObra = empleados.filter(
    (empleado) => Number(empleado.obras_activas ?? 0) > 0,
  ).length;

  /* =================================================
     TOGGLE ESTADO
  ================================================= */

  const handleToggle = async (empleado: Empleado) => {
    if (updatingStatusId) {
      return;
    }

    const nuevoEstado = !empleado.activo;

    const confirmacion = await Swal.fire({
      icon: "question",
      title: nuevoEstado ? "¿Activar empleado?" : "¿Desactivar empleado?",
      text: nuevoEstado
        ? `${empleado.nombres} ${empleado.apellidos} volverá a estar activo en el sistema.`
        : `${empleado.nombres} ${empleado.apellidos} quedará inactivo, pero se conservará su historial.`,
      showCancelButton: true,
      confirmButtonText: nuevoEstado ? "Sí, activar" : "Sí, desactivar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      setUpdatingStatusId(empleado.id);

      await toggleEmpleadoStatus(empleado.id, nuevoEstado);

      setEmpleados((prev) =>
        prev.map((item) =>
          item.id === empleado.id
            ? {
                ...item,
                activo: nuevoEstado,
              }
            : item,
        ),
      );

      await Swal.fire({
        icon: "success",
        title: nuevoEstado ? "Empleado activado" : "Empleado desactivado",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error cambiando estado:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo cambiar el estado",
        text: obtenerMensajeError(
          error,
          "Ocurrió un error al cambiar el estado del empleado.",
        ),
        confirmButtonText: "Aceptar",
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  /* =================================================
     ELIMINAR
  ================================================= */

  const handleDelete = async (empleado: Empleado) => {
    if (deletingId) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar empleado?",
      html: `
            <div style="text-align:left">
              <p>
                Se intentará eliminar a
                <strong>
                  ${empleado.nombres} ${empleado.apellidos}
                </strong>.
              </p>
              <p style="margin-top:8px">
                Solo podrá eliminarse si no tiene pagos ni historial de obras.
                Si tiene historial, deberá conservarse como empleado inactivo.
              </p>
            </div>
          `,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(empleado.id);

      await deleteEmpleado(empleado.id);

      setEmpleados((prev) => prev.filter((item) => item.id !== empleado.id));

      await Swal.fire({
        icon: "success",
        title: "Empleado eliminado",
        text: "El empleado fue eliminado correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error eliminando empleado:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: obtenerMensajeError(error, "No se pudo eliminar el empleado."),
        confirmButtonText: "Aceptar",
      });
    } finally {
      setDeletingId(null);
    }
  };

  /* =================================================
     EDITAR
  ================================================= */

  const abrirEditar = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);

    setEditOpen(true);
  };

  /* =================================================
     CERRAR EDIT
  ================================================= */

  const cerrarEditar = () => {
    setEditOpen(false);

    setSelectedEmpleado(null);
  };

  /* =================================================
     LIMPIAR FILTROS
  ================================================= */

  const limpiarFiltros = () => {
    setSearch("");

    setEstadoFiltro("todos");

    setTipoPagoFiltro("todos");
  };

  const hayFiltros =
    search.trim() !== "" ||
    estadoFiltro !== "todos" ||
    tipoPagoFiltro !== "todos";

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[var(--color-primary)]">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">Empleados</h1>

              <p className="mt-1 text-sm text-slate-500">
                Gestión del personal, información laboral y estado de empleados.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus size={18} />
          Nuevo empleado
        </button>
      </div>

      {/* =================================================
          KPIs
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total empleados
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalEmpleados}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Users size={21} />
            </div>
          </div>
        </div>

        {/* ACTIVOS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Activos</p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {empleadosActivos}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={21} />
            </div>
          </div>
        </div>

        {/* INACTIVOS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Inactivos</p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {empleadosInactivos}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <UserX size={21} />
            </div>
          </div>
        </div>

        {/* EN OBRAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                En obras activas
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {empleadosEnObra}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BriefcaseBusiness size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {/* BUSCADOR */}

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, cédula, cargo, teléfono o correo..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* ESTADO */}

          <div className="relative min-w-[180px]">
            <Filter
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={estadoFiltro}
              onChange={(event) =>
                setEstadoFiltro(event.target.value as EstadoFiltro)
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            >
              <option value="todos">Todos los estados</option>

              <option value="activos">Activos</option>

              <option value="inactivos">Inactivos</option>
            </select>
          </div>

          {/* TIPO PAGO */}

          <div className="relative min-w-[190px]">
            <CircleDollarSign
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={tipoPagoFiltro}
              onChange={(event) =>
                setTipoPagoFiltro(event.target.value as TipoPagoFiltro)
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            >
              <option value="todos">Todos los pagos</option>

              <option value="diario">Diario</option>

              <option value="semanal">Semanal</option>

              <option value="quincenal">Quincenal</option>

              <option value="mensual">Mensual</option>
            </select>
          </div>

          {/* LIMPIAR */}

          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Mostrando{" "}
          <span className="font-semibold text-slate-700">
            {empleadosFiltrados.length}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-slate-700">
            {empleados.length}
          </span>{" "}
          empleados
        </div>
      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--color-primary)]" />

          <p className="mt-4 text-sm text-slate-500">Cargando empleados...</p>
        </div>
      )}

      {/* =================================================
          TABLA
      ================================================= */}

      {!loading && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Empleado
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cédula
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cargo
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tipo pago
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Salario base
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contacto
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {empleadosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <UserRound size={22} />
                      </div>

                      <p className="mt-3 font-semibold text-slate-700">
                        No se encontraron empleados
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Ajuste los filtros o registre un nuevo empleado.
                      </p>
                    </td>
                  </tr>
                )}

                {empleadosFiltrados.map((empleado) => {
                  const cambiandoEstado = updatingStatusId === empleado.id;

                  const eliminando = deletingId === empleado.id;

                  return (
                    <tr
                      key={empleado.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* EMPLEADO */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-bold uppercase text-[var(--color-primary)]">
                            {empleado.nombres.charAt(0)}
                            {empleado.apellidos.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {empleado.nombres} {empleado.apellidos}
                            </p>

                            <p className="mt-0.5 max-w-[230px] truncate text-xs text-slate-400">
                              {empleado.correo || "Sin correo registrado"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CEDULA */}

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {empleado.cedula}
                      </td>

                      {/* CARGO */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {empleado.cargo || "Sin cargo"}
                      </td>

                      {/* TIPO PAGO */}

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {obtenerLabelTipoPago(empleado.tipo_pago)}
                        </span>
                      </td>

                      {/* SALARIO */}

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {empleado.salario_base !== null &&
                        empleado.salario_base !== undefined
                          ? formatearMoneda(empleado.salario_base)
                          : "-"}
                      </td>

                      {/* CONTACTO */}

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-slate-700">
                            {empleado.telefono || "-"}
                          </p>

                          {Number(empleado.obras_activas ?? 0) > 0 && (
                            <p className="text-xs font-medium text-blue-600">
                              {empleado.obras_activas}{" "}
                              {Number(empleado.obras_activas) === 1
                                ? "obra activa"
                                : "obras activas"}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* ESTADO */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            empleado.activo
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              empleado.activo ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />

                          {empleado.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* VER */}

                          <Link
                            to={`/dashboard/empleados/${empleado.id}`}
                            title="Ver detalle"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cyan-600 transition hover:bg-cyan-50"
                          >
                            <Eye size={17} />
                          </Link>

                          {/* EDITAR */}

                          <button
                            type="button"
                            title="Editar"
                            onClick={() => abrirEditar(empleado)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          {/* ESTADO */}

                          <button
                            type="button"
                            disabled={cambiandoEstado}
                            onClick={() => void handleToggle(empleado)}
                            title={empleado.activo ? "Desactivar" : "Activar"}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                              empleado.activo
                                ? "bg-emerald-500"
                                : "bg-slate-300"
                            } ${
                              cambiandoEstado
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
                                empleado.activo
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>

                          {/* ELIMINAR */}

                          <button
                            type="button"
                            title="Eliminar"
                            disabled={eliminando}
                            onClick={() => void handleDelete(empleado)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================
          MODAL CREAR
      ================================================= */}

      <CreateEmpleadoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={async () => {
          setModalOpen(false);

          await loadEmpleados(false);
        }}
      />

      {/* =================================================
          MODAL EDITAR
      ================================================= */}

      <EditEmpleadoModal
        open={editOpen}
        empleado={selectedEmpleado}
        onClose={cerrarEditar}
        onUpdated={async () => {
          await loadEmpleados(false);

          cerrarEditar();
        }}
      />
    </div>
  );
}

export default EmpleadosPage;
