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

import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";

interface User {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  rol_id: string;
  activo: boolean;
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: "Nombre",
        accessorFn: (row) => `${row.nombre} ${row.apellido}`,
      },
      {
        header: "Correo",
        accessorKey: "correo",
      },
      {
        header: "Rol",
        accessorKey: "rol",
      },
      {
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 text-xs rounded ${
              row.original.activo
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {row.original.activo ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-4">
            {/* EDITAR */}
            <button
              className="text-blue-600"
              onClick={() => {
                setSelectedUser(row.original);
                setEditOpen(true);
              }}
            >
              Editar
            </button>

            {/* SWITCH ACTIVAR/DESACTIVAR */}
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={row.original.activo}
                onChange={async () => {
                  try {
                    const nuevoEstado = !row.original.activo;

                    console.log("CLICK SWITCH USER:", row.original);
                    console.log(
                      nuevoEstado ? "ACTIVANDO..." : "DESACTIVANDO...",
                    );

                    const res = await toggleUserStatus(
                      row.original.id,
                      nuevoEstado,
                    );

                    console.log("RESPUESTA:", res);

                    await loadUsers();
                  } catch (error: any) {
                    console.error("ERROR COMPLETO:", error);

                    if (error.response) {
                      console.error("STATUS:", error.response.status);
                      console.error("DATA:", error.response.data);
                    }
                  }
                }}
                className="sr-only peer"
              />

              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 relative transition">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>
        ),
      },
    ],
    [],
  );

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
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Usuarios</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        placeholder="Buscar usuario..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="border p-2 rounded w-80"
      />

      {/* TABLA */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex gap-2">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="border px-3 py-1 rounded"
        >
          Prev
        </button>

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="border px-3 py-1 rounded"
        >
          Next
        </button>
      </div>

      {/* MODALES */}
      <CreateUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadUsers}
      />

      <EditUserModal
        key={selectedUser?.id}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadUsers}
        user={selectedUser}
      />
    </div>
  );
}

export default UsersPage;
