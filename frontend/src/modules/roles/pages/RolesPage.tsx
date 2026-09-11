import { useEffect, useMemo, useState } from "react";

import {
  getRoles,
  toggleRoleStatus,
  deleteRole,
} from "../services/roleService";

import CreateRoleModal from "../components/CreateRoleModal";
import EditRoleModal from "../components/EditRoleModal";

import Swal from "sweetalert2";

import {
  ShieldCheck,
  ShieldX,
  Plus,
  Search,
  RefreshCw,
  UsersRound,
  BadgeCheck,
  Edit3,
  Power,
  Trash2,
} from "lucide-react";

/* =====================================================
   TIPOS
===================================================== */

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

/* =====================================================
   COMPONENTE
===================================================== */

function RolesPage() {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  /* =====================================================
     CARGAR ROLES
  ===================================================== */

  const loadRoles = async () => {
    try {
      setLoading(true);

      const data = await getRoles();

      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando roles:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudieron cargar los roles",
        text: "Ocurrió un error al consultar los roles del sistema.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  /* =====================================================
     KPIs
  ===================================================== */

  const totalRoles = roles.length;

  const rolesActivos = useMemo(
    () => roles.filter((role) => role.activo).length,
    [roles],
  );

  const rolesInactivos = useMemo(
    () => roles.filter((role) => !role.activo).length,
    [roles],
  );

  const porcentajeActivos =
    totalRoles > 0 ? Math.round((rolesActivos / totalRoles) * 100) : 0;

  /* =====================================================
     FILTRO
  ===================================================== */

  const rolesFiltrados = useMemo(() => {
    const termino = search.trim().toLowerCase();

    if (!termino) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.nombre?.toLowerCase().includes(termino) ||
        role.descripcion?.toLowerCase().includes(termino),
    );
  }, [roles, search]);

  /* =====================================================
     TOGGLE ESTADO
  ===================================================== */

  const handleToggle = async (role: Role) => {
    const nuevoEstado = !role.activo;

    const confirmacion = await Swal.fire({
      icon: "question",

      title: nuevoEstado ? "¿Activar rol?" : "¿Desactivar rol?",

      html: `
            <div style="text-align:left; line-height:1.7">
              <p>
                <strong>Rol:</strong>
                ${role.nombre}
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
      setProcessingId(role.id);

      await toggleRoleStatus(role.id, nuevoEstado);

      setRoles((prev) =>
        prev.map((r) =>
          r.id === role.id
            ? {
                ...r,
                activo: nuevoEstado,
              }
            : r,
        ),
      );

      await Swal.fire({
        icon: "success",

        title: nuevoEstado ? "Rol activado" : "Rol desactivado",

        text: `El rol ${role.nombre} fue ${
          nuevoEstado ? "activado" : "desactivado"
        } correctamente.`,

        timer: 1800,

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
          "Ocurrió un error al actualizar el rol.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  /* =====================================================
     EDITAR
  ===================================================== */

  const handleEdit = (role: Role) => {
    setSelectedRole(role);

    setEditOpen(true);
  };

  /* =====================================================
     ELIMINAR
  ===================================================== */

  const handleDelete = async (role: Role) => {
    const result = await Swal.fire({
      icon: "warning",

      title: "¿Eliminar rol?",

      html: `
            <div style="text-align:left; line-height:1.7">
              <p>
                <strong>Rol:</strong>
                ${role.nombre}
              </p>

              <p>
                Si el rol está asignado a usuarios,
                el sistema puede impedir su eliminación.
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
      setProcessingId(role.id);

      await deleteRole(role.id);

      setRoles((prev) => prev.filter((r) => r.id !== role.id));

      await Swal.fire({
        icon: "success",

        title: "Rol eliminado",

        text: `El rol ${role.nombre} fue eliminado correctamente.`,

        timer: 1800,

        showConfirmButton: false,

        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error("Error eliminando rol:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo eliminar",

        text:
          error?.response?.data?.message ||
          "El rol puede estar relacionado con usuarios u otros registros.",
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
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Roles</h1>

          <p className="mt-1 text-gray-500">
            Administra los perfiles de acceso y la estructura de autorización
            del sistema.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadRoles}
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
            Nuevo Rol
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
              <p className="text-sm font-medium text-gray-500">Total Roles</p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {totalRoles}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Perfiles registrados</p>
            </div>

            <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
              <UsersRound size={24} />
            </div>
          </div>
        </div>

        {/* ACTIVOS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Roles Activos</p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {rolesActivos}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Disponibles para asignación
              </p>
            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>

        {/* INACTIVOS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Roles Inactivos
              </p>

              <h2 className="mt-2 text-3xl font-bold text-red-600">
                {rolesInactivos}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Fuera de uso</p>
            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <ShieldX size={24} />
            </div>
          </div>
        </div>

        {/* DISPONIBILIDAD */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Disponibilidad
              </p>

              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {porcentajeActivos}%
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Roles actualmente activos
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <BadgeCheck size={24} />
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
            <h2 className="font-semibold text-gray-800">Directorio de Roles</h2>

            <p className="mt-1 text-sm text-gray-500">
              Consulta los roles configurados y administra su estado.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o descripción..."
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
            <h2 className="font-semibold text-gray-800">Roles Registrados</h2>

            <p className="mt-1 text-sm text-gray-500">
              {rolesFiltrados.length} resultados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw size={22} className="animate-spin" />
              Cargando roles...
            </div>
          </div>
        ) : rolesFiltrados.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <ShieldCheck size={42} className="mb-3 text-gray-300" />

            <p className="font-medium text-gray-600">No se encontraron roles</p>

            <p className="mt-1 text-sm text-gray-400">
              Intenta cambiar el criterio de búsqueda o registra un nuevo rol.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rol
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Descripción
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
                {rolesFiltrados.map((role) => {
                  const processing = processingId === role.id;

                  return (
                    <tr
                      key={role.id}
                      className="border-t transition hover:bg-gray-50"
                    >
                      {/* ROL */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            <ShieldCheck size={20} />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">
                              {role.nombre}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              ID: {role.id.slice(0, 8)}
                              ...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPCIÓN */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {role.descripcion || "Sin descripción"}
                      </td>

                      {/* ESTADO */}

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            role.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              role.activo ? "bg-green-500" : "bg-red-500"
                            }`}
                          />

                          {role.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(role)}
                            disabled={processing}
                            title="Editar rol"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggle(role)}
                            disabled={processing}
                            title={
                              role.activo ? "Desactivar rol" : "Activar rol"
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              role.activo
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
                            onClick={() => handleDelete(role)}
                            disabled={processing}
                            title="Eliminar rol"
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
          NOTA
      ================================================= */}

      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        Los roles definen perfiles de acceso dentro del ERP. Más adelante
        podremos ampliar este módulo con permisos granulares por módulo, acción
        y funcionalidad.
      </div>

      {/* =================================================
          MODALES
      ================================================= */}

      <CreateRoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadRoles}
      />

      <EditRoleModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);

          setSelectedRole(null);
        }}
        onUpdated={loadRoles}
        role={selectedRole}
      />
    </div>
  );
}

export default RolesPage;
