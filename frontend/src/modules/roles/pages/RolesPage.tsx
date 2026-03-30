import { useEffect, useState } from "react";
import { getRoles } from "../services/roleService";
import CreateRoleModal from "../../roles/components/CreateRoleModal";

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadRoles = async () => {
      const data = await getRoles();
      setRoles(data);
    };
    loadRoles();
  }, []);

  function loadRoles(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Roles</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
        >
          + Nuevo Rol
        </button>
      </div>

      {/* TABLA */}

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Nombre
              </th>

              <th className="text-left px-4 py-3 text-sm font-semibold">
                Descripción
              </th>

              <th className="text-left px-4 py-3 text-sm font-semibold">
                Estado
              </th>
            </tr>
          </thead>

          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-t">
                <td className="px-4 py-3">{role.nombre}</td>

                <td className="px-4 py-3">{role.descripcion}</td>

                <td className="px-4 py-3">
                  {role.activo ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded">
                      Activo
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded">
                      Inactivo
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateRoleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadRoles}
      />
    </div>
  );
}

export default RolesPage;
