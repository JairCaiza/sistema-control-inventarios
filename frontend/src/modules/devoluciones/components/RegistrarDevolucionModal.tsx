import { useEffect, useState } from "react";
import { registrarDevolucion } from "../services/devolucionService";
import { getContratos } from "../../contratos/service/contratoService";
import Swal from "sweetalert2";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contratoId: string;
}

function RegistrarDevolucionModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [contratos, setContratos] = useState<any[]>([]);
  const [contratoId, setContratoId] = useState("");

  const fechaHoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const res = await getContratos();
      const activos = res.filter((c: any) => c.estado === "activo");
      setContratos(activos.length ? activos : res);
    };

    if (open) load();
  }, [open]);

  const handleSubmit = async () => {
    if (!contratoId) {
      Swal.fire("Error", "Selecciona un contrato", "warning");
      return;
    }

    try {
      setLoading(true);

      const res = await registrarDevolucion({
        contrato_id: contratoId,
        fecha_devolucion: fechaHoy,
        metodo_pago: metodoPago,
      });

      Swal.fire({
        icon: "success",
        title: "Devolución registrada",
        html: `
          Retraso: ${res.dias_retraso} días <br/>
          Penalidad: $${res.penalidad_total}
        `,
      });

      // 🔥 ABRIR NOTA AUTOMÁTICAMENTE
      if (res.nota_id) {
        window.open(`/api/notas/${res.nota_id}/pdf`, "_blank");
      }

      onSuccess();
      onClose();
      setContratoId("");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        Swal.fire(
          "Error",
          error.response?.data?.message ?? "No se pudo registrar",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-[var(--radius-lg)] w-[420px] shadow-[var(--shadow-medium)]">
        <h2 className="font-semibold mb-4">Registrar devolución</h2>

        <label>Contrato</label>
        <select
          value={contratoId}
          onChange={(e) => setContratoId(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        >
          <option value="">Seleccione</option>
          {contratos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.numero_contrato ?? c.id}
            </option>
          ))}
        </select>

        <label>Fecha</label>
        <input
          type="date"
          value={fechaHoy}
          disabled
          className="w-full border p-2 rounded bg-gray-100 mb-3"
        />

        <label>Método de pago</label>
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>

          <button
            onClick={handleSubmit}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded"
          >
            {loading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistrarDevolucionModal;
