import { useEffect, useState } from "react";
import { updateUbicacion, type Ubicacion } from "../services/ubicacionService";
import Swal from "sweetalert2";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  ubicacion: Ubicacion | null;
}

function EditUbicacionModal({ open, onClose, onUpdated, ubicacion }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
  });

  const [loading, setLoading] = useState(false);

  /* =========================
     CARGAR DATA AL ABRIR
  ========================= */
  useEffect(() => {
    if (ubicacion) {
      setForm({
        nombre: ubicacion.nombre,
        descripcion: ubicacion.descripcion,
      });
    }
  }, [ubicacion]);

  /* =========================
     HANDLE CHANGE
  ========================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      Swal.fire("Error", "El nombre es obligatorio", "warning");
      return;
    }

    if (!ubicacion) return;

    try {
      setLoading(true);

      await updateUbicacion(ubicacion.id, form);

      Swal.fire(
        "Actualizado",
        "Ubicación actualizada correctamente",
        "success",
      );

      onUpdated();
      onClose();
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error al actualizar",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     NO RENDER SI ESTA CERRADO
  ========================= */
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[400px] p-6 space-y-4 shadow-lg">
        <h2 className="text-xl font-bold">Editar Ubicación</h2>

        {/* NOMBRE */}
        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* DESCRIPCION */}
        <textarea
          name="descripcion"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* BOTONES */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditUbicacionModal;
