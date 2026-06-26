import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import type { Obra } from "../../services/obrasService";
import { updateObra } from "../../services/obrasService";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  obra: Obra | null;
}

function EditObraModal({ open, onClose, onUpdated, obra }: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    ubicacion: "",
    fecha_inicio: "",
    fecha_fin: "",
    presupuesto: "",
    estado: "planificada",
    responsable: "",
  });

  useEffect(() => {
    if (obra) {
      setForm({
        nombre: obra.nombre || "",
        descripcion: obra.descripcion || "",
        ubicacion: obra.ubicacion || "",
        fecha_inicio: obra.fecha_inicio || "",
        fecha_fin: obra.fecha_fin || "",
        presupuesto: obra.presupuesto?.toString() || "",
        estado: obra.estado || "planificada",
        responsable: obra.responsable || "",
      });
    }
  }, [obra]);

  if (!open || !obra) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await updateObra(obra.id, {
        ...form,
        presupuesto: Number(form.presupuesto),
      });

      Swal.fire({
        icon: "success",
        title: "Obra actualizada",
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Editar Obra</h2>

          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="text"
            name="ubicacion"
            value={form.ubicacion}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="date"
            name="fecha_inicio"
            value={form.fecha_inicio}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="date"
            name="fecha_fin"
            value={form.fecha_fin}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="number"
            name="presupuesto"
            value={form.presupuesto}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <input
            type="text"
            name="responsable"
            value={form.responsable}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />

          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          >
            <option value="planificada">Planificada</option>

            <option value="en_proceso">En Proceso</option>

            <option value="finalizada">Finalizada</option>

            <option value="suspendida">Suspendida</option>
          </select>

          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            className="border rounded px-3 py-2 col-span-2"
          />

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

export default EditObraModal;
