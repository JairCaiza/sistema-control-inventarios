import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileDown,
  Filter,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  WalletCards,
} from "lucide-react";

import Swal from "sweetalert2";

import {
  getDevoluciones,
  getResumenDevoluciones,
  type Devolucion,
  type EstadoPenalidad,
  type ResumenDevoluciones,
} from "../services/devolucionService";

import DevolucionesTable from "../components/DevolucionesTable";

import RegistrarDevolucionModal from "../components/RegistrarDevolucionModal";

/* =====================================================
   TIPOS FILTROS
===================================================== */

type FiltroRetraso = "todos" | "sin_retraso" | "con_retraso";

type FiltroPenalidad = "todos" | EstadoPenalidad;

/* =====================================================
   RESUMEN VACÍO
===================================================== */

const RESUMEN_VACIO: ResumenDevoluciones = {
  total_devoluciones: 0,
  sin_retraso: 0,
  con_retraso: 0,
  penalidades_generadas: 0,
  penalidades_cobradas: 0,
  penalidades_pendientes: 0,
  total_generado: 0,
};

/* =====================================================
   FORMATEAR MONEDA
===================================================== */

const moneda = (valor: number | string | null | undefined): string => {
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
   MENSAJE ERROR API
===================================================== */

const obtenerMensajeError = (error: unknown, fallback: string): string => {
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
   COMPONENTE
===================================================== */

function DevolucionesPage() {
  const [data, setData] = useState<Devolucion[]>([]);

  const [resumen, setResumen] = useState<ResumenDevoluciones>(RESUMEN_VACIO);

  const [openModal, setOpenModal] = useState(false);

  const [contratoId, setContratoId] = useState("");

  const [search, setSearch] = useState("");

  const [filtroRetraso, setFiltroRetraso] = useState<FiltroRetraso>("todos");

  const [filtroPenalidad, setFiltroPenalidad] =
    useState<FiltroPenalidad>("todos");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  /* =================================================
     CARGAR DATOS
  ================================================= */

  const loadData = useCallback(async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [devoluciones, resumenData] = await Promise.all([
        getDevoluciones(),
        getResumenDevoluciones(),
      ]);

      setData(devoluciones);

      setResumen(resumenData);
    } catch (error) {
      console.error("Error cargando devoluciones:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudieron cargar las devoluciones",

        text: obtenerMensajeError(
          error,
          "Ocurrió un error al consultar la información.",
        ),

        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =================================================
     NUEVA DEVOLUCIÓN
  ================================================= */

  const handleNuevaDevolucion = () => {
    setContratoId("");
    setOpenModal(true);
  };

  /* =================================================
     FILTRADO
  ================================================= */

  const filteredData = useMemo(() => {
    const text = search.trim().toLowerCase();

    return data.filter((item) => {
      const contenido = [
        item.numero_contrato,
        item.cliente,
        item.contrato_id,
        item.estado_penalidad,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda = !text || contenido.includes(text);

      let coincideRetraso = true;

      if (filtroRetraso === "sin_retraso") {
        coincideRetraso = Number(item.dias_retraso ?? 0) === 0;
      }

      if (filtroRetraso === "con_retraso") {
        coincideRetraso = Number(item.dias_retraso ?? 0) > 0;
      }

      const coincidePenalidad =
        filtroPenalidad === "todos" ||
        item.estado_penalidad === filtroPenalidad;

      return coincideBusqueda && coincideRetraso && coincidePenalidad;
    });
  }, [data, search, filtroRetraso, filtroPenalidad]);

  /* =================================================
     RESUMEN SEGÚN FILTROS
  ================================================= */

  const resumenVisible = useMemo(() => {
    return filteredData.reduce(
      (acumulado, item) => {
        acumulado.total += 1;

        if (Number(item.dias_retraso ?? 0) > 0) {
          acumulado.conRetraso += 1;
        } else {
          acumulado.sinRetraso += 1;
        }

        acumulado.valorContratos += Number(item.valor_contrato ?? 0);

        acumulado.penalidades += Number(item.penalidad_total ?? 0);

        acumulado.totalGenerado += Number(item.total_generado ?? 0);

        acumulado.penalidadPagada += Number(item.penalidad_pagada ?? 0);

        acumulado.penalidadPendiente += Number(item.penalidad_pendiente ?? 0);

        return acumulado;
      },
      {
        total: 0,
        conRetraso: 0,
        sinRetraso: 0,
        valorContratos: 0,
        penalidades: 0,
        totalGenerado: 0,
        penalidadPagada: 0,
        penalidadPendiente: 0,
      },
    );
  }, [filteredData]);

  /* =================================================
     FILTROS
  ================================================= */

  const hayFiltros =
    search.trim() !== "" ||
    filtroRetraso !== "todos" ||
    filtroPenalidad !== "todos";

  const limpiarFiltros = () => {
    setSearch("");

    setFiltroRetraso("todos");

    setFiltroPenalidad("todos");
  };

  /* =================================================
     EXPORTAR PDF
  ================================================= */

  const handleExportarPdf = () => {
    if (filteredData.length === 0) {
      void Swal.fire({
        icon: "warning",

        title: "Sin datos para exportar",

        text: "No existen devoluciones visibles para generar el reporte.",
      });

      return;
    }

    window.print();
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
            Cargando devoluciones...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="reporte-devoluciones">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Devoluciones</h1>

          <p className="mt-1 text-slate-500">
            Control de retorno de activos, penalidades y cierre de contratos.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportarPdf}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={() => void loadData(false)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={handleNuevaDevolucion}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={18} />
            Registrar devolución
          </button>
        </div>
      </div>

      {/* =================================================
          HEADER PARA IMPRESIÓN
      ================================================= */}

      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Reporte de Devoluciones</h1>

        <p className="mt-1 text-sm">ConstructSys - Gestión de alquileres</p>
      </div>

      {/* =================================================
          KPIS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Devoluciones"
          value={String(resumen.total_devoluciones)}
          description={`${resumen.sin_retraso} sin retraso`}
          icon={<RotateCcw size={21} />}
          variant="info"
        />

        <KpiCard
          title="Con retraso"
          value={String(resumen.con_retraso)}
          description={`${resumen.total_devoluciones} devoluciones registradas`}
          icon={<Clock3 size={21} />}
          variant="warning"
        />

        <KpiCard
          title="Penalidades generadas"
          value={moneda(resumen.penalidades_generadas)}
          description={`Cobradas: ${moneda(resumen.penalidades_cobradas)}`}
          icon={<CircleDollarSign size={21} />}
          variant="danger"
        />

        <KpiCard
          title="Pendiente de cobro"
          value={moneda(resumen.penalidades_pendientes)}
          description={`Total generado: ${moneda(resumen.total_generado)}`}
          icon={<WalletCards size={21} />}
          variant="warning"
        />
      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por contrato, cliente o identificador..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="relative min-w-[190px]">
            <CalendarDays
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={filtroRetraso}
              onChange={(event) =>
                setFiltroRetraso(event.target.value as FiltroRetraso)
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-700 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            >
              <option value="todos">Todos los retrasos</option>

              <option value="sin_retraso">Sin retraso</option>

              <option value="con_retraso">Con retraso</option>
            </select>
          </div>

          <div className="relative min-w-[210px]">
            <Filter
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={filtroPenalidad}
              onChange={(event) =>
                setFiltroPenalidad(event.target.value as FiltroPenalidad)
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm text-slate-700 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-orange-100"
            >
              <option value="todos">Todas las penalidades</option>

              <option value="sin_penalidad">Sin penalidad</option>

              <option value="pendiente">Pendiente</option>

              <option value="parcial">Pago parcial</option>

              <option value="pagada">Pagada</option>
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

        <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando{" "}
            <strong className="text-slate-700">{filteredData.length}</strong> de{" "}
            <strong className="text-slate-700">{data.length}</strong>{" "}
            devoluciones
          </span>

          {hayFiltros && (
            <span>
              Penalidades visibles:{" "}
              <strong className="text-red-600">
                {moneda(resumenVisible.penalidades)}
              </strong>
              {" · "}
              Pendiente:{" "}
              <strong className="text-amber-600">
                {moneda(resumenVisible.penalidadPendiente)}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* =================================================
          ALERTA PENALIDADES PENDIENTES
      ================================================= */}

      {resumen.penalidades_pendientes > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 print:hidden">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle size={20} />
            </div>

            <div>
              <h3 className="font-bold text-amber-900">
                Penalidades pendientes de cobro
              </h3>

              <p className="mt-1 text-sm text-amber-800/80">
                Existen {moneda(resumen.penalidades_pendientes)} en penalidades
                todavía no cobradas completamente.
              </p>

              <p className="mt-1 text-xs text-amber-700">
                El cobro debe registrarse desde pagos del contrato con concepto
                de penalidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Historial de devoluciones
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Seguimiento operativo y financiero de cada devolución.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ReceiptText size={16} />
              Reporte consolidado
            </div>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="py-14 text-center">
            <RotateCcw size={34} className="mx-auto text-slate-300" />

            <p className="mt-3 font-semibold text-slate-600">
              No hay devoluciones para mostrar
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Ajusta los filtros o registra una nueva devolución.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DevolucionesTable data={filteredData} />
          </div>
        )}
      </div>

      {/* =================================================
          RESUMEN DE FILTROS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResumenCard
          title="Valor de contratos"
          value={moneda(resumenVisible.valorContratos)}
          description={`${resumenVisible.total} devoluciones visibles`}
          icon={<ReceiptText size={20} />}
        />

        <ResumenCard
          title="Penalidades visibles"
          value={moneda(resumenVisible.penalidades)}
          description={`Cobrado: ${moneda(resumenVisible.penalidadPagada)}`}
          icon={<CircleDollarSign size={20} />}
        />

        <ResumenCard
          title="Total generado"
          value={moneda(resumenVisible.totalGenerado)}
          description={`Pendiente penalidad: ${moneda(
            resumenVisible.penalidadPendiente,
          )}`}
          icon={<WalletCards size={20} />}
        />
      </div>

      {/* =================================================
          REGLAS
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 print:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">
            Reglas de devolución
          </h2>

          <div className="mt-4 space-y-3">
            <InfoBox
              icon={<CheckCircle2 size={18} />}
              title="Retorno de stock"
              description="Los activos asociados al contrato retornan automáticamente al inventario."
              variant="success"
            />

            <InfoBox
              icon={<RotateCcw size={18} />}
              title="Cierre del contrato"
              description="Después de una devolución completa, el contrato pasa a estado finalizado."
              variant="info"
            />

            <InfoBox
              icon={<AlertTriangle size={18} />}
              title="Penalidad por retraso"
              description="Cuando existe retraso, el sistema calcula automáticamente la penalidad correspondiente."
              variant="danger"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">
            Integración financiera
          </h2>

          <div className="mt-4 space-y-3">
            <InfoBox
              icon={<CalendarDays size={18} />}
              title="La penalidad no es ingreso al generarse"
              description="Registrar la devolución calcula la penalidad y la agrega al saldo pendiente, pero no mueve dinero."
              variant="warning"
            />

            <InfoBox
              icon={<CircleDollarSign size={18} />}
              title="Cobro desde pagos del contrato"
              description="Cuando el cliente paga una penalidad, debe registrarse como concepto penalidad para reflejarla como cobrada."
              variant="info"
            />
          </div>
        </div>
      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      <RegistrarDevolucionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        contratoId={contratoId}
        onSuccess={() => void loadData(false)}
      />
    </div>
  );
}

/* =====================================================
   KPI CARD
===================================================== */

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;

  variant: "info" | "success" | "warning" | "danger";
}

function KpiCard({ title, value, description, icon, variant }: KpiCardProps) {
  const estilos = {
    info: {
      icon: "bg-blue-50 text-blue-600",

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

    danger: {
      icon: "bg-red-50 text-red-600",

      value: "text-red-600",
    },
  };

  const style = estilos[variant];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className={`mt-2 text-2xl font-bold ${style.value}`}>{value}</p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   RESUMEN CARD
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
   INFO BOX
===================================================== */

interface InfoBoxProps {
  icon: React.ReactNode;
  title: string;
  description: string;

  variant: "success" | "info" | "warning" | "danger";
}

function InfoBox({ icon, title, description, variant }: InfoBoxProps) {
  const estilos = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",

    info: "border-blue-200 bg-blue-50 text-blue-800",

    warning: "border-amber-200 bg-amber-50 text-amber-800",

    danger: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-xl border p-4 ${estilos[variant]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>

        <div>
          <p className="font-semibold">{title}</p>

          <p className="mt-1 text-sm opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default DevolucionesPage;
