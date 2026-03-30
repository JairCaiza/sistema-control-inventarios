import { useEffect, useState } from "react";
import { getMovimientos, type Movimiento } from "../services/movimientoService";
import CreateMovimientoModal from "../components/CreateMovimientoModal";

function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadMovimientos = async () => {
      const data = await getMovimientos();
      setMovimientos(data);
    };
    loadMovimientos();
  }, []);

  const filtered = movimientos.filter((m) =>
    m.activo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Movimientos Inventario</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nuevo Movimiento
        </button>
      </div>

      <input
        placeholder="Buscar activo..."
        className="border p-2 rounded w-[300px]"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Activo</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Cantidad</th>
              <th className="px-4 py-3 text-left">Motivo</th>
              <th className="px-4 py-3 text-left">Referencia</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  {new Date(m.fecha_creacion).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">{m.activo}</td>

                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                    {m.tipo_movimiento}
                  </span>
                </td>

                <td className="px-4 py-3">{m.cantidad}</td>

                <td className="px-4 py-3">{m.motivo}</td>

                <td className="px-4 py-3">{m.referencia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateMovimientoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => window.location.reload()}
      />
    </div>
  );
}

export default MovimientosPage;
