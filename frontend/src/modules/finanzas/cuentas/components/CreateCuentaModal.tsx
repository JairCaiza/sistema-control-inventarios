import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  createCuenta,
  type CrearCuentaDTO,
  type TipoCuenta,
} from "../service/cuentaService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormState {
  nombre: string;
  tipo: TipoCuenta;
  saldo_inicial: string;
  observaciones: string;
}

const FORM_INICIAL: FormState = {
  nombre: "",
  tipo: "caja",
  saldo_inicial: "0",
  observaciones: "",
};

function CreateCuentaModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(FORM_INICIAL);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre obligatorio",
        text: "Ingrese el nombre de la cuenta.",
      });

      return;
    }

    const saldoInicial = Number(form.saldo_inicial);

    if (Number.isNaN(saldoInicial) || saldoInicial < 0) {
      await Swal.fire({
        icon: "warning",
        title: "Saldo no válido",
        text: "El saldo inicial no puede ser negativo.",
      });

      return;
    }

    const payload: CrearCuentaDTO = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      saldo_inicial: saldoInicial,
      observaciones: form.observaciones.trim() || null,
    };

    try {
      setLoading(true);

      await createCuenta(payload);

      await Swal.fire({
        icon: "success",
        title: "Cuenta creada",
        text: "La cuenta financiera se registró correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      await onCreated();
      onClose();
    } catch (error: unknown) {
      let mensaje = "No se pudo registrar la cuenta financiera.";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="shrink-0 border-b px-5 py-4 sm:px-6">
          <h2 className="text-xl font-bold text-gray-800">
            Nueva cuenta financiera
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Registra una caja o cuenta bancaria.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre de la cuenta
              </label>

              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ejemplo: Banco Pichincha"
                disabled={loading}
                maxLength={100}
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de cuenta
              </label>

              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-[var(--color-primary)]"
              >
                <option value="caja">Caja</option>
                <option value="banco">Banco</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Saldo inicial
              </label>

              <input
                type="number"
                name="saldo_inicial"
                value={form.saldo_inicial}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={loading}
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-[var(--color-primary)]"
              />

              <p className="mt-1 text-xs text-gray-500">
                Este valor solo se registra al crear la cuenta.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Observaciones
              </label>

              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                placeholder="Información adicional de la cuenta"
                maxLength={300}
                rows={4}
                disabled={loading}
                className="w-full resize-none rounded-lg border px-3 py-2.5 outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="shrink-0 border-t bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
              >
                {loading ? "Guardando..." : "Guardar cuenta"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCuentaModal;
