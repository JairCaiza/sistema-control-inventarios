import { useEffect, useState } from "react";
import { agregarActivoContrato } from "../service/contratoService";
import { getActivos } from "../../inventario/activos/service/activoService";
import Swal from "sweetalert2";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
  contratoId: string;
  onAgregado: () => void;
}

interface Activo {
  id: string;
  nombre: string;
  cantidad_total: number;
}

function AddActivoContratoModal({
  open,
  onClose,
  contratoId,
  onAgregado,
}: Props) {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [form, setForm] = useState({
    activo_id: "",
    cantidad: 1,
    precio_dia: 0,
  });

  useEffect(() => {
    const loadActivos = async () => {
      const dataFromService = await getActivos();

      // Mapear para agregar cantidad_total (si viene de otra propiedad o por defecto 0)
      const data: Activo[] = dataFromService.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        cantidad_total: a.cantidad_total ?? 0, // si tu backend lo llama distinto, ajústalo
      }));

      setActivos(data);
    };

    loadActivos();
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

    try {
      await agregarActivoContrato(contratoId, {
        activo_id: form.activo_id,
        cantidad: Number(form.cantidad),
        precio_dia: Number(form.precio_dia),
      });

      Swal.fire({
        icon: "success",
        title: "Activo agregado",
        timer: 1500,
        showConfirmButton: false,
      });

      onAgregado();
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message ?? "No se pudo agregar el activo",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4">Agregar Activo</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            name="activo_id"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Seleccione activo</option>
            {activos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} (Stock: {a.cantidad_total})
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            name="cantidad"
            placeholder="Cantidad"
            value={form.cantidad}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            min={0}
            name="precio_dia"
            placeholder="Precio por día"
            value={form.precio_dia}
            onChange={handleChange}
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddActivoContratoModal;
