import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  UserCheck,
  UserRound,
  Users,
  UserX,
  WalletCards,
} from "lucide-react";

import { Link } from "react-router-dom";

import Swal from "sweetalert2";

import {
  getReporteGeneralPersonal,
  type EmpleadoReportePersonal,
  type ReporteGeneralPersonal,
  type TipoPagoEmpleado,
} from "../services/pagoEmpleadoService";

/* =====================================================
   FILTROS
===================================================== */

type FiltroEstado = "todos" | "activo" | "inactivo";

type FiltroTipoPago = "todos" | TipoPagoEmpleado;

type FiltroSituacion = "todos" | "en_obra" | "sin_obra" | "con_pendientes";

/* =====================================================
   VALORES INICIALES
===================================================== */

const REPORTE_VACIO: ReporteGeneralPersonal = {
  resumen: {
    total_personal: 0,
    activos: 0,
    inactivos: 0,
    empleados_en_obra: 0,
    total_pagado: 0,
    total_pendiente: 0,
    pagos_realizados: 0,
    pagos_pendientes: 0,
  },

  empleados: [],
};

/* =====================================================
   MONEDA
===================================================== */

const moneda = (valor?: number | string | null) => {
  const numero = Number(valor ?? 0);

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
   FECHA
===================================================== */

const formatearFecha = (valor?: string | null) => {
  if (!valor) {
    return "-";
  }

  const fecha = valor.split("T")[0];

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [year, month, day] = partes;

  return `${day}/${month}/${year}`;
};

/* =====================================================
   LABEL TIPO PAGO
===================================================== */

const labelTipoPago = (tipo: TipoPagoEmpleado | string | null | undefined) => {
  const labels: Record<string, string> = {
    diario: "Diario",
    semanal: "Semanal",
    quincenal: "Quincenal",
    mensual: "Mensual",
    otro: "Otro",
  };

  if (!tipo) {
    return "-";
  }

  return labels[tipo] ?? tipo;
};

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
   ESCAPAR CSV
===================================================== */

const escaparCsv = (valor: string | number | null | undefined) => {
  const texto = String(valor ?? "").replace(/"/g, '""');

  return `"${texto}"`;
};

/* =====================================================
   COMPONENTE
===================================================== */

function ReportePersonalPage() {
  const [reporte, setReporte] = useState<ReporteGeneralPersonal>(REPORTE_VACIO);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [estado, setEstado] = useState<FiltroEstado>("todos");

  const [tipoPago, setTipoPago] = useState<FiltroTipoPago>("todos");

  const [situacion, setSituacion] = useState<FiltroSituacion>("todos");

  /* =================================================
     CARGAR DATOS
  ================================================= */

  const cargarReporte = useCallback(async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await getReporteGeneralPersonal();

      setReporte(data);
    } catch (error) {
      console.error("Error cargando reporte de personal:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo cargar el reporte",
        text: obtenerMensajeError(
          error,
          "Ocurrió un error al obtener el reporte de personal.",
        ),
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void cargarReporte();
  }, [cargarReporte]);

  /* =================================================
     EMPLEADOS FILTRADOS
  ================================================= */

  const empleadosFiltrados = useMemo(() => {
    const texto = search.trim().toLowerCase();

    return reporte.empleados.filter((empleado) => {
      /* BUSCADOR */

      const textoEmpleado = [
        empleado.empleado_nombre,
        empleado.nombres,
        empleado.apellidos,
        empleado.cedula,
        empleado.cargo,
        empleado.obra_nombre,
        empleado.obra_codigo,
        empleado.cargo_obra,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda = !texto || textoEmpleado.includes(texto);

      /* ESTADO */

      const coincideEstado =
        estado === "todos" ||
        (estado === "activo" && empleado.activo) ||
        (estado === "inactivo" && !empleado.activo);

      /* TIPO PAGO */

      const coincideTipo =
        tipoPago === "todos" || empleado.tipo_pago === tipoPago;

      /* SITUACIÓN */

      let coincideSituacion = true;

      if (situacion === "en_obra") {
        coincideSituacion = Number(empleado.obras_activas ?? 0) > 0;
      }

      if (situacion === "sin_obra") {
        coincideSituacion = Number(empleado.obras_activas ?? 0) === 0;
      }

      if (situacion === "con_pendientes") {
        coincideSituacion = Number(empleado.pagos_pendientes ?? 0) > 0;
      }

      return (
        coincideBusqueda && coincideEstado && coincideTipo && coincideSituacion
      );
    });
  }, [reporte.empleados, search, estado, tipoPago, situacion]);

  /* =================================================
     RESUMEN VISIBLE
  ================================================= */

  const resumenVisible = useMemo(() => {
    return empleadosFiltrados.reduce(
      (acumulado, empleado) => {
        acumulado.total += 1;

        if (empleado.activo) {
          acumulado.activos += 1;
        }

        if (!empleado.activo) {
          acumulado.inactivos += 1;
        }

        if (Number(empleado.obras_activas ?? 0) > 0) {
          acumulado.enObra += 1;
        }

        acumulado.pagado += Number(empleado.total_pagado ?? 0);

        acumulado.pendiente += Number(empleado.pagos_pendientes ?? 0);

        return acumulado;
      },
      {
        total: 0,
        activos: 0,
        inactivos: 0,
        enObra: 0,
        pagado: 0,
        pendiente: 0,
      },
    );
  }, [empleadosFiltrados]);

  /* =================================================
     ALERTAS
  ================================================= */

  const empleadosConPendientes = useMemo(
    () =>
      reporte.empleados
        .filter((empleado) => Number(empleado.pagos_pendientes ?? 0) > 0)
        .sort(
          (a, b) => Number(b.pagos_pendientes) - Number(a.pagos_pendientes),
        ),
    [reporte.empleados],
  );

  /* =================================================
     LIMPIAR FILTROS
  ================================================= */

  const limpiarFiltros = () => {
    setSearch("");

    setEstado("todos");

    setTipoPago("todos");

    setSituacion("todos");
  };

  const hayFiltros =
    search.trim() !== "" ||
    estado !== "todos" ||
    tipoPago !== "todos" ||
    situacion !== "todos";

  /* =================================================
     EXPORTAR PDF
  ================================================= */

  const exportarPdf = () => {
    window.print();
  };

  /* =================================================
     EXPORTAR EXCEL / CSV
  ================================================= */

  const exportarExcel = () => {
    if (empleadosFiltrados.length === 0) {
      void Swal.fire({
        icon: "warning",
        title: "Sin datos para exportar",
        text: "No existen registros visibles para exportar.",
      });

      return;
    }

    const encabezados = [
      "Empleado",
      "Cedula",
      "Cargo",
      "Estado",
      "Tipo pago",
      "Salario base",
      "Obra actual",
      "Codigo obra",
      "Cargo en obra",
      "Obras activas",
      "Total asignaciones",
      "Pagos realizados",
      "Total pagado",
      "Pagos pendientes",
      "Monto pendiente",
      "Fecha ingreso",
    ];

    const filas = empleadosFiltrados.map((empleado) => [
      empleado.empleado_nombre,
      empleado.cedula,
      empleado.cargo ?? "",
      empleado.activo ? "Activo" : "Inactivo",
      labelTipoPago(empleado.tipo_pago),
      Number(empleado.salario_base ?? 0).toFixed(2),
      empleado.obra_nombre ?? "",
      empleado.obra_codigo ?? "",
      empleado.cargo_obra ?? "",
      empleado.obras_activas,
      empleado.total_asignaciones,
      empleado.pagos_realizados,
      Number(empleado.total_pagado ?? 0).toFixed(2),
      empleado.pagos_pendientes_cantidad,
      Number(empleado.pagos_pendientes ?? 0).toFixed(2),
      empleado.fecha_ingreso ? formatearFecha(empleado.fecha_ingreso) : "",
    ]);

    const csv = [
      encabezados.map(escaparCsv),
      ...filas.map((fila) => fila.map(escaparCsv)),
    ]
      .map((fila) => fila.join(";"))
      .join("\n");

    const contenido = "\uFEFF" + csv;

    const blob = new Blob([contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    const fecha = new Date();

    const nombreFecha = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, "0"),
      String(fecha.getDate()).padStart(2, "0"),
    ].join("-");

    link.href = url;

    link.download = `reporte-personal-${nombreFecha}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =================================================
     LOADING
  ================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--color-primary)]" />

          <p className="mt-4 text-sm text-slate-500">
            Generando reporte de personal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="reporte-personal">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[var(--color-primary)]">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Reporte de Personal
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Consolidado de empleados, obras y pagos registrados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void cargarReporte(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={exportarExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <FileSpreadsheet size={17} />
            Exportar Excel
          </button>

          <button
            type="button"
            onClick={exportarPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Download size={17} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* =================================================
          CABECERA PARA IMPRESIÓN
      ================================================= */}

      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Reporte de Personal</h1>

        <p className="mt-1 text-sm">ConstructSys - Gestión de personal</p>
      </div>

      {/* =================================================
          KPIs
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Personal total"
          value={String(reporte.resumen.total_personal)}
          description={`${reporte.resumen.activos} activos`}
          icon={<Users size={21} />}
          variant="default"
        />

        <KpiCard
          title="Personal activo"
          value={String(reporte.resumen.activos)}
          description={`${reporte.resumen.inactivos} inactivos`}
          icon={<UserCheck size={21} />}
          variant="success"
        />

        <KpiCard
          title="En obras"
          value={String(reporte.resumen.empleados_en_obra)}
          description="Con asignación vigente"
          icon={<Building2 size={21} />}
          variant="info"
        />

        <KpiCard
          title="Total pagado"
          value={moneda(reporte.resumen.total_pagado)}
          description={`${reporte.resumen.pagos_realizados} pagos realizados`}
          icon={<CircleDollarSign size={21} />}
          variant="success"
        />

        <KpiCard
          title="Pendiente"
          value={moneda(reporte.resumen.total_pendiente)}
          description={`${reporte.resumen.pagos_pendientes} pagos pendientes`}
          icon={<WalletCards size={21} />}
          variant="warning"
        />
      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {/* BUSCAR */}

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar empleado, cédula, cargo u obra..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* ESTADO */}

          <div className="relative min-w-[170px]">
            <UserCheck
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={estado}
              onChange={(event) =>
                setEstado(event.target.value as FiltroEstado)
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-700 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            >
              <option value="todos">Todos</option>

              <option value="activo">Activos</option>

              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          {/* TIPO PAGO */}

          <div className="relative min-w-[180px]">
            <Banknote
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={tipoPago}
              onChange={(event) =>
                setTipoPago(event.target.value as FiltroTipoPago)
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-700 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            >
              <option value="todos">Todos los pagos</option>

              <option value="diario">Diario</option>

              <option value="semanal">Semanal</option>

              <option value="quincenal">Quincenal</option>

              <option value="mensual">Mensual</option>

              <option value="otro">Otro</option>
            </select>
          </div>

          {/* SITUACIÓN */}

          <div className="relative min-w-[195px]">
            <Filter
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={situacion}
              onChange={(event) =>
                setSituacion(event.target.value as FiltroSituacion)
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-700 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            >
              <option value="todos">Todas las situaciones</option>

              <option value="en_obra">En obra</option>

              <option value="sin_obra">Sin obra activa</option>

              <option value="con_pendientes">Con pagos pendientes</option>
            </select>
          </div>

          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Mostrando{" "}
            <strong className="text-slate-700">
              {empleadosFiltrados.length}
            </strong>{" "}
            de{" "}
            <strong className="text-slate-700">
              {reporte.empleados.length}
            </strong>{" "}
            empleados
          </span>

          {hayFiltros && (
            <span>
              Pagado visible:{" "}
              <strong className="text-emerald-600">
                {moneda(resumenVisible.pagado)}
              </strong>
              {" · "}
              Pendiente visible:{" "}
              <strong className="text-amber-600">
                {moneda(resumenVisible.pendiente)}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* =================================================
          ALERTA PAGOS PENDIENTES
      ================================================= */}

      {empleadosConPendientes.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 print:hidden">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle size={20} />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Pagos pendientes</h3>

              <p className="mt-1 text-sm text-amber-800/80">
                Hay {empleadosConPendientes.length}{" "}
                {empleadosConPendientes.length === 1 ? "empleado" : "empleados"}{" "}
                con montos pendientes por confirmar.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {empleadosConPendientes.slice(0, 5).map((empleado) => (
                  <Link
                    key={empleado.id}
                    to={`/dashboard/empleados/${empleado.id}`}
                    className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    {empleado.empleado_nombre}
                    {" · "}
                    {moneda(empleado.pagos_pendientes)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Detalle del personal</h2>

              <p className="mt-1 text-xs text-slate-500">
                Información laboral, asignaciones y estado de pagos.
              </p>
            </div>

            <span className="text-xs text-slate-400">Datos consolidados</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <TableHeader>Empleado</TableHeader>

                <TableHeader>Cargo</TableHeader>

                <TableHeader>Obra actual</TableHeader>

                <TableHeader>Tipo pago</TableHeader>

                <TableHeader>Salario base</TableHeader>

                <TableHeader>Asignaciones</TableHeader>

                <TableHeader>Pagado</TableHeader>

                <TableHeader>Pendiente</TableHeader>

                <TableHeader>Estado</TableHeader>

                <TableHeader align="right">Acción</TableHeader>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {empleadosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <UserRound size={25} />
                    </div>

                    <h3 className="mt-4 font-bold text-slate-700">
                      No se encontraron empleados
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Ajuste los filtros utilizados.
                    </p>
                  </td>
                </tr>
              )}

              {empleadosFiltrados.map((empleado) => (
                <EmpleadoRow key={empleado.id} empleado={empleado} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          RESUMEN INFERIOR
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResumenCard
          title="Personal visible"
          value={String(resumenVisible.total)}
          description={`${resumenVisible.activos} activos · ${resumenVisible.inactivos} inactivos`}
          icon={<Users size={20} />}
        />

        <ResumenCard
          title="Pagado visible"
          value={moneda(resumenVisible.pagado)}
          description="Pagos confirmados"
          icon={<CircleDollarSign size={20} />}
        />

        <ResumenCard
          title="Pendiente visible"
          value={moneda(resumenVisible.pendiente)}
          description="Pagos pendientes"
          icon={<WalletCards size={20} />}
        />
      </div>
    </div>
  );
}

/* =====================================================
   FILA EMPLEADO
===================================================== */

function EmpleadoRow({ empleado }: { empleado: EmpleadoReportePersonal }) {
  const tienePendiente = Number(empleado.pagos_pendientes ?? 0) > 0;

  const tieneObra = Number(empleado.obras_activas ?? 0) > 0;

  return (
    <tr className="transition hover:bg-slate-50/80">
      {/* EMPLEADO */}

      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-bold uppercase text-[var(--color-primary)]">
            {empleado.nombres?.charAt(0)}
            {empleado.apellidos?.charAt(0)}
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              {empleado.empleado_nombre}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              CI: {empleado.cedula}
            </p>

            {empleado.fecha_ingreso && (
              <p className="mt-0.5 text-xs text-slate-400">
                Ingreso: {formatearFecha(empleado.fecha_ingreso)}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* CARGO */}

      <td className="px-4 py-4">
        <p className="text-sm font-medium text-slate-700">
          {empleado.cargo || "-"}
        </p>

        {empleado.cargo_obra && empleado.cargo_obra !== empleado.cargo && (
          <p className="mt-1 text-xs text-slate-400">
            En obra: {empleado.cargo_obra}
          </p>
        )}
      </td>

      {/* OBRA */}

      <td className="px-4 py-4">
        {tieneObra && empleado.obra_id ? (
          <Link
            to={`/dashboard/obras/${empleado.obra_id}`}
            className="group block"
          >
            <p className="font-medium text-blue-600 group-hover:underline">
              {empleado.obra_nombre || "Ver obra"}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {empleado.obra_codigo || "Sin código"}
            </p>

            <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {empleado.obras_activas}{" "}
              {empleado.obras_activas === 1 ? "obra activa" : "obras activas"}
            </span>
          </Link>
        ) : (
          <div>
            {empleado.obra_nombre ? (
              <>
                <p className="text-sm text-slate-500">{empleado.obra_nombre}</p>

                <p className="mt-1 text-xs text-slate-400">Última asignación</p>
              </>
            ) : (
              <span className="text-sm text-slate-400">Sin obra asignada</span>
            )}
          </div>
        )}
      </td>

      {/* TIPO */}

      <td className="px-4 py-4">
        <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
          {labelTipoPago(empleado.tipo_pago)}
        </span>
      </td>

      {/* SALARIO */}

      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
        {empleado.salario_base !== null && empleado.salario_base !== undefined
          ? moneda(empleado.salario_base)
          : "-"}
      </td>

      {/* ASIGNACIONES */}

      <td className="px-4 py-4">
        <div>
          <p className="text-sm font-bold text-slate-700">
            {empleado.total_asignaciones}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {empleado.obras_activas} activas
          </p>
        </div>
      </td>

      {/* PAGADO */}

      <td className="px-4 py-4">
        <p className="text-sm font-bold text-emerald-600">
          {moneda(empleado.total_pagado)}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {empleado.pagos_realizados}{" "}
          {empleado.pagos_realizados === 1 ? "pago" : "pagos"}
        </p>
      </td>

      {/* PENDIENTE */}

      <td className="px-4 py-4">
        <p
          className={`text-sm font-bold ${
            tienePendiente ? "text-amber-600" : "text-slate-500"
          }`}
        >
          {moneda(empleado.pagos_pendientes)}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {empleado.pagos_pendientes_cantidad} pendientes
        </p>
      </td>

      {/* ESTADO */}

      <td className="px-4 py-4">
        {empleado.activo ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            <UserX size={13} />
            Inactivo
          </span>
        )}
      </td>

      {/* ACCIÓN */}

      <td className="px-4 py-4 text-right print:hidden">
        <Link
          to={`/dashboard/empleados/${empleado.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[var(--color-primary)] hover:bg-orange-50 hover:text-[var(--color-primary)]"
        >
          Ver ficha
          <ChevronRight size={14} />
        </Link>
      </td>
    </tr>
  );
}

/* =====================================================
   KPI
===================================================== */

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;

  variant: "default" | "success" | "warning" | "info";
}

function KpiCard({ title, value, description, icon, variant }: KpiCardProps) {
  const styles = {
    default: {
      icon: "bg-slate-100 text-slate-600",
      value: "text-slate-900",
    },

    success: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },

    warning: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-600",
    },

    info: {
      icon: "bg-blue-50 text-blue-600",
      value: "text-blue-600",
    },
  };

  const config = styles[variant];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className={`mt-2 text-2xl font-bold ${config.value}`}>{value}</p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   RESUMEN
===================================================== */

interface ResumenCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function ResumenCard({ title, value, description, icon }: ResumenCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>

          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   TABLE HEADER
===================================================== */

interface TableHeaderProps {
  children: React.ReactNode;

  align?: "left" | "right";
}

function TableHeader({ children, align = "left" }: TableHeaderProps) {
  return (
    <th
      className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export default ReportePersonalPage;
