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
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    activo_id: "",
    cantidad: 1,
    precio_diario: 0, // ✅ corregido
  });

  /* 📌 Cargar activos */
  useEffect(() => {
    const loadActivos = async () => {
      try {
        const dataFromService = await getActivos();

        const data: Activo[] = dataFromService.map((a: any) => ({
          id: a.id,
          nombre: a.nombre,
          cantidad_total: a.cantidad_total ?? 0,
        }));

        setActivos(data);
      } catch (error) {
        console.error("Error cargando activos", error);
      }
    };

    if (open) loadActivos();
  }, [open]);

  if (!open) return null;

  /* 📌 Manejo de inputs */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "cantidad" || e.target.name === "precio_diario"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  /* 📌 Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 Validaciones
    if (!form.activo_id || form.cantidad <= 0 || form.precio_diario < 0) {
      Swal.fire({
        icon: "warning",
        title: "Datos inválidos",
        text: "Complete correctamente los campos",
      });
      return;
    }

    try {
      setLoading(true);

      console.log("DATA ENVIADA:", form);

      await agregarActivoContrato(contratoId, form);

      Swal.fire({
        icon: "success",
        title: "Activo agregado",
        timer: 1500,
        showConfirmButton: false,
      });

      // 🔄 reset
      setForm({
        activo_id: "",
        cantidad: 1,
        precio_diario: 0,
      });

      onAgregado();
      onClose();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message ?? "No se pudo agregar el activo",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4">Agregar Activo</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 📌 Activo */}
          <select
            name="activo_id"
            value={form.activo_id} // ✅ controlado
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

          {/* 📌 Cantidad */}
          <label className="text-sm text-gray-600">Cantidad</label>
          <input
            type="number"
            min={1}
            placeholder="Cantidad"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* 📌 Precio diario */}
          <label className="text-sm text-gray-600">Precio diario ($)</label>
          <input
            type="number"
            min={0}
            placeholder="Precio diario"
            name="precio_diario" // ✅ corregido
            value={form.precio_diario}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* 📌 Botones */}
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddActivoContratoModal;
