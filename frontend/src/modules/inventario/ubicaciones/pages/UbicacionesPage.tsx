import { useEffect, useState } from "react";
import {
  type Ubicacion,
  getUbicaciones,
  deleteUbicacion,
} from "../services/ubicacionService";

import CreateUbicacionModal from "../components/CreateUbicacionModal";
import EditUbicacionModal from "../components/EditUbicacionModal";

import Swal from "sweetalert2";
import { FaEdit, FaTrash } from "react-icons/fa";

function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Ubicacion | null>(null);

  /* =========================
     CARGAR DATA
  ========================= */
  const loadUbicaciones = async () => {
    try {
      const data = await getUbicaciones();
      setUbicaciones(data);
    } catch (error) {
      console.error("Error cargando ubicaciones", error);
    }
  };

  useEffect(() => {
    loadUbicaciones();
  }, []);

  /* =========================
     FILTRO
  ========================= */
  const filtered = ubicaciones.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  /* =========================
     ELIMINAR
  ========================= */
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar ubicación?",
      text: "No podrás recuperarla",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });

    if (result.isConfirmed) {
      try {
        await deleteUbicacion(id);

        Swal.fire("Eliminado", "Ubicación eliminada correctamente", "success");

        loadUbicaciones();
      } catch (error: any) {
        Swal.fire(
          "Error",
          error.response?.data?.message || "No se puede eliminar (está en uso)",
          "error",
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ubicaciones</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nueva Ubicación
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        placeholder="Buscar ubicación..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-[300px]"
      />

      {/* TABLA */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-left">
                Nombre
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-left">
                Descripción
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-left">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{u.nombre}</td>
                <td className="px-4 py-3">{u.descripcion}</td>

                {/* 🔥 ACCIONES */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    {/* EDITAR */}
                    <button
                      className="text-blue-600 hover:scale-110 transition"
                      onClick={() => {
                        setSelected(u);
                        setEditOpen(true);
                      }}
                    >
                      <FaEdit />
                    </button>

                    {/* ELIMINAR */}
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:scale-110 transition"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      <CreateUbicacionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadUbicaciones}
      />

      <EditUbicacionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadUbicaciones}
        ubicacion={selected}
      />
    </div>
  );
}

export default UbicacionesPage;
