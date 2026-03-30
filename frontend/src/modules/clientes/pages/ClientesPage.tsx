import { useEffect, useMemo, useState } from "react";
import { getClientes } from "../service/clienteService";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { ColumnDef } from "@tanstack/react-table";

import CreateClienteModal from "../components/CreateClienteModal";

interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  telefono: string;
  email: string;
  direccion: string;
}

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const loadClientes = async () => {
    const data = await getClientes();
    setClientes(data);
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const columns = useMemo<ColumnDef<Cliente>[]>(
    () => [
      {
        header: "Nombre",
        accessorKey: "nombre",
      },
      {
        header: "Identificación",
        accessorKey: "identificacion",
      },
      {
        header: "Teléfono",
        accessorKey: "telefono",
      },
      {
        header: "Email",
        accessorKey: "email",
      },

      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-3 text-sm">
            <button className="text-blue-600">Ver</button>

            <button className="text-orange-600">Editar</button>

            <button
              className="text-red-600"
              onClick={() => {
                if (confirm("¿Eliminar cliente?")) {
                  console.log("Eliminar", row.original.id);
                }
              }}
            >
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: clientes,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nuevo Cliente
        </button>
      </div>

      <input
        placeholder="Buscar cliente..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="border p-2 rounded w-80"
      />

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

      <CreateClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadClientes}
      />
    </div>
  );
}

export default ClientesPage;
