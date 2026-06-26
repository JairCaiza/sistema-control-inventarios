import { useState } from "react";
import { desasignarEmpleadoObra } from "../../services/empleadosObrasService";
import Swal from "sweetalert2";

interface EditDesasignacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  asignacionId: string;
  onDesasignado: () => void;
}

export default function EditDesasignacionModal({
  isOpen,
  onClose,
  asignacionId,
  onDesasignado,
}: EditDesasignacionModalProps) {
  const [motivoSalida, setMotivoSalida] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "¿Desvincular empleado?",
      text: "El empleado dejará de estar asignado a esta obra.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desvincular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await desasignarEmpleadoObra(asignacionId, motivoSalida, observaciones);

      Swal.fire("Éxito", "Empleado desvinculado correctamente", "success");
      onDesasignado();

      onClose();
    } catch (error) {
      Swal.fire("Error", "No se pudo desvincular el empleado", "error");
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Desasignar empleado</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Motivo de salida
            </label>

            <select
              value={motivoSalida}
              onChange={(e) => setMotivoSalida(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Seleccione un motivo</option>
              <option value="salud">Salud</option>
              <option value="renuncia">Renuncia</option>
              <option value="despido">Despido</option>
              <option value="abandono">Abandono</option>
              <option value="fin_contrato">Fin de contrato</option>
              <option value="traslado">Traslado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Observaciones
            </label>

            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Ingrese una observación..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Desasignar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
