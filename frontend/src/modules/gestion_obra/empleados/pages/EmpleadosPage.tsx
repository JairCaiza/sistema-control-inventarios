import { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";

import {
  getEmpleados,
  toggleEmpleadoStatus,
  deleteEmpleado,
} from "../services/empleadosService";

import CreateEmpleadoModal from "../components/CreateEmpleadoModal";
import EditEmpleadoModal from "../components/EditEmpleadoModal";

import Swal from "sweetalert2";

import { FaEdit, FaTrash } from "react-icons/fa";

interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono?: string;
  correo?: string;
  cargo?: string;
  tipo_pago: "diario" | "semanal" | "mensual";
  salario_base?: number;
  activo: boolean;
}

function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(
    null,
  );

  /* =========================
     CARGAR EMPLEADOS
  ========================= */
  const loadEmpleados = async () => {
    try {
      setLoading(true);

      const data = await getEmpleados();

      setEmpleados(data);
    } catch (error) {
      console.error("Error cargando empleados", error);

      Swal.fire("Error", "No se pudieron cargar los empleados", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpleados();
  }, []);

  /* =========================
     TOGGLE ESTADO
  ========================= */
  const handleToggle = async (empleado: Empleado) => {
    try {
      const nuevoEstado = !empleado.activo;

      await toggleEmpleadoStatus(empleado.id, nuevoEstado);

      setEmpleados((prev) =>
        prev.map((e) =>
          e.id === empleado.id ? { ...e, activo: nuevoEstado } : e,
        ),
      );

      Swal.fire({
        icon: "success",
        title: nuevoEstado ? "Empleado activado" : "Empleado desactivado",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire("Error", "No se pudo cambiar el estado", "error");
    }
  };

  /* =========================
     ELIMINAR
  ========================= */
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar empleado?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteEmpleado(id);

        setEmpleados((prev) => prev.filter((e) => e.id !== id));

        Swal.fire({
          icon: "success",
          title: "Empleado eliminado",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error: any) {
        Swal.fire(
          "Error",
          error.response?.data?.message || "No se pudo eliminar",
          "error",
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================= HEADER ========================= */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Empleados</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90"
        >
          + Nuevo Empleado
        </button>
      </div>

      {/* ========================= LOADING ========================= */}
      {loading && (
        <div className="text-center py-10 text-gray-500">
          Cargando empleados...
        </div>
      )}

      {/* ========================= TABLA ========================= */}
      {!loading && (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Cédula
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Nombre Completo
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Cargo
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Tipo Pago
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Teléfono
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Estado
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {empleados.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No hay empleados registrados
                  </td>
                </tr>
              )}

              {empleados.map((empleado) => (
                <tr
                  key={empleado.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">{empleado.cedula}</td>

                  <td className="px-4 py-3">
                    {empleado.nombres} {empleado.apellidos}
                  </td>

                  <td className="px-4 py-3">{empleado.cargo || "-"}</td>

                  <td className="px-4 py-3 capitalize">{empleado.tipo_pago}</td>

                  <td className="px-4 py-3">{empleado.telefono || "-"}</td>

                  {/* ESTADO */}
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        empleado.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {empleado.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      {/* VER DETALLE */}
                      <Link
                        to={`/dashboard/empleados/${empleado.id}`}
                        className="text-cyan-600 hover:scale-110 transition"
                        title="Ver detalle"
                      >
                        <FaEye />
                      </Link>
                      {/* EDITAR */}
                      <button
                        title="Editar"
                        className="text-blue-600 hover:scale-110 transition"
                        onClick={() => {
                          setSelectedEmpleado(empleado);
                          setEditOpen(true);
                        }}
                      >
                        <FaEdit />
                      </button>

                      {/* SWITCH */}
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={empleado.activo}
                          onChange={() => handleToggle(empleado)}
                          className="sr-only peer"
                        />

                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 relative transition">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                        </div>
                      </label>

                      {/* ELIMINAR */}
                      <button
                        title="Eliminar"
                        onClick={() => handleDelete(empleado.id)}
                        className="text-red-600 hover:scale-110 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================= MODALES ========================= */}

      <CreateEmpleadoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadEmpleados}
      />

      <EditEmpleadoModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadEmpleados}
        empleado={selectedEmpleado}
      />
    </div>
  );
}

export default EmpleadosPage;
