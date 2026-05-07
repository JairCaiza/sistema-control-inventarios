import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { updateRole } from "../services/roleService";

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  role: Role | null;
}

function EditRoleModal({ open, onClose, onUpdated, role }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
  });

  /* 🔥 CARGAR DATOS DEL ROL */
  useEffect(() => {
    if (role) {
      setForm({
        nombre: role.nombre,
        descripcion: role.descripcion,
      });
    }
  }, [role]);

  if (!open || !role) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateRole(role.id, form);

      Swal.fire({
        icon: "success",
        title: "Rol actualizado",
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
          text: error.response?.data?.message ?? "Error al actualizar rol",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[400px] rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Editar Rol</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre del rol"
            className="w-full border p-2 rounded"
          />

          <input
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Descripción"
            className="w-full border p-2 rounded"
          />

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
              Actualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditRoleModal;
