import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Edit3,
  FileText,
  History,
  IdCard,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import Swal from "sweetalert2";

import EditEmpleadoModal from "../components/EditEmpleadoModal";

import {
  getEmpleadoActividad,
  getEmpleadoById,
  getEmpleadoObras,
  getEmpleadoPagos,
  getEmpleadoResumen,
  type Empleado,
  type EmpleadoActividad,
  type EmpleadoObra,
  type EmpleadoPago,
  type EmpleadoResumen,
  type TipoPagoEmpleado,
} from "../services/empleadosService";

/* =====================================================
   TABS
===================================================== */

type TabEmpleado = "info" | "obras" | "pagos" | "actividad";

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
   FECHAS
===================================================== */

const formatearFecha = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const fecha = value.split("T")[0];

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [year, month, day] = partes;

  return `${day}/${month}/${year}`;
};

/* =====================================================
   MONEDA
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

const tipoPagoLabel = (value?: TipoPagoEmpleado | string | null) => {
  const labels: Record<string, string> = {
    diario: "Diario",
    semanal: "Semanal",
    quincenal: "Quincenal",
    mensual: "Mensual",
    otro: "Otro",
  };

  return value ? (labels[value] ?? value) : "-";
};

/* =====================================================
   LABEL ESTADO PAGO
===================================================== */

const estadoPagoLabel = (estado?: string | null) => {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    pagado: "Pagado",
    anulado: "Anulado",
  };

  return estado ? (labels[estado] ?? estado) : "-";
};

/* =====================================================
   COMPONENTE
===================================================== */

function EmpleadoDetailPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const [tab, setTab] = useState<TabEmpleado>("info");

  const [empleado, setEmpleado] = useState<Empleado | null>(null);

  const [resumen, setResumen] = useState<EmpleadoResumen | null>(null);

  const [obras, setObras] = useState<EmpleadoObra[]>([]);

  const [pagos, setPagos] = useState<EmpleadoPago[]>([]);

  const [actividad, setActividad] = useState<EmpleadoActividad[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  /* =================================================
     CARGAR TODO
  ================================================= */

  const cargarEmpleado = useCallback(
    async (mostrarCarga = true) => {
      if (!id) {
        return;
      }

      try {
        if (mostrarCarga) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const [empleadoData, resumenData, obrasData, pagosData, actividadData] =
          await Promise.all([
            getEmpleadoById(id),

            getEmpleadoResumen(id),

            getEmpleadoObras(id),

            getEmpleadoPagos(id),

            getEmpleadoActividad(id),
          ]);

        setEmpleado(empleadoData);

        setResumen(resumenData);

        setObras(obrasData);

        setPagos(pagosData);

        setActividad(actividadData);
      } catch (error) {
        console.error("Error cargando detalle del empleado:", error);

        await Swal.fire({
          icon: "error",
          title: "No se pudo cargar el empleado",
          text: obtenerMensajeError(
            error,
            "Ocurrió un error al obtener la información del empleado.",
          ),
          confirmButtonText: "Aceptar",
        });
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void cargarEmpleado();
  }, [cargarEmpleado]);

  /* =================================================
     RESUMEN PAGOS
  ================================================= */

  const resumenPagos = useMemo(() => {
    let totalPagado = 0;
    let totalPendiente = 0;
    let pagados = 0;
    let pendientes = 0;

    pagos.forEach((pago) => {
      const monto = Number(pago.monto ?? 0);

      if (pago.estado === "pagado") {
        totalPagado += monto;

        pagados += 1;
      }

      if (pago.estado === "pendiente") {
        totalPendiente += monto;

        pendientes += 1;
      }
    });

    return {
      totalPagado,
      totalPendiente,
      pagados,
      pendientes,
    };
  }, [pagos]);

  /* =================================================
     OBRAS ACTIVAS
  ================================================= */

  const obrasActivas = useMemo(
    () => obras.filter((obra) => obra.activo),
    [obras],
  );

  /* =================================================
     LOADING
  ================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--color-primary)]" />

          <p className="mt-4 text-sm text-slate-500">
            Cargando información del empleado...
          </p>
        </div>
      </div>
    );
  }

  /* =================================================
     NO ENCONTRADO
  ================================================= */

  if (!empleado) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <UserRound size={42} className="mx-auto text-slate-300" />

        <h2 className="mt-4 text-lg font-bold text-slate-800">
          Empleado no encontrado
        </h2>

        <Link
          to="/dashboard/empleados"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft size={17} />
          Volver a empleados
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =================================================
          NAVEGACIÓN SUPERIOR
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/dashboard/empleados"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[var(--color-primary)]"
        >
          <ArrowLeft size={17} />
          Volver a empleados
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void cargarEmpleado(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Edit3 size={16} />
            Editar
          </button>
        </div>
      </div>

      {/* =================================================
          HEADER PERFIL
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl font-bold uppercase text-[var(--color-primary)]">
                {empleado.nombres.charAt(0)}
                {empleado.apellidos.charAt(0)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {empleado.nombres} {empleado.apellidos}
                  </h1>

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
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <BriefcaseBusiness size={15} />

                  {empleado.cargo || "Sin cargo registrado"}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <IdCard size={14} />
                    CI: {empleado.cedula}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    Ingreso: {formatearFecha(empleado.fecha_ingreso)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Modalidad de pago
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {tipoPagoLabel(empleado.tipo_pago)}
              </p>

              <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                {empleado.salario_base !== null &&
                empleado.salario_base !== undefined
                  ? formatearMoneda(empleado.salario_base)
                  : "Sin salario base"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          KPIs
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* OBRAS ACTIVAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Obras activas
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {Number(resumen?.obras_activas ?? obrasActivas.length)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Asignaciones vigentes
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={21} />
            </div>
          </div>
        </div>

        {/* TOTAL ASIGNACIONES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Asignaciones</p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {Number(resumen?.total_asignaciones ?? obras.length)}
              </p>

              <p className="mt-1 text-xs text-slate-400">Historial de obras</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <BriefcaseBusiness size={21} />
            </div>
          </div>
        </div>

        {/* TOTAL PAGADO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total pagado</p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {formatearMoneda(
                  resumen?.total_pagado ?? resumenPagos.totalPagado,
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">Pagos confirmados</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CircleDollarSign size={21} />
            </div>
          </div>
        </div>

        {/* PENDIENTE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pendiente</p>

              <p className="mt-2 text-2xl font-bold text-amber-600">
                {formatearMoneda(
                  resumen?.total_pendiente ?? resumenPagos.totalPendiente,
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">Por confirmar</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max px-2">
            <TabButton
              active={tab === "info"}
              label="Información"
              icon={<UserRound size={17} />}
              onClick={() => setTab("info")}
            />

            <TabButton
              active={tab === "obras"}
              label={`Obras (${obras.length})`}
              icon={<Building2 size={17} />}
              onClick={() => setTab("obras")}
            />

            <TabButton
              active={tab === "pagos"}
              label={`Pagos (${pagos.length})`}
              icon={<Banknote size={17} />}
              onClick={() => setTab("pagos")}
            />

            <TabButton
              active={tab === "actividad"}
              label="Actividad"
              icon={<Activity size={17} />}
              onClick={() => setTab("actividad")}
            />
          </div>
        </div>

        {/* =================================================
            INFORMACIÓN
        ================================================= */}

        {tab === "info" && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* PERSONAL */}

              <div className="rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-bold text-slate-800">Datos personales</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Información de identificación y contacto.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                  <InfoItem
                    icon={<IdCard size={18} />}
                    label="Cédula"
                    value={empleado.cedula}
                  />

                  <InfoItem
                    icon={<CalendarDays size={18} />}
                    label="Fecha de nacimiento"
                    value={formatearFecha(empleado.fecha_nacimiento)}
                  />

                  <InfoItem
                    icon={<Phone size={18} />}
                    label="Teléfono"
                    value={empleado.telefono || "-"}
                  />

                  <InfoItem
                    icon={<Mail size={18} />}
                    label="Correo"
                    value={empleado.correo || "-"}
                  />

                  <div className="sm:col-span-2">
                    <InfoItem
                      icon={<MapPin size={18} />}
                      label="Dirección"
                      value={empleado.direccion || "-"}
                    />
                  </div>
                </div>
              </div>

              {/* LABORAL */}

              <div className="rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-bold text-slate-800">
                    Información laboral
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Condiciones generales del empleado.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                  <InfoItem
                    icon={<BriefcaseBusiness size={18} />}
                    label="Cargo"
                    value={empleado.cargo || "-"}
                  />

                  <InfoItem
                    icon={<CreditCard size={18} />}
                    label="Tipo de pago"
                    value={tipoPagoLabel(empleado.tipo_pago)}
                  />

                  <InfoItem
                    icon={<CircleDollarSign size={18} />}
                    label="Salario base"
                    value={
                      empleado.salario_base !== null &&
                      empleado.salario_base !== undefined
                        ? formatearMoneda(empleado.salario_base)
                        : "-"
                    }
                  />

                  <InfoItem
                    icon={<CalendarDays size={18} />}
                    label="Fecha de ingreso"
                    value={formatearFecha(empleado.fecha_ingreso)}
                  />

                  <InfoItem
                    icon={
                      empleado.activo ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <XCircle size={18} />
                      )
                    }
                    label="Estado"
                    value={empleado.activo ? "Activo" : "Inactivo"}
                  />

                  <InfoItem
                    icon={<Building2 size={18} />}
                    label="Obras activas"
                    value={String(
                      resumen?.obras_activas ?? obrasActivas.length,
                    )}
                  />
                </div>
              </div>
            </div>

            {/* OBSERVACIONES */}

            <div className="mt-6 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <FileText size={18} className="text-slate-400" />

                <h3 className="font-bold text-slate-800">Observaciones</h3>
              </div>

              <div className="p-5">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {empleado.observaciones ||
                    "No existen observaciones registradas para este empleado."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            OBRAS
        ================================================= */}

        {tab === "obras" && (
          <div className="p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Obras asignadas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Historial de asignaciones del empleado a obras.
                </p>
              </div>

              <div className="text-sm text-slate-500">
                {obrasActivas.length} activas de {obras.length}
              </div>
            </div>

            {obras.length === 0 ? (
              <EmptyState
                icon={<Building2 size={27} />}
                title="Sin obras asignadas"
                description="Este empleado todavía no tiene asignaciones registradas."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <TableHeader>Obra</TableHeader>

                        <TableHeader>Cargo en obra</TableHeader>

                        <TableHeader>Inicio</TableHeader>

                        <TableHeader>Finalización</TableHeader>

                        <TableHeader>Salario acordado</TableHeader>

                        <TableHeader>Estado</TableHeader>

                        <TableHeader align="right">Acción</TableHeader>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {obras.map((obra) => (
                        <tr
                          key={obra.asignacion_id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Building2 size={17} />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  {obra.obra_nombre || "Obra"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  {obra.obra_codigo || "Sin código"}
                                </p>

                                {obra.obra_ubicacion && (
                                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin size={12} />

                                    {obra.obra_ubicacion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {obra.cargo_obra || empleado.cargo || "-"}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {formatearFecha(
                              obra.fecha_inicio || obra.fecha_asignacion,
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {obra.fecha_fin
                              ? formatearFecha(obra.fecha_fin)
                              : "-"}
                          </td>

                          <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                            {obra.salario_acordado !== null &&
                            obra.salario_acordado !== undefined
                              ? formatearMoneda(obra.salario_acordado)
                              : "-"}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                obra.activo
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {obra.activo ? "Asignado" : "Finalizado"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <Link
                              to={`/dashboard/obras/${obra.obra_id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              Ver obra
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            PAGOS
        ================================================= */}

        {tab === "pagos" && (
          <div className="p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Historial de pagos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pagos registrados para este empleado y sus respectivas obras.
              </p>
            </div>

            {/* RESUMEN PAGOS */}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MiniKpi
                icon={<CircleDollarSign size={19} />}
                title="Pagado"
                value={formatearMoneda(resumenPagos.totalPagado)}
                variant="success"
              />

              <MiniKpi
                icon={<Clock3 size={19} />}
                title="Pendiente"
                value={formatearMoneda(resumenPagos.totalPendiente)}
                variant="warning"
              />

              <MiniKpi
                icon={<WalletCards size={19} />}
                title="Pagos realizados"
                value={String(
                  resumen?.pagos_realizados ?? resumenPagos.pagados,
                )}
                variant="default"
              />
            </div>

            {pagos.length === 0 ? (
              <EmptyState
                icon={<Banknote size={27} />}
                title="Sin pagos registrados"
                description="Todavía no existen pagos asociados a este empleado."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-[1050px] w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <TableHeader>Periodo</TableHeader>

                        <TableHeader>Obra</TableHeader>

                        <TableHeader>Tipo</TableHeader>

                        <TableHeader>Monto</TableHeader>

                        <TableHeader>Fecha pago</TableHeader>

                        <TableHeader>Método</TableHeader>

                        <TableHeader>Estado</TableHeader>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {pagos.map((pago) => (
                        <tr
                          key={pago.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800">
                              {pago.periodo_descripcion || "-"}
                            </p>

                            {(pago.fecha_inicio_periodo ||
                              pago.fecha_fin_periodo) && (
                              <p className="mt-1 text-xs text-slate-400">
                                {formatearFecha(pago.fecha_inicio_periodo)}

                                {" - "}

                                {formatearFecha(pago.fecha_fin_periodo)}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm">
                            {pago.obra_id ? (
                              <Link
                                to={`/dashboard/obras/${pago.obra_id}`}
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {pago.obra_nombre || "Ver obra"}
                              </Link>
                            ) : (
                              <span className="text-slate-500">
                                Administrativo
                              </span>
                            )}

                            {pago.obra_codigo && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                {pago.obra_codigo}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm capitalize text-slate-600">
                            {tipoPagoLabel(pago.tipo_pago)}
                          </td>

                          <td className="px-4 py-4 text-sm font-bold text-slate-800">
                            {formatearMoneda(pago.monto)}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {formatearFecha(pago.fecha_pago)}
                          </td>

                          <td className="px-4 py-4 text-sm capitalize text-slate-600">
                            {pago.metodo_pago
                              ? pago.metodo_pago.replace("_", " ")
                              : "-"}
                          </td>

                          <td className="px-4 py-4">
                            <EstadoPago estado={pago.estado} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            ACTIVIDAD
        ================================================= */}

        {tab === "actividad" && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Actividad del empleado
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Línea de tiempo generada a partir de asignaciones y pagos
                registrados.
              </p>
            </div>

            {actividad.length === 0 ? (
              <EmptyState
                icon={<History size={27} />}
                title="Sin actividad registrada"
                description="No existen movimientos de asignaciones o pagos para este empleado."
              />
            ) : (
              <div className="relative">
                <div className="absolute bottom-4 left-[19px] top-4 w-px bg-slate-200" />

                <div className="space-y-5">
                  {actividad.map((item, index) => (
                    <ActividadItem
                      key={`${item.id}-${item.tipo}-${index}`}
                      item={item}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================
          MODAL EDITAR
      ================================================= */}

      <EditEmpleadoModal
        open={editOpen}
        empleado={empleado}
        onClose={() => setEditOpen(false)}
        onUpdated={async () => {
          await cargarEmpleado(false);

          setEditOpen(false);
        }}
      />
    </div>
  );
}

/* =====================================================
   TAB BUTTON
===================================================== */

interface TabButtonProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function TabButton({ active, label, icon, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-5 py-4 text-sm font-semibold transition ${
        active
          ? "text-[var(--color-primary)]"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {icon}

      {label}

      {active && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--color-primary)]" />
      )}
    </button>
  );
}

/* =====================================================
   INFO ITEM
===================================================== */

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
          {value}
        </p>
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

/* =====================================================
   ESTADO PAGO
===================================================== */

function EstadoPago({ estado }: { estado: string }) {
  if (estado === "pagado") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={13} />
        Pagado
      </span>
    );
  }

  if (estado === "pendiente") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Clock3 size={13} />
        Pendiente
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <XCircle size={13} />

      {estadoPagoLabel(estado)}
    </span>
  );
}

/* =====================================================
   MINI KPI
===================================================== */

interface MiniKpiProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  variant: "success" | "warning" | "default";
}

function MiniKpi({ icon, title, value, variant }: MiniKpiProps) {
  const config = {
    success: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },

    warning: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-600",
    },

    default: {
      icon: "bg-slate-100 text-slate-600",
      value: "text-slate-900",
    },
  };

  const styles = config[variant];

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.icon}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p className={`mt-1 text-lg font-bold ${styles.value}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-slate-700">{title}</h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =====================================================
   ACTIVIDAD ITEM
===================================================== */

function ActividadItem({ item }: { item: EmpleadoActividad }) {
  const obtenerConfig = () => {
    switch (item.tipo) {
      case "asignacion":
        return {
          icon: <Building2 size={17} />,
          iconClass: "bg-blue-50 text-blue-600",
        };

      case "fin_asignacion":
        return {
          icon: <XCircle size={17} />,
          iconClass: "bg-slate-100 text-slate-600",
        };

      case "pago":
        return {
          icon: <CircleDollarSign size={17} />,
          iconClass: "bg-emerald-50 text-emerald-600",
        };

      default:
        return {
          icon: <Activity size={17} />,
          iconClass: "bg-slate-100 text-slate-600",
        };
    }
  };

  const config = obtenerConfig();

  return (
    <div className="relative flex gap-4">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white ${config.iconClass}`}
      >
        {config.icon}
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">{item.titulo}</h3>

            {item.descripcion && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {item.descripcion}
              </p>
            )}

            {item.obra_nombre && (
              <div className="mt-2">
                {item.obra_id ? (
                  <Link
                    to={`/dashboard/obras/${item.obra_id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Building2 size={13} />

                    {item.obra_nombre}

                    {item.obra_codigo ? ` · ${item.obra_codigo}` : ""}
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500">
                    {item.obra_nombre}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <CalendarDays size={13} />

              {formatearFecha(item.fecha)}
            </p>

            {item.monto !== null && item.monto !== undefined && (
              <p className="mt-1 text-sm font-bold text-emerald-600">
                {formatearMoneda(item.monto)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmpleadoDetailPage;
