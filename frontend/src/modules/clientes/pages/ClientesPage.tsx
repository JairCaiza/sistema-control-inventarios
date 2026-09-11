import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import {
  getClientes,
  deleteCliente,
  type Cliente,
} from "../service/clienteService";

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
  Pencil,
  Trash2,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  IdCard,
  RefreshCw,
} from "lucide-react";

import CreateClienteModal from "../components/CreateClienteModal";

import EditClienteModal from "../components/EditClienteModal";

/* =====================================================
   COMPONENTE
===================================================== */

function ClientesPage() {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [globalFilter, setGlobalFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const [loading, setLoading] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* =====================================================
     CARGAR CLIENTES
  ===================================================== */

  const loadClientes = async () => {
    try {
      setLoading(true);

      const data = await getClientes();

      setClientes(data);
    } catch (error: any) {
      console.error("Error cargando clientes:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudieron cargar los clientes",

        text:
          error?.response?.data?.message ||
          "Ocurrió un error al consultar los clientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  /* =====================================================
     RESUMEN
  ===================================================== */

  const resumen = useMemo(() => {
    const total = clientes.length;

    const personas = clientes.filter(
      (cliente) => cliente.tipo_cliente === "persona",
    ).length;

    const empresas = clientes.filter(
      (cliente) => cliente.tipo_cliente === "empresa",
    ).length;

    const conContacto = clientes.filter((cliente) =>
      Boolean(cliente.telefono || cliente.correo),
    ).length;

    return {
      total,
      personas,
      empresas,
      conContacto,
    };
  }, [clientes]);

  /* =====================================================
     EDITAR
  ===================================================== */

  const handleEditar = (cliente: Cliente) => {
    setSelectedCliente(cliente);

    setEditOpen(true);
  };

  /* =====================================================
     VER
  ===================================================== */

  const handleVer = async (cliente: Cliente) => {
    await Swal.fire({
      title:
        cliente.tipo_cliente === "empresa"
          ? cliente.nombre
          : `${cliente.nombre} ${cliente.apellido || ""}`,

      html: `
        <div style="text-align:left; line-height:1.8">

          <p>
            <strong>Tipo:</strong>
            ${cliente.tipo_cliente === "empresa" ? "Empresa" : "Persona"}
          </p>

          <p>
            <strong>Documento:</strong>
            ${cliente.tipo_identificacion.toUpperCase()}
            -
            ${cliente.identificacion}
          </p>

          <p>
            <strong>Teléfono:</strong>
            ${cliente.telefono || "No registrado"}
          </p>

          <p>
            <strong>Correo:</strong>
            ${cliente.correo || "No registrado"}
          </p>

          <p>
            <strong>Dirección:</strong>
            ${cliente.direccion || "No registrada"}
          </p>

        </div>
      `,

      confirmButtonText: "Cerrar",
    });
  };

  /* =====================================================
     ELIMINAR
  ===================================================== */

  const handleEliminar = async (cliente: Cliente) => {
    const nombreCompleto =
      cliente.tipo_cliente === "empresa"
        ? cliente.nombre
        : `${cliente.nombre} ${cliente.apellido || ""}`.trim();

    const resultado = await Swal.fire({
      icon: "warning",

      title: "¿Eliminar cliente?",

      html: `
            <div style="text-align:left; line-height:1.7">

              <p>
                <strong>Cliente:</strong>
                ${nombreCompleto}
              </p>

              <p>
                <strong>Identificación:</strong>
                ${cliente.identificacion}
              </p>

              <p style="margin-top:12px;">
                El cliente solo podrá eliminarse
                si no tiene contratos, obras u
                otras operaciones relacionadas.
              </p>

            </div>
          `,

      showCancelButton: true,

      confirmButtonText: "Sí, eliminar",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      setDeletingId(cliente.id);

      await deleteCliente(cliente.id);

      setClientes((prev) => prev.filter((item) => item.id !== cliente.id));

      await Swal.fire({
        icon: "success",

        title: "Cliente eliminado",

        text: "El cliente fue eliminado correctamente.",

        timer: 1700,

        showConfirmButton: false,

        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error("Error eliminando cliente:", error);

      await Swal.fire({
        icon: "error",

        title: "No se pudo eliminar",

        text:
          error?.response?.data?.message ||
          "El cliente tiene operaciones relacionadas y no puede eliminarse.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  /* =====================================================
     COLUMNAS
  ===================================================== */

  const columns = useMemo<ColumnDef<Cliente>[]>(
    () => [
      /* CLIENTE */

      {
        header: "Cliente",

        accessorKey: "nombre",

        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-800">
              {row.original.nombre} {row.original.apellido || ""}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {row.original.tipo_cliente === "empresa" ? "Empresa" : "Persona"}{" "}
              · ID: {row.original.id.slice(0, 8)}
            </p>
          </div>
        ),
      },

      /* IDENTIFICACIÓN */

      {
        header: "Identificación",

        accessorKey: "identificacion",

        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <IdCard size={16} className="text-gray-400" />

            <div>
              <p className="font-medium text-gray-800">
                {row.original.identificacion}
              </p>

              <p className="text-xs uppercase text-gray-500">
                {row.original.tipo_identificacion}
              </p>
            </div>
          </div>
        ),
      },

      /* CONTACTO */

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

              {row.original.correo || "Sin correo"}
            </p>
          </div>
        ),
      },

      /* DIRECCIÓN */

      {
        header: "Dirección",

        accessorKey: "direccion",

        cell: ({ row }) => (
          <div className="flex max-w-xs items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />

            <p className="line-clamp-2 text-sm text-gray-700">
              {row.original.direccion || "No registrada"}
            </p>
          </div>
        ),
      },

      /* ACCIONES */

      {
        header: "Acciones",

        cell: ({ row }) => {
          const cliente = row.original;

          const deleting = deletingId === cliente.id;

          return (
            <div className="flex justify-center gap-2">
              {/* VER */}

              <button
                type="button"
                title="Ver cliente"
                onClick={() => handleVer(cliente)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-200 text-cyan-600 transition hover:bg-cyan-50"
              >
                <Eye size={17} />
              </button>

              {/* EDITAR */}

              <button
                type="button"
                title="Editar cliente"
                onClick={() => handleEditar(cliente)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50"
              >
                <Pencil size={17} />
              </button>

              {/* ELIMINAR */}

              <button
                type="button"
                title="Eliminar cliente"
                disabled={deleting}
                onClick={() => handleEliminar(cliente)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
              >
                {deleting ? (
                  <RefreshCw size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [deletingId],
  );

  /* =====================================================
     TABLE
  ===================================================== */

  const table = useReactTable({
    data: clientes,

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
        pageSize: 10,
      },
    },
  });

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>

          <p className="mt-1 text-gray-500">
            Gestión de clientes para contratos de alquiler, servicios y obras.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition hover:opacity-90"
          >
            <Plus size={18} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* KPIs */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total clientes</p>

              <h2 className="mt-2 text-3xl font-bold">{resumen.total}</h2>
            </div>

            <div className="rounded-full bg-blue-100 p-3">
              <Users className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Personas</p>

              <h2 className="mt-2 text-3xl font-bold">{resumen.personas}</h2>
            </div>

            <div className="rounded-full bg-green-100 p-3">
              <Users className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Empresas</p>

              <h2 className="mt-2 text-3xl font-bold">{resumen.empresas}</h2>
            </div>

            <div className="rounded-full bg-purple-100 p-3">
              <Building2 className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Con contacto</p>

              <h2 className="mt-2 text-3xl font-bold">{resumen.conContacto}</h2>
            </div>

            <div className="rounded-full bg-yellow-100 p-3">
              <Phone className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}

      <div className="rounded-xl border bg-white p-5 shadow">
        <div className="relative max-w-xl">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            placeholder="Buscar por nombre, identificación, teléfono o correo..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* TABLA */}

      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="border-b p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Listado de clientes
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Información principal para contratos, alquileres y obras.
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {clientes.length} registros
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
            <RefreshCw size={20} className="animate-spin" />
            Cargando clientes...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer px-4 py-3 text-left text-sm font-semibold text-gray-600"
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
                      className="py-10 text-center text-gray-500"
                    >
                      No hay clientes registrados
                    </td>
                  </tr>
                )}

                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t transition hover:bg-gray-50"
                  >
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

        {/* PAGINACIÓN */}

        <div className="flex items-center justify-between border-t px-5 py-4">
          <p className="text-sm text-gray-500">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded border px-3 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded border px-3 py-1.5 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* CREAR */}

      <CreateClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadClientes}
      />

      {/* EDITAR */}

      <EditClienteModal
        open={editOpen}
        cliente={selectedCliente}
        onClose={() => {
          setEditOpen(false);

          setSelectedCliente(null);
        }}
        onUpdated={loadClientes}
      />
    </div>
  );
}

export default ClientesPage;
