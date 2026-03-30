import { useEffect, useState } from "react";
import { type Categoria, getCategorias } from "../services/categoriaService";
import CreateCategoriaModal from "../components/CreateCategoriaModal";

function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadCategorias = async () => {
      const data = await getCategorias();
      setCategorias(data);
    };

    loadCategorias();
  }, []);

  const filtered = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorías</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nueva Categoría
        </button>
      </div>

      <input
        placeholder="Buscar categoría..."
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
            {filtered.map((categoria) => (
              <tr key={categoria.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{categoria.nombre}</td>
                <td className="px-4 py-3">{categoria.descripcion}</td>

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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateCategoriaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => window.location.reload()}
      />
    </div>
  );
}

export default CategoriasPage;
