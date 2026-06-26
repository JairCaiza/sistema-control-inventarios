import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { updateEmpleado } from "../services/empleadosService";

interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  cargo?: string;
  tipo_pago: "diario" | "semanal" | "mensual";
  salario_base?: number;
  fecha_ingreso?: string;
  observaciones?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  empleado: Empleado | null;
}

function EditEmpleadoModal({ open, onClose, onUpdated, empleado }: Props) {
  const [form, setForm] = useState<any>({});

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empleado) {
      setForm({
        ...empleado,
        salario_base: empleado.salario_base || "",
      });
    }
  }, [empleado]);

  if (!open || !empleado) return null;

  /* =========================
     HANDLE CHANGE
  ========================= */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await updateEmpleado(empleado.id, {
        ...form,
        salario_base: Number(form.salario_base),
      });

      Swal.fire({
        icon: "success",
        title: "Empleado actualizado",
        timer: 1400,
        showConfirmButton: false,
      });

      onUpdated();
      onClose();
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo actualizar",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Editar Empleado</h2>

          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="nombres"
            placeholder="Nombres"
            value={form.nombres || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            required
          />

          <input
            type="text"
            name="apellidos"
            placeholder="Apellidos"
            value={form.apellidos || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            required
          />

          <input
            type="text"
            name="cedula"
            placeholder="Cédula"
            value={form.cedula || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            required
          />

          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="email"
            name="correo"
            placeholder="Correo"
            value={form.correo || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="text"
            name="cargo"
            placeholder="Cargo"
            value={form.cargo || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <select
            name="tipo_pago"
            value={form.tipo_pago || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          >
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>

          <input
            type="number"
            name="salario_base"
            placeholder="Salario Base"
            value={form.salario_base || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="date"
            name="fecha_ingreso"
            value={form.fecha_ingreso || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <textarea
            name="direccion"
            placeholder="Dirección"
            value={form.direccion || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2 col-span-2"
          />

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            value={form.observaciones || ""}
            onChange={handleChange}
            className="border rounded px-3 py-2 col-span-2"
          />

          {/* BOTONES */}
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEmpleadoModal;
