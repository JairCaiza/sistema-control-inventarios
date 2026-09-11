import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

import CreateCuentaModal from "../components/CreateCuentaModal";

import {
  changeCuentaStatus,
  deleteCuenta,
  getCuentas,
  getResumenCuentas,
  type CuentaFinanciera,
  type ResumenCuentas,
} from "../service/cuentaService";

function CuentaPage() {
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
      let mensaje = "No se pudieron cargar las cuentas financieras.";

      if (axios.isAxiosError(error)) {
        mensaje =
          error.response?.data?.message ??
          error.response?.data?.error ??
          mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: mensaje,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter((cuenta) => {
      const coincideBusqueda =
        cuenta.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (cuenta.observaciones ?? "")
          .toLowerCase()
          .includes(busqueda.toLowerCase());

      const coincideTipo = tipoFiltro === "todas" || cuenta.tipo === tipoFiltro;

      return coincideBusqueda && coincideTipo;
    });
  }, [cuentas, busqueda, tipoFiltro]);

  const formatMoney = (value: number | string): string => {
    return Number(value || 0).toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  const handleDelete = async (cuenta: CuentaFinanciera) => {
    const confirmacion = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar cuenta?",
      html: `Se eliminará la cuenta <strong>${cuenta.nombre}</strong>.`,
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
      let mensaje = "No se pudo eliminar la cuenta financiera.";

      if (axios.isAxiosError(error)) {
        mensaje =
          error.response?.data?.message ??
          error.response?.data?.error ??
          mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: mensaje,
      });
    }
  };

  const handleChangeStatus = async (cuenta: CuentaFinanciera) => {
    const nuevoEstado = !cuenta.activo;

    const confirmacion = await Swal.fire({
      icon: "question",
      title: nuevoEstado ? "¿Activar cuenta?" : "¿Inactivar cuenta?",
      text: nuevoEstado
        ? `Se activará la cuenta ${cuenta.nombre}.`
        : `La cuenta ${cuenta.nombre} dejará de estar disponible para nuevas operaciones.`,
      showCancelButton: true,
      confirmButtonText: nuevoEstado ? "Sí, activar" : "Sí, inactivar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await changeCuentaStatus(cuenta.id, nuevoEstado);

      await cargarDatos();
    } catch (error: unknown) {
      let mensaje = "No se pudo cambiar el estado de la cuenta.";

      if (axios.isAxiosError(error)) {
        mensaje =
          error.response?.data?.message ??
          error.response?.data?.error ??
          mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: mensaje,
      });
    }
  };

  const funcionPendiente = async (nombre: string) => {
    await Swal.fire({
      icon: "info",
      title: nombre,
      text: "Esta funcionalidad se implementará en la siguiente historia de usuario.",
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuentas financieras</h1>

          <p className="mt-1 text-sm text-gray-500">
            Administra cajas y cuentas bancarias del ERP.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white hover:opacity-90"
        >
          + Nueva cuenta
        </button>
      </div>

      {/* RESUMEN */}
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

      {/* FILTROS */}
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

      {/* LOADING */}
      {loading && (
        <div className="py-10 text-center text-gray-500">
          Cargando cuentas...
        </div>
      )}

      {/* TABLA */}
      {!loading && (
        <div className="overflow-hidden rounded-lg border bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full">
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

                  <th className="px-4 py-3 text-left text-sm font-semibold">
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
                    <td className="px-4 py-3">
                      <p className="font-medium">{cuenta.nombre}</p>

                      {cuenta.observaciones && (
                        <p className="mt-1 max-w-[260px] truncate text-xs text-gray-500">
                          {cuenta.observaciones}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 capitalize">{cuenta.tipo}</td>

                    <td className="px-4 py-3 font-medium">
                      {formatMoney(cuenta.saldo_actual)}
                    </td>

                    <td className="px-4 py-3">
                      {Number(cuenta.movimientos || 0)}
                    </td>

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

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <button
                          title="Ver detalle"
                          onClick={() => funcionPendiente("Detalle de cuenta")}
                          className="text-cyan-600 transition hover:scale-110"
                        >
                          <FaEye />
                        </button>

                        <button
                          title="Editar"
                          onClick={() => funcionPendiente("Editar cuenta")}
                          className="text-blue-600 transition hover:scale-110"
                        >
                          <FaEdit />
                        </button>

                        <button
                          title="Ver movimientos"
                          onClick={() =>
                            funcionPendiente("Movimientos de cuenta")
                          }
                          className="text-purple-600 transition hover:scale-110"
                        >
                          <FaFileInvoiceDollar />
                        </button>

                        <button
                          title="Registrar ingreso"
                          disabled={!cuenta.activo}
                          onClick={() => funcionPendiente("Registrar ingreso")}
                          className="text-green-600 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FaMoneyBillWave />
                        </button>

                        <button
                          title="Transferir"
                          disabled={!cuenta.activo}
                          onClick={() => funcionPendiente("Transferencia")}
                          className="text-orange-600 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FaExchangeAlt />
                        </button>

                        <button
                          title={cuenta.activo ? "Inactivar" : "Activar"}
                          onClick={() => handleChangeStatus(cuenta)}
                          className={
                            cuenta.activo
                              ? "text-amber-600 transition hover:scale-110"
                              : "text-green-600 transition hover:scale-110"
                          }
                        >
                          {cuenta.activo ? <FaToggleOn /> : <FaToggleOff />}
                        </button>

                        <button
                          title="Eliminar"
                          onClick={() => handleDelete(cuenta)}
                          className="text-red-600 transition hover:scale-110"
                        >
                          <FaTrash />
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

      <CreateCuentaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={cargarDatos}
      />
    </div>
  );
}

export default CuentaPage;
