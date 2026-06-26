import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  FileText,
  CalendarDays,
  DollarSign,
  Users,
  ClipboardList,
} from "lucide-react";

import { getContratos } from "../service/contratoService";
import CreateContratoModal from "../components/CreateContratoModal";

interface Contrato {
  id: string;
  numero_contrato?: string;
  cliente: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  total?: number;
  fecha_creacion?: string;
}

function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const loadContratos = async () => {
    try {
      setLoading(true);
      const data = await getContratos();
      setContratos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContratos();
  }, []);

  const resumen = useMemo(() => {
    const totalContratos = contratos.length;

    const activos = contratos.filter((c) => c.estado === "activo").length;
    const finalizados = contratos.filter(
      (c) => c.estado === "finalizado",
    ).length;

    const totalFacturado = contratos.reduce(
      (acc, c) => acc + Number(c.total || 0),
      0,
    );

    return {
      totalContratos,
      activos,
      finalizados,
      totalFacturado,
    };
  }, [contratos]);

  const getEstadoClass = (estado: string) => {
    if (estado === "activo") return "bg-green-100 text-green-700";
    if (estado === "finalizado") return "bg-blue-100 text-blue-700";
    if (estado === "cancelado") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const columns = useMemo<ColumnDef<Contrato>[]>(
    () => [
      {
        header: "Contrato",
        accessorKey: "numero_contrato",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-800">
              {row.original.numero_contrato || "Sin número"}
            </p>
            <p className="text-xs text-gray-500">
              ID: {row.original.id.slice(0, 8)}
            </p>
          </div>
        ),
      },
      {
        header: "Cliente",
        accessorKey: "cliente",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-700">{row.original.cliente}</p>
            <p className="text-xs text-gray-500">Cliente del alquiler</p>
          </div>
        ),
      },
      {
        header: "Periodo",
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <CalendarDays size={14} className="text-gray-400" />
              {row.original.fecha_inicio?.split("T")[0]}
            </div>
            <p className="text-xs text-gray-500">
              hasta {row.original.fecha_fin?.split("T")[0]}
            </p>
          </div>
        ),
      },
      {
        header: "Total",
        accessorKey: "total",
        cell: ({ row }) => (
          <span className="font-bold text-green-600">
            ${Number(row.original.total || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Estado",
        accessorKey: "estado",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getEstadoClass(
              row.original.estado,
            )}`}
          >
            {row.original.estado}
          </span>
        ),
      },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex justify-center gap-3">
            <button
              className="text-cyan-600 hover:scale-110 transition"
              title="Ver detalle"
              onClick={() =>
                navigate(`/dashboard/contratos/${row.original.id}`)
              }
            >
              <Eye size={18} />
            </button>

            <button
              className="text-blue-600 hover:scale-110 transition"
              title="Editar"
            >
              <Edit size={18} />
            </button>

            <button
              className="text-red-600 hover:scale-110 transition"
              title="PDF contrato"
            >
              <FileText size={18} />
            </button>
          </div>
        ),
      },
    ],
    [navigate],
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
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Contratos de Alquiler
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de contratos, activos alquilados, cobros y estado del
            alquiler.
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
            Nuevo Contrato
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total contratos</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.totalContratos}
              </h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ClipboardList className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Contratos activos</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.activos}</h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Finalizados</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.finalizados}</h2>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FileText className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Valor contratado</p>
              <h2 className="text-3xl font-bold mt-2">
                ${resumen.totalFacturado.toLocaleString()}
              </h2>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <DollarSign className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTRO */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            placeholder="Buscar por cliente, contrato o estado..."
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
            Listado de contratos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Desde aquí puedes abrir el detalle para agregar activos, registrar
            devolución o cobrar pagos.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Cargando contratos...
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
                      No hay contratos registrados
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

      <CreateContratoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadContratos}
      />
    </div>
  );
}

export default ContratosPage;
