import { useEffect, useState } from "react";

import { getEmpleados } from "../../../empleados/services/empleadosService";

import { asignarEmpleadoObra } from "../../../obras/services/empleadosObrasService";
import Swal from "sweetalert2";

interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono?: string;
  correo?: string;
  cargo?: string;
  tipo_pago: "diario" | "semanal" | "mensual";
  salario_base?: number;
  activo: boolean;
}

interface Props {
  open: boolean;
  obraId: string;
  onClose: () => void;
  onAssigned?: () => void;
}

function CreateAsignacionModal({ open, obraId, onClose, onAssigned }: Props) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  console.log("OBRA ID RECIBIDO:", obraId);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    empleado_id: "",
    cargo_obra: "",
    fecha_inicio: "",
    fecha_fin: "",
    salario_acordado: "",
    observaciones: "",
  });

  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const data = await getEmpleados();

        setEmpleados(data);
      } catch (error) {
        console.error("Error al cargar empleados:", error);
      }
    };

    if (open) {
      cargarEmpleados();
    }
  }, [open]);

  if (!open) return null;

  /* =========================
     HANDLE CHANGE
  ========================= */
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

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await asignarEmpleadoObra({
        obra_id: obraId,
        empleado_id: form.empleado_id,
        cargo_obra: form.cargo_obra,
        fecha_inicio: form.fecha_inicio || undefined,
        fecha_fin: form.fecha_fin || undefined,
        salario_acordado: form.salario_acordado
          ? Number(form.salario_acordado)
          : undefined,
        observaciones: form.observaciones,
      });
      Swal.fire({
        icon: "success",
        title: "Empleado asignado",
        text: "El empleado fue asignado correctamente a la obra.",
        timer: 1800,
        showConfirmButton: false,
      });

      setForm({
        empleado_id: "",
        cargo_obra: "",
        fecha_inicio: "",
        fecha_fin: "",
        salario_acordado: "",
        observaciones: "",
      });

      onAssigned?.();

      onClose();
    } catch (error) {
      console.error("Error al asignar empleado:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Asignar Empleado
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Relaciona un empleado con esta obra
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

            <select
              name="empleado_id"
              value={form.empleado_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              required
            >
              <option value="">Seleccionar empleado</option>

              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombres} {empleado.apellidos}
                </option>
              ))}
            </select>
          </div>

          {/* CARGO */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Cargo en Obra
            </label>

            <input
              type="text"
              name="cargo_obra"
              value={form.cargo_obra}
              onChange={handleChange}
              placeholder="Ej: Maestro de obra"
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          {/* SALARIO */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Salario Acordado
            </label>

            <input
              type="number"
              name="salario_acordado"
              value={form.salario_acordado}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          {/* FECHA INICIO */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Fecha Inicio
            </label>

            <input
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          {/* FECHA FIN */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Fecha Fin
            </label>

            <input
              type="date"
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1"
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
              placeholder="Detalles adicionales..."
              rows={4}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          {/* BOTONES */}
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Asignando..." : "Asignar Empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAsignacionModal;
