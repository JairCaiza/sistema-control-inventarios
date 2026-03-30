import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Activo, getActivos } from "../../activos/service/activoService";
import CreateActivoModal from "../components/CreateActivoModal";
import UpdateEstadoActivoModal from "../components/UpdateEstadoActivoModal";

function ActivosPage() {
  const navigate = useNavigate();

  const [activos, setActivos] = useState<Activo[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);

  const loadActivos = async () => {
    try {
      const data = await getActivos();
      setActivos(data);
    } catch (error) {
      console.error("Error cargando activos:", error);
    }
  };

  useEffect(() => {
    loadActivos();
  }, []);

  const openEstadoModal = (activo: Activo) => {
    setSelectedActivo(activo);
    setEstadoModalOpen(true);
  };

  const filtered = activos.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Activos
        </h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-md text-white font-medium
          bg-[var(--color-primary)]
          hover:bg-[var(--color-accent)]
          transition"
        >
          + Nuevo Activo
        </button>
      </div>

      {/* BUSCADOR */}

      <input
        placeholder="Buscar activo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-[var(--color-border)] 
        p-2 rounded-md w-[300px]
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--color-primary)]"
      />

      {/* TABLA */}

      <div
        className="bg-[var(--color-white)]
        rounded-lg
        border
        border-[var(--color-border)]
        shadow-[var(--shadow-soft)]
        overflow-hidden"
      >
        <table className="w-full">
          {/* HEADER TABLA */}

          <thead className="bg-gray-50">
            <tr className="text-[var(--text-secondary)] text-sm">
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Ubicación</th>
              <th className="px-4 py-3 text-left">Cantidad</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>

          {/* BODY TABLA */}

          <tbody>
            {filtered.map((activo) => (
              <tr
                key={activo.id}
                className="border-t border-[var(--color-border)]
                hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">{activo.codigo}</td>
                <td className="px-4 py-3">{activo.nombre}</td>
                <td className="px-4 py-3">{activo.categoria}</td>
                <td className="px-4 py-3">{activo.ubicacion}</td>
                <td className="px-4 py-3">{activo.cantidad_total}</td>

                {/* BADGE ESTADO */}

                <td className="px-4 py-3">
                  <span
                    className="px-2 py-1 text-xs rounded-md font-medium"
                    style={{
                      background: "#DCFCE7",
                      color: "#166534",
                    }}
                  >
                    {activo.estado}
                  </span>
                </td>

                {/* BOTONES */}

                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/activos/${activo.id}`)}
                    className="px-3 py-1 text-sm rounded-md text-white
                    bg-[var(--color-gray-soft)]
                    hover:opacity-80 transition"
                  >
                    Historial
                  </button>

                  <button
                    onClick={() => openEstadoModal(activo)}
                    className="px-3 py-1 text-sm rounded-md text-white
                    bg-[var(--color-info)]
                    hover:opacity-80 transition"
                  >
                    Cambiar estado
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALES */}

      <CreateActivoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadActivos}
      />

      <UpdateEstadoActivoModal
        open={estadoModalOpen}
        activo={selectedActivo}
        onClose={() => setEstadoModalOpen(false)}
        onUpdated={loadActivos}
      />
    </div>
  );
}

export default ActivosPage;
