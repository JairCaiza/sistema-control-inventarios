import { useState } from "react";
import Swal from "sweetalert2";
import { createActivo } from "../../activos/service/activoService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateActivoModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    categoria_id: "",
    ubicacion_id: "",
    cantidad: 0,
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

    await createActivo(form);

    Swal.fire({
      icon: "success",
      title: "Activo creado",
      timer: 2000,
      showConfirmButton: false,
    });

    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[420px] rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Nuevo Activo</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="codigo"
            placeholder="Código"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            name="nombre"
            placeholder="Nombre"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            name="categoria_id"
            placeholder="Categoría ID"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            name="ubicacion_id"
            placeholder="Ubicación ID"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            name="cantidad"
            type="number"
            placeholder="Cantidad"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <div className="flex justify-end gap-2">
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

export default CreateActivoModal;
