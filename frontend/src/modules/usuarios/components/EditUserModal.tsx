import { useEffect, useState } from "react";
import { updateUser } from "../services/userService";
import { getRoles } from "../../roles/services/roleService";
import Swal from "sweetalert2";
import axios from "axios";

interface User {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  rol_id: string;
  activo: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  user: User | null;
}

interface Role {
  id: number;
  nombre: string;
}

function EditUserModal({ open, onClose, onUpdated, user }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);

  const [form, setForm] = useState<{
    nombre: string;
    apellido: string;
    correo: string;
    rol_id: string;
  }>({
    nombre: "",
    apellido: "",
    correo: "",
    rol_id: "",
  });

  // 🔍 DEBUG INICIAL
  console.log("USER RECIBIDO:", user);

  // Cargar roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await getRoles();
        console.log("ROLES:", data); // 🔍 DEBUG
        setRoles(data);
      } catch (error) {
        console.error("Error cargando roles", error);
      }
    };

    loadRoles();
  }, []);

  // ✅ FIX: sincronizar form con user
  useEffect(() => {
    if (user && open) {
      const newForm = {
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        correo: user.correo || "",
        rol_id: user.rol_id || "",
      };

      console.log("SET FORM:", newForm); // 🔍 DEBUG

      setForm(newForm);
    }
  }, [user, open]);

  if (!open || !user) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value, // ✅ TODO string
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("DATA ENVIADA:", form); // 🔍 DEBUG

    try {
      await updateUser(user.id, form);

      Swal.fire({
        icon: "success",
        title: "Actualizado",
        text: "Usuario actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      onUpdated();
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Error al actualizar",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error inesperado",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre"
            className="w-full border p-2 rounded"
          />

          <input
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            placeholder="Apellido"
            className="w-full border p-2 rounded"
          />

          <input
            name="correo"
            value={form.correo}
            onChange={handleChange}
            placeholder="Correo"
            className="w-full border p-2 rounded"
          />

          <select
            name="rol_id"
            value={form.rol_id || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Seleccione rol</option>

            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.nombre}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
