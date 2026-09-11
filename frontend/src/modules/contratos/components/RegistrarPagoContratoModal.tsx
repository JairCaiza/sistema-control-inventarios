import { useEffect, useState } from "react";
import { DollarSign, X } from "lucide-react";
import Swal from "sweetalert2";

import {
  listarCuentasFinancieras,
  registrarPagoContrato,
} from "../service/pagosContratosService";

import type {
  CuentaFinanciera,
  RegistrarPagoContratoData,
} from "../service/pagosContratosService";

interface RegistrarPagoContratoModalProps {
  open: boolean;
  contratoId: string;
  numeroContrato?: string;
  saldoPendiente: number;
  onClose: () => void;
  onPagoRegistrado: () => void | Promise<void>;
}

const RegistrarPagoContratoModal = ({
  open,
  contratoId,
  numeroContrato,
  saldoPendiente,
  onClose,
  onPagoRegistrado,
}: RegistrarPagoContratoModalProps) => {
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState<RegistrarPagoContratoData>({
    cuenta_id: "",
    monto: 0,
    metodo_pago: "efectivo",
    concepto: "alquiler",
    observaciones: "",
  });

  /* =========================
     CARGAR CUENTAS
  ========================= */

  const cargarCuentas = async () => {
    try {
      setCargandoCuentas(true);

      const data = await listarCuentasFinancieras();

      const cuentasActivas = data.filter((cuenta) => cuenta.activa !== false);

      setCuentas(cuentasActivas);

      if (cuentasActivas.length > 0) {
        setForm((prev) => ({
          ...prev,
          cuenta_id: cuentasActivas[0].id,
        }));
      }
    } catch (error) {
      console.error("Error al cargar cuentas financieras:", error);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las cuentas financieras.",
      });
    } finally {
      setCargandoCuentas(false);
    }
  };

  /* =========================
     ABRIR MODAL
  ========================= */

  useEffect(() => {
    if (!open) return;

    setForm({
      cuenta_id: "",
      monto: 0,
      metodo_pago: "efectivo",
      concepto: "alquiler",
      observaciones: "",
    });

    cargarCuentas();
  }, [open]);

  if (!open) return null;

  /* =========================
     CAMBIOS DEL FORMULARIO
  ========================= */

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "monto" ? Number(value) : value,
    }));
  };

  /* =========================
     REGISTRAR PAGO
  ========================= */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const monto = Number(form.monto);

    if (!form.cuenta_id) {
      await Swal.fire({
        icon: "warning",
        title: "Cuenta requerida",
        text: "Debes seleccionar una cuenta financiera.",
      });

      return;
    }

    if (!Number.isFinite(monto) || monto <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Monto inválido",
        text: "El monto debe ser mayor a cero.",
      });

      return;
    }

    if (monto > saldoPendiente) {
      await Swal.fire({
        icon: "warning",
        title: "Monto superior al saldo",
        text: `El pago no puede superar el saldo pendiente de $${saldoPendiente.toFixed(
          2,
        )}.`,
      });

      return;
    }

    try {
      setGuardando(true);

      const resultado = await registrarPagoContrato(contratoId, {
        cuenta_id: form.cuenta_id,
        monto,
        metodo_pago: form.metodo_pago,
        concepto: form.concepto,
        observaciones: form.observaciones?.trim() || undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "Pago registrado",
        html: `
          <div style="text-align: left">
            <p><strong>Contrato:</strong> ${
              resultado.numero_contrato || numeroContrato || contratoId
            }</p>
            <p><strong>Pago:</strong> $${monto.toFixed(2)}</p>
            <p><strong>Nuevo saldo:</strong> $${Number(
              resultado.saldo_pendiente,
            ).toFixed(2)}</p>
          </div>
        `,
      });

      await onPagoRegistrado();
      onClose();
    } catch (error: unknown) {
      console.error("Error al registrar pago:", error);

      let mensaje = "No se pudo registrar el pago.";

      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              error?: string;
            };
          };
        };

        mensaje =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          mensaje;
      }

      await Swal.fire({
        icon: "error",
        title: "Error al registrar el pago",
        text: mensaje,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <DollarSign size={22} className="text-green-600" />
              Registrar pago
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Contrato: {numeroContrato || contratoId.slice(0, 8)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* SALDO */}
        <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-gray-600">Saldo pendiente</p>

          <p className="mt-1 text-2xl font-bold text-red-700">
            ${Number(saldoPendiente || 0).toFixed(2)}
          </p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* CUENTA */}
          <div>
            <label
              htmlFor="cuenta_id"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Cuenta financiera
            </label>

            <select
              id="cuenta_id"
              name="cuenta_id"
              value={form.cuenta_id}
              onChange={handleChange}
              disabled={cargandoCuentas || guardando}
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            >
              <option value="">
                {cargandoCuentas
                  ? "Cargando cuentas..."
                  : "Seleccione una cuenta"}
              </option>

              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre} — saldo $
                  {Number(cuenta.saldo_actual || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* MONTO */}
          <div>
            <label
              htmlFor="monto"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Monto
            </label>

            <input
              id="monto"
              name="monto"
              type="number"
              min="0.01"
              max={saldoPendiente}
              step="0.01"
              value={form.monto || ""}
              onChange={handleChange}
              disabled={guardando}
              placeholder="Ingrese el monto"
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            />

            <p className="mt-1 text-xs text-gray-500">
              El monto máximo permitido es $
              {Number(saldoPendiente || 0).toFixed(2)}.
            </p>
          </div>

          {/* MÉTODO */}
          <div>
            <label
              htmlFor="metodo_pago"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Método de pago
            </label>

            <select
              id="metodo_pago"
              name="metodo_pago"
              value={form.metodo_pago}
              onChange={handleChange}
              disabled={guardando}
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="deposito">Depósito</option>
              <option value="cheque">Cheque</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* CONCEPTO */}
          <div>
            <label
              htmlFor="concepto"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Concepto
            </label>

            <select
              id="concepto"
              name="concepto"
              value={form.concepto}
              onChange={handleChange}
              disabled={guardando}
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="alquiler">Pago de alquiler</option>
              <option value="penalidad">Pago de penalidad</option>
              <option value="otro">Otro concepto</option>
            </select>
          </div>

          {/* OBSERVACIONES */}
          <div>
            <label
              htmlFor="observaciones"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Observaciones
            </label>

            <textarea
              id="observaciones"
              name="observaciones"
              rows={3}
              value={form.observaciones}
              onChange={handleChange}
              disabled={guardando}
              placeholder="Ej.: Abono parcial de penalidad"
              className="w-full resize-none rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                guardando ||
                cargandoCuentas ||
                cuentas.length === 0 ||
                saldoPendiente <= 0
              }
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? "Registrando..." : "Registrar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrarPagoContratoModal;
