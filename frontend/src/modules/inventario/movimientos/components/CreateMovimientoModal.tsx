import { useEffect, useState } from "react";
import { createMovimiento } from "../services/movimientoService";
import { getActivos, type Activo } from "../../activos/service/activoService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateMovimientoModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [activos, setActivos] = useState<Activo[]>([]);

  const [form, setForm] = useState({
    activo_id: "",
    tipo_movimiento: "entrada",
    cantidad: 1,
    motivo: "",
    referencia: "",
  });

  useEffect(() => {
    const loadActivos = async () => {
      const data = await getActivos();
      setActivos(data);
    };

    if (open) loadActivos();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMovimiento(form);

    onCreated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-[500px] p-6 space-y-4">
        <h2 className="text-xl font-bold">Registrar Movimiento</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            className="border p-2 rounded w-full"
            value={form.activo_id}
            onChange={(e) => setForm({ ...form, activo_id: e.target.value })}
          >
            <option value="">Seleccione activo</option>
            {activos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded w-full"
            value={form.tipo_movimiento}
            onChange={(e) =>
              setForm({ ...form, tipo_movimiento: e.target.value })
            }
          >
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
          </select>

          <input
            type="number"
            placeholder="Cantidad"
            className="border p-2 rounded w-full"
            value={form.cantidad}
            onChange={(e) =>
              setForm({ ...form, cantidad: Number(e.target.value) })
            }
          />

          <input
            type="text"
            placeholder="Motivo"
            className="border p-2 rounded w-full"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
          />

          <input
            type="text"
            placeholder="Referencia"
            className="border p-2 rounded w-full"
            value={form.referencia}
            onChange={(e) => setForm({ ...form, referencia: e.target.value })}
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
