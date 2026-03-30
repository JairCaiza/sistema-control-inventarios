import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { createCategoria } from "../services/categoriaService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateCategoriaModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
  });

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCategoria(form);

      Swal.fire({
        icon: "success",
        title: "Categoría creada",
        timer: 2000,
        showConfirmButton: false,
      });

      onCreated();
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message ?? "Error al crear categoría",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4">Nueva Categoría</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="nombre"
            placeholder="Nombre de la categoría"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="descripcion"
            placeholder="Descripción"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCategoriaModal;
