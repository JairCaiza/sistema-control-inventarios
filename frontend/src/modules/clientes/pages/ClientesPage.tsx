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

import {
  Plus,
  Search,
  FileDown,
  Eye,
  Edit,
  Trash2,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  IdCard,
} from "lucide-react";

import CreateClienteModal from "../components/CreateClienteModal";

interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  tipo_cliente?: string;
  tipo_identificacion?: string;
  identificacion: string;
  telefono: string;
  correo?: string;
  email?: string;
  direccion: string;
  fecha_creacion?: string;
}

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const resumen = useMemo(() => {
    const total = clientes.length;

    const personas = clientes.filter(
      (c) => c.tipo_cliente?.toLowerCase() === "persona",
    ).length;

    const empresas = clientes.filter(
      (c) => c.tipo_cliente?.toLowerCase() === "empresa",
    ).length;

    const conTelefono = clientes.filter((c) => c.telefono).length;

    return {
      total,
      personas,
      empresas,
      conTelefono,
    };
  }, [clientes]);

  const columns = useMemo<ColumnDef<Cliente>[]>(
    () => [
      {
        header: "Cliente",
        accessorKey: "nombre",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-800">
              {row.original.nombre} {row.original.apellido || ""}
            </p>
            <p className="text-xs text-gray-500">
              {row.original.tipo_cliente || "Cliente"} · ID:{" "}
              {row.original.id.slice(0, 8)}
            </p>
          </div>
        ),
      },
      {
        header: "Identificación",
        accessorKey: "identificacion",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <IdCard size={16} className="text-gray-400" />
            <div>
              <p className="font-medium">
                {row.original.identificacion || "No registrada"}
              </p>
              <p className="text-xs text-gray-500">
                {row.original.tipo_identificacion || "Documento"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Contacto",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-gray-400" />
              {row.original.telefono || "Sin teléfono"}
            </p>
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <Mail size={14} className="text-gray-400" />
              {row.original.correo || row.original.email || "Sin correo"}
            </p>
          </div>
        ),
      },
      {
        header: "Dirección",
        accessorKey: "direccion",
        cell: ({ row }) => (
          <div className="flex items-start gap-2 max-w-xs">
            <MapPin size={16} className="text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-700 line-clamp-2">
              {row.original.direccion || "No registrada"}
            </p>
          </div>
        ),
      },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex justify-center gap-3">
            <button
              className="text-cyan-600 hover:scale-110 transition"
              title="Ver cliente"
              onClick={() => console.log("Ver", row.original.id)}
            >
              <Eye size={18} />
            </button>

            <button
              className="text-blue-600 hover:scale-110 transition"
              title="Editar cliente"
              onClick={() => console.log("Editar", row.original.id)}
            >
              <Edit size={18} />
            </button>

            <button
              className="text-red-600 hover:scale-110 transition"
              title="Eliminar cliente"
              onClick={() => {
                if (confirm("¿Eliminar cliente?")) {
                  console.log("Eliminar", row.original.id);
                }
              }}
            >
              <Trash2 size={18} />
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
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-500 mt-1">
            Gestión de clientes para contratos de alquiler, servicios y obras.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition"
          >
            <Plus size={18} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total clientes</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.total}</h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Personas</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.personas}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Empresas</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.empresas}</h2>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Building2 className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Con contacto</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.conTelefono}</h2>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Phone className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTRO */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            placeholder="Buscar por nombre, identificación, teléfono o correo..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Listado de clientes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Información principal para contratos, alquileres y obras.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Cargando clientes...
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-8 text-gray-500"
                    >
                      No hay clientes registrados
                    </td>
                  </tr>
                )}

                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
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

        {/* PAGINACION */}
        <div className="flex items-center justify-between px-5 py-4 border-t">
          <p className="text-sm text-gray-500">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Anterior
            </button>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
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
