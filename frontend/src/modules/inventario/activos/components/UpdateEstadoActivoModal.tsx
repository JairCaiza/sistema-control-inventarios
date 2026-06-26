import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import {
  updateEstadoActivo,
  type Activo,
} from "../../activos/service/activoService";

interface Props {
  open: boolean;

  onClose: () => void;

  activo: Activo | null;

  onUpdated: () => void;
}

function UpdateEstadoActivoModal({ open, onClose, activo, onUpdated }: Props) {
  const [estado, setEstado] = useState("disponible");

  /* =========================
     ACTUALIZAR ESTADO AL ABRIR
  ========================= */

  useEffect(() => {
    if (activo) {
      setEstado(activo.estado);
    }
  }, [activo]);

  /* =========================
     NO RENDER
  ========================= */

  if (!open || !activo) return null;

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateEstadoActivo(activo.id, estado);

      Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        timer: 2000,
        showConfirmButton: false,
      });

      onUpdated();

      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message || "No se pudo actualizar el estado",
      });
    }
  };

  return (
    <div
      className="
        fixed inset-0
        bg-black/40
        flex items-center justify-center
        z-50
      "
    >
      <div
        className="
          bg-white
          rounded-lg
          w-[400px]
          p-6
        "
      >
        {/* TITULO */}

        <h2 className="text-xl font-bold mb-4">Cambiar estado</h2>

        {/* INFO */}

        <p className="text-sm mb-4">
          Activo:
          <span className="font-semibold ml-1">{activo.nombre}</span>
        </p>

        {/* FORM */}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SELECT */}

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="
              w-full
              border
              p-2
              rounded
            "
          >
            <option value="disponible">Disponible</option>

            <option value="alquilado">Alquilado</option>

            <option value="mantenimiento">Mantenimiento</option>

            <option value="danado">Dañado</option>

            <option value="perdido">Perdido</option>
          </select>

          {/* BOTONES */}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="
                px-4 py-2
                border
                rounded
                hover:bg-gray-100
                transition
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="
                px-4 py-2
                bg-[var(--color-primary)]
                text-white
                rounded
                hover:opacity-90
                transition
              "
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
