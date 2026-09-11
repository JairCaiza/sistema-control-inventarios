import { useEffect, useMemo, useState } from "react";

import { getUsers, toggleUserStatus } from "../services/userService";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { ColumnDef } from "@tanstack/react-table";

import {
  UserPlus,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  BadgeCheck,
  Edit3,
  Power,
} from "lucide-react";

import Swal from "sweetalert2";

import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";

/* =====================================================
   TIPOS
===================================================== */

interface User {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  rol_id: string;
  activo: boolean;
}

/* =====================================================
   COMPONENTE
===================================================== */

function UsersPage() {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [users, setUsers] = useState<User[]>([]);

  const [globalFilter, setGlobalFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);

  /* =====================================================
     CARGAR USUARIOS
  ===================================================== */

  const loadUsers = async () => {
    try {
      setLoading(true);

      const data = await getUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudieron cargar los usuarios",
        text: "Ocurrió un error al consultar los usuarios del sistema.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* =====================================================
     KPIs
  ===================================================== */

  const totalUsuarios = users.length;

  const usuariosActivos = users.filter((user) => user.activo).length;

  const usuariosInactivos = users.filter((user) => !user.activo).length;

  const totalRoles = new Set(users.map((user) => user.rol).filter(Boolean))
    .size;

  /* =====================================================
     CAMBIAR ESTADO
  ===================================================== */

  const handleToggleStatus = async (user: User) => {
    const nuevoEstado = !user.activo;

    const confirmacion = await Swal.fire({
      icon: "question",

      title: nuevoEstado ? "¿Activar usuario?" : "¿Desactivar usuario?",

      html: `
            <div style="text-align:left; line-height:1.7">
              <p>
                <strong>Usuario:</strong>
                ${user.nombre} ${user.apellido}
              </p>

              <p>
                <strong>Correo:</strong>
                ${user.correo}
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
      setProcessingId(user.id);

      await toggleUserStatus(user.id, nuevoEstado);

      await loadUsers();

      await Swal.fire({
        icon: "success",

        title: nuevoEstado ? "Usuario activado" : "Usuario desactivado",

        text: `El usuario ${user.nombre} ${user.apellido} fue ${
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
          "Ocurrió un error al actualizar el usuario.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  /* =====================================================
     COLUMNAS
  ===================================================== */

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: "Usuario",

        accessorFn: (row) => `${row.nombre} ${row.apellido}`,

        cell: ({ row }) => {
          const user = row.original;

          const iniciales =
            `${user.nombre?.[0] || ""}${user.apellido?.[0] || ""}`.toUpperCase();

          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 font-semibold text-[var(--color-primary)]">
                {iniciales}
              </div>

              <div>
                <p className="font-semibold text-gray-800">
                  {user.nombre} {user.apellido}
                </p>

                <p className="text-xs text-gray-400">
                  ID: {user.id.slice(0, 8)}
                  ...
                </p>
              </div>
            </div>
          );
        },
      },

      {
        header: "Correo",

        accessorKey: "correo",

        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail size={16} className="text-gray-400" />

            <span>{row.original.correo}</span>
          </div>
        ),
      },

      {
        header: "Rol",

        accessorKey: "rol",

        cell: ({ row }) => (
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            <ShieldCheck size={15} />

            {row.original.rol}
          </div>
        ),
      },

      {
        header: "Estado",

        accessorFn: (row) => (row.activo ? "Activo" : "Inactivo"),

        cell: ({ row }) => (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              row.original.activo
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                row.original.activo ? "bg-green-500" : "bg-red-500"
              }`}
            />

            {row.original.activo ? "Activo" : "Inactivo"}
          </span>
        ),
      },

      {
        id: "acciones",

        header: "Acciones",

        enableSorting: false,

        cell: ({ row }) => {
          const user = row.original;

          const processing = processingId === user.id;

          return (
            <div className="flex items-center justify-center gap-2">
              {/* EDITAR */}

              <button
                type="button"
                onClick={() => {
                  setSelectedUser(user);

                  setEditOpen(true);
                }}
                disabled={processing}
                title="Editar usuario"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Edit3 size={16} />
              </button>

              {/* ACTIVAR / DESACTIVAR */}

              <button
                type="button"
                onClick={() => handleToggleStatus(user)}
                disabled={processing}
                title={user.activo ? "Desactivar usuario" : "Activar usuario"}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  user.activo
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-green-200 text-green-600 hover:bg-green-50"
                }`}
              >
                {processing ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Power size={16} />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [processingId],
  );

  /* =====================================================
     TABLA
  ===================================================== */

  const table = useReactTable({
    data: users,

    columns,

    state: {
      globalFilter,
    },

    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),

    getSortedRowModel: getSortedRowModel(),

    getFilteredRowModel: getFilteredRowModel(),

    getPaginationRowModel: getPaginationRowModel(),

    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

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
            Gestión de Usuarios
          </h1>

          <p className="mt-1 text-gray-500">
            Administra los usuarios, roles y acceso al sistema ConstructSys.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadUsers}
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
            <UserPlus size={18} />
            Nuevo Usuario
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
                Total Usuarios
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {totalUsuarios}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Usuarios registrados</p>
            </div>

            <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* ACTIVOS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Usuarios Activos
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {usuariosActivos}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Con acceso al sistema
              </p>
            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <UserCheck size={24} />
            </div>
          </div>
        </div>

        {/* INACTIVOS */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Usuarios Inactivos
              </p>

              <h2 className="mt-2 text-3xl font-bold text-red-600">
                {usuariosInactivos}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Acceso suspendido</p>
            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <UserX size={24} />
            </div>
          </div>
        </div>

        {/* ROLES */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Roles Asignados
              </p>

              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {totalRoles}
              </h2>

              <p className="mt-1 text-xs text-gray-400">Perfiles de acceso</p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <BadgeCheck size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          BARRA DE BÚSQUEDA
      ================================================= */}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">
              Directorio de Usuarios
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Busca por nombre, correo, rol o estado.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Buscar usuario..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
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
              Usuarios Registrados
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {table.getFilteredRowModel().rows.length} resultados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw size={22} className="animate-spin" />
              Cargando usuarios...
            </div>
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <Users size={42} className="mb-3 text-gray-300" />

            <p className="font-medium text-gray-600">
              No se encontraron usuarios
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Intenta cambiar el criterio de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortable = header.column.getCanSort();

                      const sorting = header.column.getIsSorted();

                      return (
                        <th
                          key={header.id}
                          onClick={
                            sortable
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                          className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                            sortable
                              ? "cursor-pointer select-none hover:text-gray-700"
                              : ""
                          } ${header.id === "acciones" ? "text-center" : ""}`}
                        >
                          <div
                            className={`flex items-center gap-2 ${
                              header.id === "acciones" ? "justify-center" : ""
                            }`}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}

                            {sorting === "asc" && "↑"}

                            {sorting === "desc" && "↓"}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`px-5 py-4 text-sm ${
                          cell.column.id === "acciones" ? "text-center" : ""
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =================================================
            PAGINACIÓN
        ================================================= */}

        <div className="flex flex-col gap-3 border-t bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            Página{" "}
            <span className="font-semibold text-gray-700">
              {table.getState().pagination.pageIndex + 1}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-gray-700">
              {Math.max(table.getPageCount(), 1)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          INFORMACIÓN
      ================================================= */}

      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        Los usuarios inactivos conservan su información y rol asignado, pero no
        deberían poder acceder al sistema mientras permanezcan desactivados.
      </div>

      {/* =================================================
          MODALES
      ================================================= */}

      <CreateUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadUsers}
      />

      <EditUserModal
        key={selectedUser?.id}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);

          setSelectedUser(null);
        }}
        onUpdated={loadUsers}
        user={selectedUser}
      />
    </div>
  );
}

export default UsersPage;
