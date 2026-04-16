// components/RegistrarDevolucionModal.tsx
import { useState } from "react";
import { registrarDevolucion } from "../services/devolucionService";
import Swal from "sweetalert2";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
  contratoId: string;
  onSuccess: () => void;
}

function RegistrarDevolucionModal({
  open,
  onClose,
  contratoId,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const fechaHoy = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const res = await registrarDevolucion({
        contrato_id: contratoId,
        fecha_devolucion: fechaHoy,
      });

      Swal.fire({
        icon: "success",
        title: "Devolución registrada",
        html: `
          Retraso: ${res.dias_retraso} días <br/>
          Penalidad: $${res.penalidad_total}
        `,
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message ?? "No se pudo registrar",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-[400px]">
        <h2 className="font-bold mb-4">Registrar devolución</h2>

        <input
          type="date"
          value={fechaHoy}
          disabled
          className="w-full border p-2 rounded bg-gray-100"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose}>Cancelar</button>

          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            {loading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistrarDevolucionModal;
