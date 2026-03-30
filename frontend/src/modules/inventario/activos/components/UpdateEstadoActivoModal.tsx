import { useState } from "react";
import Swal from "sweetalert2";
import { updateEstadoActivo } from "../../activos/service/activoService";
import { type Activo } from "../../activos/service/activoService";

interface Props {
  open: boolean;
  onClose: () => void;
  activo: Activo | null;
  onUpdated: () => void;
}

function UpdateEstadoActivoModal({ open, onClose, activo, onUpdated }: Props) {
  const [estado, setEstado] = useState(activo?.estado || "activo");

  if (!open || !activo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateEstadoActivo(activo.id, estado);

    Swal.fire({
      icon: "success",
      title: "Estado actualizado",
      timer: 2000,
      showConfirmButton: false,
    });

    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[400px] p-6">
        <h2 className="text-xl font-bold mb-4">Cambiar estado</h2>

        <p className="text-sm mb-4">
          Activo: <b>{activo.nombre}</b>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="activo">Activo</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="inactivo">Inactivo</option>
            <option value="baja">Baja</option>
          </select>

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
              Actualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateEstadoActivoModal;
