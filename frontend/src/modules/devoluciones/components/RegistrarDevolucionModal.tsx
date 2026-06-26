import { useEffect, useState } from "react";
import { registrarDevolucion } from "../services/devolucionService";
import { getContratos } from "../../contratos/service/contratoService";
import Swal from "sweetalert2";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contratoId?: string;
}

function RegistrarDevolucionModal({
  open,
  onClose,
  onSuccess,
  contratoId: contratoIdProp,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [contratos, setContratos] = useState<any[]>([]);
  const [contratoId, setContratoId] = useState("");

  const fechaHoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const res = await getContratos();

      const contratosPendientes = res.filter((c: any) => {
        return c.estado === "activo" || Number(c.saldo_pendiente || 0) > 0;
      });

      setContratos(contratosPendientes.length ? contratosPendientes : res);

      if (contratoIdProp) {
        setContratoId(contratoIdProp);
      }
    };

    if (open) {
      load();
    }
  }, [open, contratoIdProp]);

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
      });

      Swal.fire({
        icon: "success",
        title: "Devolución registrada",
        html: `
          <b>Retraso:</b> ${res.dias_retraso || 0} días <br/>
          <b>Penalidad:</b> $${res.penalidad_total || 0} <br/><br/>
          ${
            Number(res.penalidad_total || 0) > 0
              ? "La penalidad queda como saldo pendiente. Debe cobrarse desde pagos del contrato."
              : "No se generó penalidad."
          }
        `,
      });

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
      } else {
        Swal.fire("Error", "No se pudo registrar", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const selected = contratos.find((c) => c.id === contratoId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-[var(--radius-lg)] w-[460px] shadow-[var(--shadow-medium)]">
        <h2 className="text-xl font-semibold mb-1">Registrar devolución</h2>

        <p className="text-sm text-gray-500 mb-4">
          Esta acción devuelve el stock, finaliza el contrato y calcula
          penalidad si existe.
        </p>

        <label className="text-sm font-medium">Contrato</label>
        <select
          value={contratoId}
          onChange={(e) => setContratoId(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        >
          <option value="">Seleccione</option>
          {contratos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.numero_contrato ?? c.id} - {c.cliente ?? "Cliente"}
            </option>
          ))}
        </select>

        {selected && (
          <div className="bg-gray-50 border rounded-lg p-3 mb-3 text-sm">
            <p>
              <b>Total:</b> ${Number(selected.total || 0).toFixed(2)}
            </p>
            <p>
              <b>Pagado:</b> ${Number(selected.pagado || 0).toFixed(2)}
            </p>
            <p>
              <b>Saldo pendiente:</b> $
              {Number(selected.saldo_pendiente || 0).toFixed(2)}
            </p>
            <p>
              <b>Estado:</b> {selected.estado}
            </p>
          </div>
        )}

        <label className="text-sm font-medium">Fecha devolución</label>
        <input
          type="date"
          value={fechaHoy}
          disabled
          className="w-full border p-2 rounded bg-gray-100 mb-4"
        />

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800 font-medium">Importante</p>
          <p className="text-xs text-yellow-700 mt-1">
            La devolución no registra dinero ni genera nota de venta. Si existe
            penalidad, se cobrará luego desde pagos del contrato con concepto
            “penalidad”.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded border"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded"
          >
            {loading ? "Procesando..." : "Confirmar devolución"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistrarDevolucionModal;
