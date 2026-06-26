import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { createActivo } from "../../activos/service/activoService";

import type { Categoria } from "../../categorias/services/categoriaService";

import { getCategorias } from "../../categorias/services/categoriaService";

import type { Ubicacion } from "../../ubicaciones/services/ubicacionService";

import { getUbicaciones } from "../../ubicaciones/services/ubicacionService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateActivoModal({ open, onClose, onCreated }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    categoria_id: "",
    ubicacion_id: "",
    estado: "disponible",
    tipo_control: "cantidad",
    cantidad_total: 0,
    valor_reposicion: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, ubis] = await Promise.all([
          getCategorias(),
          getUbicaciones(),
        ]);

        setCategorias(cats);
        setUbicaciones(ubis);
      } catch (error) {
        console.error(error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

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

    try {
      await createActivo({
        ...form,
        cantidad_total: Number(form.cantidad_total),
        valor_reposicion: Number(form.valor_reposicion),
      });

      Swal.fire({
        icon: "success",
        title: "Activo creado",
        timer: 2000,
        showConfirmButton: false,
      });

      onCreated();
      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Error al crear activo",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Nuevo Activo</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="nombre"
            placeholder="Nombre"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="descripcion"
            placeholder="Descripción"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <select
            name="categoria_id"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Seleccionar categoría</option>

            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            name="ubicacion_id"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Seleccionar ubicación</option>

            {ubicaciones.map((ubi) => (
              <option key={ubi.id} value={ubi.id}>
                {ubi.nombre}
              </option>
            ))}
          </select>

          <select
            name="estado"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="disponible">Disponible</option>

            <option value="alquilado">Alquilado</option>

            <option value="mantenimiento">Mantenimiento</option>

            <option value="danado">Dañado</option>

            <option value="perdido">Perdido</option>
          </select>

          <select
            name="tipo_control"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="cantidad">Cantidad</option>

            <option value="unidad">Unidad</option>
          </select>

          <input
            type="number"
            name="cantidad_total"
            placeholder="Cantidad"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            name="valor_reposicion"
            placeholder="Valor reposición"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <div className="flex justify-end gap-2">
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

export default CreateActivoModal;
