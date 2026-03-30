import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContratos } from "../service/contratoService";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { ColumnDef } from "@tanstack/react-table";

import CreateContratoModal from "../components/CreateContratoModal";

interface Contrato {
  id: string;
  cliente: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadContratos = async () => {
    const data = await getContratos();
    setContratos(data);
  };

  useEffect(() => {
    loadContratos();
  }, []);

  const columns = useMemo<ColumnDef<Contrato>[]>(
    () => [
      {
        header: "Cliente",
        accessorKey: "cliente",
      },

      {
        header: "Fecha Inicio",
        accessorKey: "fecha_inicio",
      },

      {
        header: "Fecha Fin",
        accessorKey: "fecha_fin",
      },

      {
        header: "Estado",
        accessorKey: "estado",
      },

      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-3 text-sm">
            <button
              className="text-blue-600"
              onClick={() =>
                navigate(`/dashboard/contratos/${row.original.id}`)
              }
            >
              Ver
            </button>

            <button className="text-orange-600">Editar</button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: contratos,
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
        <h1 className="text-2xl font-bold">Contratos</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nuevo Contrato
        </button>
      </div>

      <input
        placeholder="Buscar contrato..."
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

      <CreateContratoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadContratos}
      />
    </div>
  );
}

export default ContratosPage;
