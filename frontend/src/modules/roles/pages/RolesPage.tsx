import { useEffect, useState } from "react";
import {
  getRoles,
  toggleRoleStatus,
  deleteRole,
} from "../services/roleService";

import CreateRoleModal from "../components/CreateRoleModal";
import EditRoleModal from "../components/EditRoleModal";

import Swal from "sweetalert2";
import { FaEdit, FaTrash } from "react-icons/fa";

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  /* =========================
     CARGAR ROLES
  ========================= */
  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      console.error("Error cargando roles", error);

      Swal.fire("Error", "No se pudieron cargar los roles", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  /* =========================
     TOGGLE ESTADO
  ========================= */
  const handleToggle = async (role: Role) => {
    try {
      const nuevoEstado = !role.activo;
      console.log("ENVIANDO:", { activo: nuevoEstado });
      await toggleRoleStatus(role.id, nuevoEstado);

      setRoles((prev) =>
        prev.map((r) => (r.id === role.id ? { ...r, activo: nuevoEstado } : r)),
      );

      Swal.fire({
        icon: "success",
        title: nuevoEstado ? "Rol activado" : "Rol desactivado",
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
      title: "¿Eliminar rol?",
      text: "Si está en uso no podrás eliminarlo",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteRole(id);

        setRoles((prev) => prev.filter((r) => r.id !== id));

        Swal.fire({
          icon: "success",
          title: "Rol eliminado",
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
        <h1 className="text-2xl font-bold">Roles</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90"
        >
          + Nuevo Rol
        </button>
      </div>

      {/* ========================= LOADING ========================= */}
      {loading && (
        <div className="text-center py-10 text-gray-500">Cargando roles...</div>
      )}

      {/* ========================= TABLA ========================= */}
      {!loading && (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Nombre
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-left">
                  Descripción
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
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No hay roles registrados
                  </td>
                </tr>
              )}

              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">{role.nombre}</td>

                  <td className="px-4 py-3">{role.descripcion}</td>

                  {/* ESTADO */}
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        role.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {role.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      {/* EDITAR */}
                      <button
                        title="Editar"
                        className="text-blue-600 hover:scale-110 transition"
                        onClick={() => {
                          setSelectedRole(role);
                          setEditOpen(true);
                        }}
                      >
                        <FaEdit />
                      </button>

                      {/* SWITCH */}
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={role.activo}
                          onChange={() => handleToggle(role)}
                          className="sr-only peer"
                        />

                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 relative transition">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                        </div>
                      </label>

                      {/* ELIMINAR */}
                      <button
                        title="Eliminar"
                        onClick={() => handleDelete(role.id)}
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
      <CreateRoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadRoles}
      />

      <EditRoleModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadRoles}
        role={selectedRole}
      />
    </div>
  );
}

export default RolesPage;
