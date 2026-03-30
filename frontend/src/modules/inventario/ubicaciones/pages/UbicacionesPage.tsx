import { useEffect, useState } from "react";
import { type Ubicacion, getUbicaciones } from "../services/ubicacionService";
import CreateUbicacionModal from "../components/CreateUbicacionModal";

function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadUbicaciones = async () => {
      const data = await getUbicaciones();
      setUbicaciones(data);
    };
    loadUbicaciones();
  }, []);

  const filtered = ubicaciones.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ubicaciones</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nueva Ubicación
        </button>
      </div>

      <input
        placeholder="Buscar ubicación..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-[300px]"
      />

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Nombre
              </th>

              <th className="text-left px-4 py-3 text-sm font-semibold">
                Descripción
              </th>

              <th className="text-left px-4 py-3 text-sm font-semibold">
                Estado
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((ubicacion) => (
              <tr key={ubicacion.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{ubicacion.nombre}</td>

                <td className="px-4 py-3">{ubicacion.descripcion}</td>

                <td className="px-4 py-3">
                  {ubicacion.activo ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded">
                      Activo
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded">
                      Inactivo
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateUbicacionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => window.location.reload()}
      />
    </div>
  );
}

export default UbicacionesPage;
