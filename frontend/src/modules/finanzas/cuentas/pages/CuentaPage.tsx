import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

import CreateCuentaModal from "../components/CreateCuentaModal";

import {
  deleteCuenta,
  getCuentas,
  getResumenCuentas,
  type CuentaFinanciera,
  type ResumenCuentas,
} from "../service/cuentaService";

// =====================================================
// PÁGINA DE CUENTAS FINANCIERAS
// =====================================================

function CuentaPage() {
  // ===================================================
  // ESTADOS
  // ===================================================

  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [resumen, setResumen] = useState<ResumenCuentas>({
    total_cuentas: 0,
    saldo_cajas: 0,
    saldo_total: 0,
  });

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [busqueda, setBusqueda] = useState("");

  const [tipoFiltro, setTipoFiltro] = useState("todas");

  // ===================================================
  // OBTENER MENSAJE DE ERROR
  // ===================================================

  const obtenerMensajeError = (
    error: unknown,
    mensajePredeterminado: string,
  ): string => {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message ??
        error.response?.data?.error ??
        mensajePredeterminado
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return mensajePredeterminado;
  };

  // ===================================================
  // CARGAR CUENTAS Y RESUMEN
  // ===================================================

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [cuentasData, resumenData] = await Promise.all([
        getCuentas(),
        getResumenCuentas(),
      ]);

      setCuentas(cuentasData);

      setResumen(resumenData);
    } catch (error: unknown) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: obtenerMensajeError(
          error,
          "No se pudieron cargar las cuentas financieras.",
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // CARGA INICIAL
  // ===================================================

  useEffect(() => {
    void cargarDatos();
  }, []);

  // ===================================================
  // FILTRAR CUENTAS
  // ===================================================

  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter((cuenta) => {
      const textoBusqueda = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        cuenta.nombre.toLowerCase().includes(textoBusqueda) ||
        (cuenta.observaciones ?? "").toLowerCase().includes(textoBusqueda);

      const coincideTipo = tipoFiltro === "todas" || cuenta.tipo === tipoFiltro;

      return coincideBusqueda && coincideTipo;
    });
  }, [cuentas, busqueda, tipoFiltro]);

  // ===================================================
  // FORMATEAR MONEDA
  // ===================================================

  const formatMoney = (value: number | string): string => {
    return Number(value || 0).toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  // ===================================================
  // ESCAPAR HTML
  // ===================================================

  const escaparHtml = (valor: unknown): string => {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // ===================================================
  // VER DETALLE DE CUENTA
  // ===================================================

  const handleVer = async (cuenta: CuentaFinanciera) => {
    await Swal.fire({
      title: "Detalle de cuenta financiera",
      width: 550,
      confirmButtonText: "Cerrar",
      html: `
        <div style="text-align:left;line-height:2">
          <p>
            <strong>Nombre:</strong>
            ${escaparHtml(cuenta.nombre)}
          </p>

          <p>
            <strong>Tipo:</strong>
            ${escaparHtml(cuenta.tipo)}
          </p>

          <p>
            <strong>Saldo actual:</strong>
            ${escaparHtml(formatMoney(cuenta.saldo_actual))}
          </p>

          <p>
            <strong>Movimientos:</strong>
            ${Number(cuenta.movimientos || 0)}
          </p>

          <p>
            <strong>Estado:</strong>
            ${cuenta.activo ? "Activa" : "Inactiva"}
          </p>

          <p>
            <strong>Observaciones:</strong>
            ${escaparHtml(cuenta.observaciones || "Sin observaciones")}
          </p>
        </div>
      `,
    });
  };

  // ===================================================
  // EDITAR CUENTA
  // ===================================================

  const handleEditar = async (cuenta: CuentaFinanciera) => {
    await Swal.fire({
      icon: "info",
      title: "Editar cuenta financiera",
      html: `
        <p>
          Cuenta seleccionada:
          <strong>${escaparHtml(cuenta.nombre)}</strong>
        </p>
        <p style="margin-top:12px">
          El formulario de edición todavía no está
          conectado con el servicio de actualización.
        </p>
      `,
      confirmButtonText: "Entendido",
    });
  };

  // ===================================================
  // ELIMINAR CUENTA
  // ===================================================

  const handleDelete = async (cuenta: CuentaFinanciera) => {
    const confirmacion = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar cuenta?",
      html: `
        Se eliminará la cuenta
        <strong>${escaparHtml(cuenta.nombre)}</strong>.
        <p style="margin-top:12px">
          Esta operación puede afectar registros
          financieros relacionados.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await deleteCuenta(cuenta.id);

      await Swal.fire({
        icon: "success",
        title: "Cuenta eliminada",
        text: "La cuenta fue eliminada correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });

      await cargarDatos();
    } catch (error: unknown) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: obtenerMensajeError(
          error,
          "No se pudo eliminar la cuenta financiera.",
        ),
      });
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">
      {/* ===============================================
          ENCABEZADO
      =============================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuentas financieras</h1>

          <p className="mt-1 text-sm text-gray-500">
            Administra cajas y cuentas bancarias del ERP.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white hover:opacity-90"
        >
          + Nueva cuenta
        </button>
      </div>

      {/* ===============================================
          RESUMEN FINANCIERO
      =============================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total cuentas activas</p>

          <p className="text-2xl font-bold">
            {Number(resumen.total_cuentas || 0)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Saldo en cajas</p>

          <p className="text-2xl font-bold text-green-600">
            {formatMoney(resumen.saldo_cajas)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Saldo total disponible</p>

          <p className="text-2xl font-bold text-blue-600">
            {formatMoney(resumen.saldo_total)}
          </p>
        </div>
      </div>

      {/* ===============================================
          FILTROS
      =============================================== */}

      <div className="rounded-lg border bg-white p-4 shadow">
        <div className="flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar cuenta..."
            className="flex-1 rounded border px-3 py-2"
          />

          <select
            value={tipoFiltro}
            onChange={(event) => setTipoFiltro(event.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="todas">Todas</option>
            <option value="caja">Caja</option>
            <option value="banco">Banco</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
      </div>

      {/* ===============================================
          CARGANDO
      =============================================== */}

      {loading && (
        <div className="py-10 text-center text-gray-500">
          Cargando cuentas...
        </div>
      )}

      {/* ===============================================
          TABLA DE CUENTAS
      =============================================== */}

      {!loading && (
        <div className="overflow-hidden rounded-lg border bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Cuenta
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Tipo
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Saldo actual
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Movimientos
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Estado
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {cuentasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No hay cuentas registradas.
                    </td>
                  </tr>
                )}

                {cuentasFiltradas.map((cuenta) => (
                  <tr
                    key={cuenta.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    {/* CUENTA */}

                    <td className="px-4 py-3">
                      <p className="font-medium">{cuenta.nombre}</p>

                      {cuenta.observaciones && (
                        <p className="mt-1 max-w-[260px] truncate text-xs text-gray-500">
                          {cuenta.observaciones}
                        </p>
                      )}
                    </td>

                    {/* TIPO */}

                    <td className="px-4 py-3 capitalize">{cuenta.tipo}</td>

                    {/* SALDO */}

                    <td className="px-4 py-3 font-medium">
                      {formatMoney(cuenta.saldo_actual)}
                    </td>

                    {/* MOVIMIENTOS */}

                    <td className="px-4 py-3">
                      {Number(cuenta.movimientos || 0)}
                    </td>

                    {/* ESTADO */}

                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          cuenta.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {cuenta.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>

                    {/* ACCIONES */}

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        {/* VER */}

                        <button
                          type="button"
                          title="Ver detalle"
                          aria-label={`Ver ${cuenta.nombre}`}
                          onClick={() => void handleVer(cuenta)}
                          className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
                        >
                          <FaEye />
                          Ver
                        </button>

                        {/* EDITAR */}

                        <button
                          type="button"
                          title="Editar cuenta"
                          aria-label={`Editar ${cuenta.nombre}`}
                          onClick={() => void handleEditar(cuenta)}
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          <FaEdit />
                          Editar
                        </button>

                        {/* ELIMINAR */}

                        <button
                          type="button"
                          title="Eliminar cuenta"
                          aria-label={`Eliminar ${cuenta.nombre}`}
                          onClick={() => void handleDelete(cuenta)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                        >
                          <FaTrash />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===============================================
          MODAL CREAR CUENTA
      =============================================== */}

      <CreateCuentaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={cargarDatos}
      />
    </div>
  );
}

export default CuentaPage;
