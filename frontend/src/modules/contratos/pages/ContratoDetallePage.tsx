import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CalendarDays,
  CreditCard,
  DollarSign,
  PackagePlus,
  ReceiptText,
  User,
} from "lucide-react";

import { getContratoById } from "../service/contratoService";
import {
  listarPagosContrato,
  type PagoContrato,
} from "../service/pagosContratosService";

import AddActivoContratoModal from "../components/AddActivoContratoModal";
import RegistrarPagoContratoModal from "../components/RegistrarPagoContratoModal";

/* =========================
   TIPOS
========================= */

interface ActivoContrato {
  id: string;
  detalle_id?: string;
  codigo?: string;
  nombre: string;
  cantidad: number | string;
  precio_dia: number | string;
  dias?: number | string;
  subtotal: number | string;
}

interface Contrato {
  id: string;
  numero_contrato?: string;
  cliente: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
  total?: number | string;
  pagado?: number | string;
  saldo_pendiente?: number | string;
  activos?: ActivoContrato[];
}

function ContratoDetallePage() {
  const { id } = useParams<{ id: string }>();

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [pagos, setPagos] = useState<PagoContrato[]>([]);

  const [modalActivoOpen, setModalActivoOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     CARGAR CONTRATO
  ========================= */

  const loadContrato = useCallback(async () => {
    if (!id) return;

    try {
      setError("");

      const data = await getContratoById(id);

      setContrato(data);
    } catch (err) {
      console.error("Error al cargar contrato:", err);
      setError("No se pudo cargar la información del contrato.");
    }
  }, [id]);

  /* =========================
     CARGAR PAGOS
  ========================= */

  const loadPagos = useCallback(async () => {
    if (!id) return;

    try {
      setLoadingPagos(true);

      const data = await listarPagosContrato(id);

      setPagos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar pagos:", err);
      setPagos([]);
    } finally {
      setLoadingPagos(false);
    }
  }, [id]);

  /* =========================
     CARGA INICIAL
  ========================= */

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        await Promise.all([loadContrato(), loadPagos()]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [loadContrato, loadPagos]);

  /* =========================
     RECARGAR DESPUÉS DEL PAGO
  ========================= */

  const handlePagoRegistrado = async () => {
    await Promise.all([loadContrato(), loadPagos()]);
    setModalPagoOpen(false);
  };

  /* =========================
     RECARGAR DESPUÉS DE AGREGAR ACTIVO
  ========================= */

  const handleActivoAgregado = async () => {
    await loadContrato();
    setModalActivoOpen(false);
  };

  /* =========================
     ESTADOS DE CARGA
  ========================= */

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center shadow">
        <p className="text-gray-500">Cargando contrato...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-medium text-red-700">{error}</p>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center shadow">
        <p className="text-gray-500">Contrato no encontrado.</p>
      </div>
    );
  }

  /* =========================
     CÁLCULOS
  ========================= */

  const activos = contrato.activos || [];

  const fechaInicio = new Date(contrato.fecha_inicio);
  const fechaFin = new Date(contrato.fecha_fin);

  const diferenciaDias = Math.ceil(
    (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24),
  );

  const dias = Math.max(diferenciaDias, 1);

  const subtotalActivos = activos.reduce((sum, activo) => {
    return sum + Number(activo.subtotal || 0);
  }, 0);

  const total = Number(contrato.total || 0);
  const pagado = Number(contrato.pagado || 0);
  const saldoPendiente = Number(contrato.saldo_pendiente || 0);

  /*
   * Solo los contratos activos pueden recibir nuevos activos.
   */
  const puedeAgregarActivos = contrato.estado === "activo";

  /* =========================
     FORMATOS
  ========================= */

  const formatoMoneda = (valor: number | string | undefined) =>
    Number(valor || 0).toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatoFecha = (fecha: string | undefined) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getEstadoClass = (estado?: string) => {
    if (estado === "activo") {
      return "bg-green-100 text-green-700";
    }

    if (estado === "finalizado") {
      return "bg-blue-100 text-blue-700";
    }

    if (estado === "cancelado") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* =========================
          ENCABEZADO
      ========================= */}

      <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-gray-500">Detalle del contrato</p>

          <h1 className="mt-1 text-2xl font-bold text-gray-800">
            {contrato.numero_contrato
              ? `Contrato ${contrato.numero_contrato}`
              : `Contrato ${contrato.id.slice(0, 8)}`}
          </h1>

          <p className="mt-1 text-xs text-gray-400">ID: {contrato.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${getEstadoClass(
              contrato.estado,
            )}`}
          >
            {contrato.estado || "Sin estado"}
          </span>

          {saldoPendiente > 0 && (
            <button
              type="button"
              onClick={() => setModalPagoOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
            >
              <CreditCard size={18} />
              Registrar pago
            </button>
          )}
        </div>
      </div>

      {/* =========================
          INFORMACIÓN GENERAL
      ========================= */}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">Información general</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <User size={18} />
              <p className="text-sm">Cliente</p>
            </div>

            <p className="mt-2 font-semibold text-gray-800">
              {contrato.cliente}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarDays size={18} />
              <p className="text-sm">Fecha de inicio</p>
            </div>

            <p className="mt-2 font-semibold text-gray-800">
              {formatoFecha(contrato.fecha_inicio)}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarDays size={18} />
              <p className="text-sm">Fecha de finalización</p>
            </div>

            <p className="mt-2 font-semibold text-gray-800">
              {formatoFecha(contrato.fecha_fin)}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Duración: {dias} {dias === 1 ? "día" : "días"}
            </p>
          </div>
        </div>
      </div>

      {/* =========================
          RESUMEN FINANCIERO
      ========================= */}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <DollarSign size={21} className="text-green-600" />
              Resumen financiero
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Valores registrados actualmente en el contrato.
            </p>
          </div>

          {saldoPendiente <= 0 && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              Sin saldo pendiente
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Total del contrato</p>

            <p className="mt-2 text-2xl font-bold text-gray-800">
              ${formatoMoneda(total)}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm text-gray-500">Pagado acumulado</p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              ${formatoMoneda(pagado)}
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-gray-500">Saldo pendiente</p>

            <p className="mt-2 text-2xl font-bold text-red-700">
              ${formatoMoneda(saldoPendiente)}
            </p>
          </div>
        </div>

        {saldoPendiente > 0 && (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setModalPagoOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white transition hover:bg-green-700"
            >
              <CreditCard size={18} />
              Registrar pago
            </button>
          </div>
        )}
      </div>

      {/* =========================
          HISTORIAL DE PAGOS
      ========================= */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <ReceiptText size={21} className="text-blue-600" />
            Historial de pagos
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Pagos de alquiler, penalidades y otros conceptos.
          </p>
        </div>

        {loadingPagos ? (
          <div className="p-8 text-center text-gray-500">Cargando pagos...</div>
        ) : pagos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Este contrato todavía no tiene pagos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Fecha
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Cuenta
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Concepto
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Método
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Monto
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Observaciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {formatoFecha(pago.fecha)}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {pago.cuenta || "Sin cuenta"}
                    </td>

                    <td className="px-4 py-3 text-sm capitalize">
                      {pago.concepto || "Sin concepto"}
                    </td>

                    <td className="px-4 py-3 text-sm capitalize">
                      {pago.metodo_pago || "Sin método"}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-bold text-green-700">
                      ${formatoMoneda(pago.monto)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {pago.observaciones || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================
          ACTIVOS DEL CONTRATO
      ========================= */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Activos del contrato
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Equipos y herramientas asociados al alquiler.
            </p>
          </div>

          <button
            type="button"
            disabled={!puedeAgregarActivos}
            onClick={() => {
              if (puedeAgregarActivos) {
                setModalActivoOpen(true);
              }
            }}
            title={
              puedeAgregarActivos
                ? "Agregar activo al contrato"
                : "No se pueden agregar activos a un contrato finalizado o cancelado"
            }
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition ${
              puedeAgregarActivos
                ? "bg-[var(--color-primary)] hover:opacity-90"
                : "cursor-not-allowed bg-gray-400 opacity-60"
            }`}
          >
            <PackagePlus size={18} />

            {puedeAgregarActivos ? "Agregar activo" : "Contrato cerrado"}
          </button>
        </div>

        {!puedeAgregarActivos && (
          <div className="border-b bg-yellow-50 px-5 py-3">
            <p className="text-sm text-yellow-700">
              Este contrato está {contrato.estado}. No se pueden agregar nuevos
              activos.
            </p>
          </div>
        )}

        {activos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Este contrato todavía no tiene activos agregados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold">Activo</th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Cantidad
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Precio por día
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Días
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody>
                {activos.map((activo) => {
                  const cantidad = Number(activo.cantidad || 0);

                  const precioDia = Number(activo.precio_dia || 0);

                  const diasActivo = Number(activo.dias || dias);

                  const subtotal = Number(activo.subtotal || 0);

                  return (
                    <tr
                      key={activo.detalle_id || activo.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {activo.nombre}
                      </td>

                      <td className="px-4 py-3 text-center text-sm">
                        {cantidad}
                      </td>

                      <td className="px-4 py-3 text-right text-sm">
                        ${formatoMoneda(precioDia)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm">
                        {diasActivo}
                      </td>

                      <td className="px-4 py-3 text-right text-sm font-bold">
                        ${formatoMoneda(subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t bg-gray-50 px-5 py-4 text-right">
          <p className="text-sm text-gray-500">Subtotal calculado de activos</p>

          <p className="mt-1 text-xl font-bold text-gray-800">
            ${formatoMoneda(subtotalActivos)}
          </p>
        </div>
      </div>

      {/* =========================
          MODAL AGREGAR ACTIVO
      ========================= */}

      {puedeAgregarActivos && (
        <AddActivoContratoModal
          open={modalActivoOpen}
          onClose={() => setModalActivoOpen(false)}
          contratoId={contrato.id}
          onAgregado={handleActivoAgregado}
        />
      )}

      {/* =========================
          MODAL REGISTRAR PAGO
      ========================= */}

      <RegistrarPagoContratoModal
        open={modalPagoOpen}
        contratoId={contrato.id}
        numeroContrato={contrato.numero_contrato}
        saldoPendiente={saldoPendiente}
        onClose={() => setModalPagoOpen(false)}
        onPagoRegistrado={handlePagoRegistrado}
      />
    </div>
  );
}

export default ContratoDetallePage;
