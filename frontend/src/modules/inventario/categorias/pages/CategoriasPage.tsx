import { useEffect, useState } from "react";
import {
  type Categoria,
  getCategorias,
  deleteCategoria,
  toggleCategoriaStatus,
} from "../services/categoriaService";

import CreateCategoriaModal from "../components/CreateCategoriaModal";
import EditCategoriaModal from "../components/EditCategoriaModal";

import Swal from "sweetalert2";
import { FaEdit, FaTrash } from "react-icons/fa";

function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Categoria | null>(null);

  /* =========================
     LOAD
  ========================= */
  const loadCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (error) {
      console.error("Error cargando categorias", error);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  /* =========================
     FILTER
  ========================= */
  const filtered = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  /* =========================
     TOGGLE
  ========================= */
  const handleToggle = async (categoria: Categoria) => {
    try {
      const nuevoEstado = !categoria.activo;

      await toggleCategoriaStatus(categoria.id, nuevoEstado);

      setCategorias((prev) =>
        prev.map((c) =>
          c.id === categoria.id ? { ...c, activo: nuevoEstado } : c,
        ),
      );

      Swal.fire({
        icon: "success",
        title: nuevoEstado ? "Activado" : "Desactivado",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo cambiar el estado", "error");
    }
  };

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar categoría?",
      text: "No se podrá recuperar",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });

    if (result.isConfirmed) {
      try {
        await deleteCategoria(id);

        Swal.fire("Eliminado", "Categoría eliminada", "success");

        loadCategorias();
      } catch (error: any) {
        Swal.fire(
          "Error",
          error.response?.data?.message || "No se pudo eliminar",
          "error",
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorías</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nueva Categoría
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        placeholder="Buscar categoría..."
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
                Tipo
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-left">
                Estado
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-left">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((categoria) => (
              <tr key={categoria.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{categoria.nombre}</td>

                {/* 🔥 CAMBIO IMPORTANTE */}
                <td className="px-4 py-3 capitalize">{categoria.tipo}</td>

                <td className="px-4 py-3">
                  {categoria.activo ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded">
                      Activo
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded">
                      Inactivo
                    </span>
                  )}
                </td>

                {/* ACCIONES */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    {/* EDITAR */}
                    <button
                      className="text-blue-600 hover:scale-110 transition"
                      onClick={() => {
                        setSelected(categoria);
                        setEditOpen(true);
                      }}
                    >
                      <FaEdit />
                    </button>

                    {/* SWITCH */}
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={categoria.activo}
                        onChange={() => handleToggle(categoria)}
                        className="sr-only peer"
                      />

                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 relative transition">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                      </div>
                    </label>

                    {/* ELIMINAR */}
                    <button
                      onClick={() => handleDelete(categoria.id)}
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
      <CreateCategoriaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadCategorias}
      />

      <EditCategoriaModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadCategorias}
        categoria={selected}
      />
    </div>
  );
}

export default CategoriasPage;
