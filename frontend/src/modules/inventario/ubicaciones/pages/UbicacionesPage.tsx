import { useEffect, useMemo, useState } from "react";

import {
  type Ubicacion,
  getUbicaciones,
  deleteUbicacion,
} from "../services/ubicacionService";

import CreateUbicacionModal from "../components/CreateUbicacionModal";
import EditUbicacionModal from "../components/EditUbicacionModal";

import Swal from "sweetalert2";

import {
  MapPinned,
  Warehouse,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Building2,
  Boxes,
} from "lucide-react";

function UbicacionesPage() {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selected, setSelected] = useState<Ubicacion | null>(null);

  /* =====================================================
     CARGAR UBICACIONES
  ===================================================== */

  const loadUbicaciones = async () => {
    try {
      setLoading(true);

      const data = await getUbicaciones();

      setUbicaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando ubicaciones:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudieron cargar las ubicaciones",
        text: "Ocurrió un error al consultar las ubicaciones del inventario.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUbicaciones();
  }, []);

  /* =====================================================
     FILTRO
  ===================================================== */

  const ubicacionesFiltradas = useMemo(() => {
    const termino = search.trim().toLowerCase();

    if (!termino) {
      return ubicaciones;
    }

    return ubicaciones.filter(
      (ubicacion) =>
        ubicacion.nombre?.toLowerCase().includes(termino) ||
        ubicacion.descripcion?.toLowerCase().includes(termino),
    );
  }, [ubicaciones, search]);

  /* =====================================================
     KPIs
  ===================================================== */

  const totalUbicaciones = ubicaciones.length;

  const conDescripcion = useMemo(
    () =>
      ubicaciones.filter((ubicacion) => Boolean(ubicacion.descripcion?.trim()))
        .length,
    [ubicaciones],
  );

  const sinDescripcion = totalUbicaciones - conDescripcion;

  const porcentajeDocumentadas =
    totalUbicaciones > 0
      ? Math.round((conDescripcion / totalUbicaciones) * 100)
      : 0;

  /* =====================================================
     EDITAR
  ===================================================== */

  const handleEdit = (ubicacion: Ubicacion) => {
    setSelected(ubicacion);

    setEditOpen(true);
  };

  /* =====================================================
     ELIMINAR
  ===================================================== */

  const handleDelete = async (ubicacion: Ubicacion) => {
    const result = await Swal.fire({
      icon: "warning",

      title: "¿Eliminar ubicación?",

      html: `
            <div style="text-align:left; line-height:1.7">
              <p>
                <strong>Ubicación:</strong>
                ${ubicacion.nombre}
              </p>

              <p>
                Esta acción es permanente.
                Si existen activos relacionados,
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
      setProcessingId(ubicacion.id);

      await deleteUbicacion(ubicacion.id);

      setUbicaciones((prev) => prev.filter((item) => item.id !== ubicacion.id));

      await Swal.fire({
        icon: "success",

        title: "Ubicación eliminada",

        text: `${ubicacion.nombre} fue eliminada correctamente.`,

        timer: 1700,

        showConfirmButton: false,

        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error("Error eliminando ubicación:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo eliminar",

        text:
          error?.response?.data?.message ||
          "La ubicación puede estar siendo utilizada por activos del inventario.",
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
            Gestión de Ubicaciones
          </h1>

          <p className="mt-1 text-gray-500">
            Administra bodegas, patios, almacenes y zonas utilizadas para ubicar
            los activos del inventario.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadUbicaciones}
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
            Nueva Ubicación
          </button>
        </div>
      </div>

      {/* =================================================
          KPIs
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Ubicaciones
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {totalUbicaciones}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Ubicaciones registradas
              </p>
            </div>

            <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
              <MapPinned size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Documentadas</p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {conDescripcion}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Con descripción registrada
              </p>
            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <Warehouse size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Sin Descripción
              </p>

              <h2 className="mt-2 text-3xl font-bold text-amber-600">
                {sinDescripcion}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Pendientes de completar
              </p>
            </div>

            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <Building2 size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Documentación</p>

              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {porcentajeDocumentadas}%
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Información completada
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Boxes size={24} />
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
              Directorio de Ubicaciones
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Busca por nombre o descripción de la ubicación.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Buscar ubicación..."
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
              Ubicaciones Registradas
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {ubicacionesFiltradas.length} resultados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw size={22} className="animate-spin" />
              Cargando ubicaciones...
            </div>
          </div>
        ) : ubicacionesFiltradas.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <MapPinned size={44} className="mb-3 text-gray-300" />

            <p className="font-medium text-gray-600">
              No se encontraron ubicaciones
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Registra una nueva ubicación o modifica el criterio de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ubicación
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Descripción
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Información
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {ubicacionesFiltradas.map((ubicacion) => {
                  const processing = processingId === ubicacion.id;

                  const tieneDescripcion = Boolean(
                    ubicacion.descripcion?.trim(),
                  );

                  return (
                    <tr
                      key={ubicacion.id}
                      className="border-t transition hover:bg-gray-50"
                    >
                      {/* UBICACIÓN */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            <MapPinned size={20} />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">
                              {ubicacion.nombre}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              ID: {ubicacion.id.slice(0, 8)}
                              ...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPCIÓN */}

                      <td className="max-w-md px-5 py-4 text-sm text-gray-600">
                        {ubicacion.descripcion || "Sin descripción registrada"}
                      </td>

                      {/* INFORMACIÓN */}

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            tieneDescripcion
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              tieneDescripcion ? "bg-green-500" : "bg-amber-500"
                            }`}
                          />

                          {tieneDescripcion ? "Completa" : "Pendiente"}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(ubicacion)}
                            disabled={processing}
                            title="Editar ubicación"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(ubicacion)}
                            disabled={processing}
                            title="Eliminar ubicación"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {processing ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
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
        Las ubicaciones representan los lugares físicos donde pueden encontrarse
        los equipos, herramientas y demás activos. Esta información permite
        mantener trazabilidad sobre movimientos, disponibilidad y localización
        del inventario.
      </div>

      {/* =================================================
          MODALES
      ================================================= */}

      <CreateUbicacionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadUbicaciones}
      />

      <EditUbicacionModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);

          setSelected(null);
        }}
        onUpdated={loadUbicaciones}
        ubicacion={selected}
      />
    </div>
  );
}

export default UbicacionesPage;
