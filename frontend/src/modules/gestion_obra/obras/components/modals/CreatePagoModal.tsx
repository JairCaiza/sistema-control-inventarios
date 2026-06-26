import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

function CreatePagoModal({ open, onClose }: Props) {
  const [form, setForm] = useState({
    empleado: "",
    monto: "",
    fecha: "",
    metodo_pago: "",
    concepto: "",
    observaciones: "",
  });

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(form);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Registrar Pago a Empleado
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Registra los pagos realizados al personal
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* EMPLEADO */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Empleado
            </label>

            <input
              type="text"
              name="empleado"
              value={form.empleado}
              onChange={handleChange}
              placeholder="Nombre del empleado"
              className="w-full border rounded-xl px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* MONTO */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Monto ($)
            </label>

            <input
              type="number"
              name="monto"
              value={form.monto}
              onChange={handleChange}
              placeholder="Ej: 150"
              className="w-full border rounded-xl px-4 py-3 mt-1 outline-none"
              required
            />
          </div>

          {/* FECHA */}
          <div>
            <label className="text-sm font-medium text-gray-700">Fecha</label>

            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 mt-1 outline-none"
              required
            />
          </div>

          {/* METODO DE PAGO */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Método de Pago
            </label>

            <select
              name="metodo_pago"
              value={form.metodo_pago}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 mt-1 outline-none"
            >
              <option value="">Seleccionar</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {/* CONCEPTO */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Concepto
            </label>

            <input
              type="text"
              name="concepto"
              value={form.concepto}
              onChange={handleChange}
              placeholder="Ej: Pago semanal"
              className="w-full border rounded-xl px-4 py-3 mt-1 outline-none"
            />
          </div>

          {/* OBSERVACIONES */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Observaciones
            </label>

            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows={3}
              placeholder="Detalles adicionales del pago..."
              className="w-full border rounded-xl px-4 py-3 mt-1 outline-none resize-none"
            />
          </div>

          {/* BOTONES */}
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white"
            >
              Guardar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePagoModal;
