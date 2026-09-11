import { useEffect, useMemo, useState } from "react";

import {
  type Categoria,
  getCategorias,
  deleteCategoria,
  toggleCategoriaStatus,
} from "../services/categoriaService";

import CreateCategoriaModal from "../components/CreateCategoriaModal";
import EditCategoriaModal from "../components/EditCategoriaModal";

import Swal from "sweetalert2";

import {
  Boxes,
  PackageCheck,
  PackageX,
  Layers3,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Power,
  Trash2,
  Tag,
  Wrench,
  Box,
} from "lucide-react";

/* =====================================================
   COMPONENTE
===================================================== */

function CategoriasPage() {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selected, setSelected] = useState<Categoria | null>(null);

  /* =====================================================
     CARGAR CATEGORÍAS
  ===================================================== */

  const loadCategorias = async () => {
    try {
      setLoading(true);

      const data = await getCategorias();

      setCategorias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando categorías:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudieron cargar las categorías",
        text: "Ocurrió un error al consultar las categorías del inventario.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  /* =====================================================
     FILTRO
  ===================================================== */

  const categoriasFiltradas = useMemo(() => {
    const termino = search.trim().toLowerCase();

    if (!termino) {
      return categorias;
    }

    return categorias.filter(
      (categoria) =>
        categoria.nombre?.toLowerCase().includes(termino) ||
        categoria.tipo?.toLowerCase().includes(termino),
    );
  }, [categorias, search]);

  /* =====================================================
     KPIs
  ===================================================== */

  const totalCategorias = categorias.length;

  const categoriasActivas = useMemo(
    () => categorias.filter((categoria) => categoria.activo).length,
    [categorias],
  );

  const categoriasInactivas = useMemo(
    () => categorias.filter((categoria) => !categoria.activo).length,
    [categorias],
  );

  const tiposCategoria = useMemo(
    () =>
      new Set(categorias.map((categoria) => categoria.tipo).filter(Boolean))
        .size,
    [categorias],
  );

  /* =====================================================
     ICONO SEGÚN TIPO
  ===================================================== */

  const obtenerIconoTipo = (tipo?: string) => {
    switch (tipo?.toLowerCase()) {
      case "equipo":
        return <Box size={18} />;

      case "herramienta":
        return <Wrench size={18} />;

      case "encofrado":
        return <Layers3 size={18} />;

      default:
        return <Tag size={18} />;
    }
  };

  /* =====================================================
     CAMBIAR ESTADO
  ===================================================== */

  const handleToggle = async (categoria: Categoria) => {
    const nuevoEstado = !categoria.activo;

    const confirmacion = await Swal.fire({
      icon: "question",

      title: nuevoEstado ? "¿Activar categoría?" : "¿Desactivar categoría?",

      html: `
            <div style="text-align:left; line-height:1.7">
              <p>
                <strong>Categoría:</strong>
                ${categoria.nombre}
              </p>

              <p>
                <strong>Tipo:</strong>
                ${categoria.tipo}
              </p>

              <p>
                <strong>Nuevo estado:</strong>
                ${nuevoEstado ? "Activo" : "Inactivo"}
              </p>
            </div>
          `,

      showCancelButton: true,

      confirmButtonText: nuevoEstado ? "Sí, activar" : "Sí, desactivar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: nuevoEstado ? "#16a34a" : "#dc2626",
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      setProcessingId(categoria.id);

      await toggleCategoriaStatus(categoria.id, nuevoEstado);

      setCategorias((prev) =>
        prev.map((item) =>
          item.id === categoria.id
            ? {
                ...item,
                activo: nuevoEstado,
              }
            : item,
        ),
      );

      await Swal.fire({
        icon: "success",

        title: nuevoEstado ? "Categoría activada" : "Categoría desactivada",

        text: `${categoria.nombre} fue ${
          nuevoEstado ? "activada" : "desactivada"
        } correctamente.`,

        timer: 1700,

        showConfirmButton: false,

        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error("Error cambiando estado:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo cambiar el estado",

        text:
          error?.response?.data?.message ||
          "Ocurrió un error al actualizar la categoría.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  /* =====================================================
     EDITAR
  ===================================================== */

  const handleEdit = (categoria: Categoria) => {
    setSelected(categoria);

    setEditOpen(true);
  };

  /* =====================================================
     ELIMINAR
  ===================================================== */

  const handleDelete = async (categoria: Categoria) => {
    const result = await Swal.fire({
      icon: "warning",

      title: "¿Eliminar categoría?",

      html: `
            <div style="text-align:left; line-height:1.7">

              <p>
                <strong>Categoría:</strong>
                ${categoria.nombre}
              </p>

              <p>
                Esta acción es permanente.
                Si la categoría tiene activos relacionados,
                el sistema puede impedir la eliminación.
              </p>

            </div>
          `,

      showCancelButton: true,

      confirmButtonText: "Sí, eliminar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setProcessingId(categoria.id);

      await deleteCategoria(categoria.id);

      setCategorias((prev) => prev.filter((item) => item.id !== categoria.id));

      await Swal.fire({
        icon: "success",

        title: "Categoría eliminada",

        text: `${categoria.nombre} fue eliminada correctamente.`,

        timer: 1700,

        showConfirmButton: false,

        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error("Error eliminando categoría:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo eliminar",

        text:
          error?.response?.data?.message ||
          "La categoría puede tener activos relacionados.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Categorías
          </h1>

          <p className="mt-1 text-gray-500">
            Organiza y clasifica los equipos, herramientas y elementos del
            inventario.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadCategorias}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={18} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* =================================================
          KPIs
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Categorías
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {totalCategorias}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Categorías registradas
              </p>
            </div>

            <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
              <Boxes size={24} />
            </div>
          </div>
        </div>

        {/* ACTIVAS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Categorías Activas
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {categoriasActivas}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Disponibles para inventario
              </p>
            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <PackageCheck size={24} />
            </div>
          </div>
        </div>

        {/* INACTIVAS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Categorías Inactivas
              </p>

              <h2 className="mt-2 text-3xl font-bold text-red-600">
                {categoriasInactivas}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Fuera de operación</p>
            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <PackageX size={24} />
            </div>
          </div>
        </div>

        {/* TIPOS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Tipos de Categoría
              </p>

              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {tiposCategoria}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Clasificaciones distintas
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Layers3 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          BUSCADOR
      ================================================= */}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">
              Catálogo de Categorías
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Busca por nombre o tipo de categoría.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Buscar categoría..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              Categorías Registradas
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {categoriasFiltradas.length} resultados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw size={22} className="animate-spin" />
              Cargando categorías...
            </div>
          </div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <Boxes size={44} className="mb-3 text-gray-300" />

            <p className="font-medium text-gray-600">
              No se encontraron categorías
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Registra una nueva categoría o cambia el criterio de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Categoría
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tipo
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {categoriasFiltradas.map((categoria) => {
                  const processing = processingId === categoria.id;

                  return (
                    <tr
                      key={categoria.id}
                      className="border-t transition hover:bg-gray-50"
                    >
                      {/* CATEGORÍA */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            {obtenerIconoTipo(categoria.tipo)}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">
                              {categoria.nombre}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              ID: {categoria.id.slice(0, 8)}
                              ...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* TIPO */}

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium capitalize text-blue-700">
                          {obtenerIconoTipo(categoria.tipo)}

                          {categoria.tipo}
                        </span>
                      </td>

                      {/* ESTADO */}

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            categoria.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              categoria.activo ? "bg-green-500" : "bg-red-500"
                            }`}
                          />

                          {categoria.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(categoria)}
                            disabled={processing}
                            title="Editar categoría"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggle(categoria)}
                            disabled={processing}
                            title={
                              categoria.activo
                                ? "Desactivar categoría"
                                : "Activar categoría"
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              categoria.activo
                                ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {processing ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Power size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(categoria)}
                            disabled={processing}
                            title="Eliminar categoría"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          NOTA ERP
      ================================================= */}

      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        Las categorías permiten clasificar los activos del inventario y
        facilitan la búsqueda, control y elaboración de reportes. Una categoría
        inactiva puede conservar su información histórica sin estar disponible
        para nuevas operaciones.
      </div>

      {/* =================================================
          MODALES
      ================================================= */}

      <CreateCategoriaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadCategorias}
      />

      <EditCategoriaModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);

          setSelected(null);
        }}
        onUpdated={loadCategorias}
        categoria={selected}
      />
    </div>
  );
}

export default CategoriasPage;
