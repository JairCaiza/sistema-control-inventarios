import {
  CheckCircle2,
  Clock3,
  FileText,
  MinusCircle,
  TriangleAlert,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type {
  Devolucion,
  EstadoPenalidad,
} from "../services/devolucionService";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  data: Devolucion[];
}

/* =====================================================
   MONEDA
===================================================== */

const moneda = (value: number | string | null | undefined): string => {
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
   FECHA
===================================================== */

const formatearFecha = (value: string | null | undefined): string => {
  if (!value) {
    return "—";
  }

  const fecha = value.split("T")[0];

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return value;
  }

  const [anio, mes, dia] = partes;

  return `${dia}/${mes}/${anio}`;
};

/* =====================================================
   ESTADO PENALIDAD
===================================================== */

const getEstadoPenalidad = (estado: EstadoPenalidad) => {
  switch (estado) {
    case "pagada":
      return {
        label: "Pagada",

        className: "border-emerald-200 bg-emerald-50 text-emerald-700",

        icon: <CheckCircle2 size={14} />,
      };

    case "parcial":
      return {
        label: "Parcial",

        className: "border-amber-200 bg-amber-50 text-amber-700",

        icon: <Clock3 size={14} />,
      };

    case "pendiente":
      return {
        label: "Pendiente",

        className: "border-red-200 bg-red-50 text-red-700",

        icon: <TriangleAlert size={14} />,
      };

    case "sin_penalidad":
    default:
      return {
        label: "Sin penalidad",

        className: "border-slate-200 bg-slate-50 text-slate-600",

        icon: <MinusCircle size={14} />,
      };
  }
};

/* =====================================================
   COMPONENTE
===================================================== */

function DevolucionesTable({ data }: Props) {
  const navigate = useNavigate();

  /* =================================================
     VER CONTRATO
  ================================================= */

  const handleVerContrato = (contratoId: string) => {
    navigate(`/dashboard/contratos/${contratoId}`);
  };

  return (
    <div className="w-full">
      <table className="w-full min-w-[1200px] text-sm">
        {/* =================================================
            HEADER
        ================================================= */}

        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200 text-left">
            <th className="px-4 py-3 font-semibold text-slate-600">Contrato</th>

            <th className="px-4 py-3 font-semibold text-slate-600">Cliente</th>

            <th className="px-4 py-3 font-semibold text-slate-600">
              Fecha devolución
            </th>

            <th className="px-4 py-3 font-semibold text-slate-600">Retraso</th>

            <th className="px-4 py-3 text-right font-semibold text-slate-600">
              Valor contrato
            </th>

            <th className="px-4 py-3 text-right font-semibold text-slate-600">
              Penalidad
            </th>

            <th className="px-4 py-3 text-right font-semibold text-slate-600">
              Total generado
            </th>

            <th className="px-4 py-3 font-semibold text-slate-600">
              Estado penalidad
            </th>

            <th className="px-4 py-3 text-center font-semibold text-slate-600">
              Acciones
            </th>
          </tr>
        </thead>

        {/* =================================================
            BODY
        ================================================= */}

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                No hay devoluciones registradas.
              </td>
            </tr>
          ) : (
            data.map((devolucion) => {
              const estado = getEstadoPenalidad(devolucion.estado_penalidad);

              const diasRetraso = Number(devolucion.dias_retraso ?? 0);

              const penalidad = Number(devolucion.penalidad_total ?? 0);

              const tieneRetraso = diasRetraso > 0;

              return (
                <tr
                  key={devolucion.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/70"
                >
                  {/* =====================================
                        CONTRATO
                    ===================================== */}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText size={16} />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleVerContrato(devolucion.contrato_id)
                        }
                        className="font-semibold text-slate-800 transition hover:text-blue-600 hover:underline"
                      >
                        {devolucion.numero_contrato || "—"}
                      </button>
                    </div>
                  </td>

                  {/* =====================================
                        CLIENTE
                    ===================================== */}

                  <td className="px-4 py-4">
                    <p className="max-w-[220px] font-medium text-slate-700">
                      {devolucion.cliente || "—"}
                    </p>
                  </td>

                  {/* =====================================
                        FECHA
                    ===================================== */}

                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    {formatearFecha(devolucion.fecha_devolucion)}
                  </td>

                  {/* =====================================
                        RETRASO
                    ===================================== */}

                  <td className="px-4 py-4">
                    {tieneRetraso ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <Clock3 size={13} />
                        {diasRetraso} días
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={13} />A tiempo
                      </span>
                    )}
                  </td>

                  {/* =====================================
                        VALOR CONTRATO
                    ===================================== */}

                  <td className="px-4 py-4 text-right font-medium text-slate-700">
                    {moneda(devolucion.valor_contrato)}
                  </td>

                  {/* =====================================
                        PENALIDAD
                    ===================================== */}

                  <td className="px-4 py-4 text-right">
                    {penalidad > 0 ? (
                      <div>
                        <p className="font-bold text-red-600">
                          {moneda(devolucion.penalidad_total)}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Pendiente: {moneda(devolucion.penalidad_pendiente)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">$0.00</span>
                    )}
                  </td>

                  {/* =====================================
                        TOTAL GENERADO
                    ===================================== */}

                  <td className="px-4 py-4 text-right">
                    <p className="font-bold text-slate-900">
                      {moneda(devolucion.total_generado)}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Contrato + penalidad
                    </p>
                  </td>

                  {/* =====================================
                        ESTADO PENALIDAD
                    ===================================== */}

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                    >
                      {estado.icon}

                      {estado.label}
                    </span>

                    {devolucion.estado_penalidad !== "sin_penalidad" && (
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Cobrado: {moneda(devolucion.penalidad_pagada)}
                      </p>
                    )}
                  </td>

                  {/* =====================================
                        ACCIONES
                    ===================================== */}

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleVerContrato(devolucion.contrato_id)
                        }
                        title="Ver contrato"
                        className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <FileText size={15} />
                        Contrato
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DevolucionesTable;
