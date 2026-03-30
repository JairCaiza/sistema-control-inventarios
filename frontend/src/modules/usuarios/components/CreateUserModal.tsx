import { useEffect, useState } from "react";
import { createUser } from "../services/userService";
import { getRoles } from "../../roles/services/roleService";
import axios from "axios";
import Swal from "sweetalert2";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

function CreateUserModal({ open, onClose, onCreated }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    rol_id: "",
  });

  /* CARGAR ROLES */

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await getRoles();
        setRoles(data);
      } catch (error) {
        console.error("Error cargando roles", error);
      }
    };

    loadRoles();
  }, []);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.rol_id) {
      alert("Seleccione un rol");
      return;
    }

    try {
      console.log("DATA ENVIADA:", form);

      await createUser(form);
      Swal.fire({
        icon: "success",
        title: "Usuario creado",
        text: "El usuario se registró correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      onCreated();
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message ?? "";

        let message = "Error al crear usuario";

        if (backendMessage.includes("usuarios_correo_key")) {
          message = "El correo ya está registrado";
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: message,
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Error inesperado",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4">Nuevo Usuario</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="nombre"
            placeholder="Nombre"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="apellido"
            placeholder="Apellido"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="correo"
            placeholder="Correo"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="contrasena"
            type="password"
            placeholder="Contraseña"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* SELECT DINÁMICO */}

          <select
            name="rol_id"
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;
