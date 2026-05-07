import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { updateCategoria } from "../services/categoriaService";

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  activo: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  categoria: Categoria | null;
}

function EditCategoriaModal({ open, onClose, onUpdated, categoria }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    tipo: "equipo",
  });

  /* =========================
     CARGAR DATOS AL ABRIR
  ========================= */
  useEffect(() => {
    if (categoria) {
      setForm({
        nombre: categoria.nombre,
        tipo: categoria.tipo,
      });
    }
  }, [categoria]);

  if (!open || !categoria) return null;

  /* =========================
     HANDLE CHANGE
  ========================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
      await updateCategoria(categoria.id, form);

      Swal.fire({
        icon: "success",
        title: "Categoría actualizada",
        timer: 1500,
        showConfirmButton: false,
      });

      onUpdated();
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message || "Error al actualizar categoría",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4">Editar Categoría</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NOMBRE */}
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre de la categoría"
            className="w-full border p-2 rounded"
          />

          {/* 🔥 TIPO (SELECT CORRECTO) */}
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="equipo">Equipo</option>
            <option value="herramienta">Herramienta</option>
            <option value="encofrado">Encofrado</option>
          </select>

          {/* BOTONES */}
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
            >
              Actualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCategoriaModal;
