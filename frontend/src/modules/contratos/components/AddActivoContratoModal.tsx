import { useEffect, useMemo, useState } from "react";
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
  cantidad_total: number | string;
}

interface FormState {
  activo_id: string;
  cantidad: number;
  precio_diario: number;
}

const FORM_INICIAL: FormState = {
  activo_id: "",
  cantidad: 1,
  precio_diario: 0,
};

function AddActivoContratoModal({
  open,
  onClose,
  contratoId,
  onAgregado,
}: Props) {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingActivos, setLoadingActivos] = useState(false);

  const [form, setForm] = useState<FormState>(FORM_INICIAL);

  const activoSeleccionado = useMemo(
    () => activos.find((activo) => activo.id === form.activo_id),
    [activos, form.activo_id],
  );

  const stockDisponible = Number(activoSeleccionado?.cantidad_total ?? 0);

  /* =========================
     CARGAR ACTIVOS
  ========================= */
  useEffect(() => {
    if (!open) return;

    const loadActivos = async () => {
      try {
        setLoadingActivos(true);

        const dataFromService = await getActivos();

        const data: Activo[] = (dataFromService ?? []).map((activo: any) => ({
          id: activo.id,
          nombre: activo.nombre,
          cantidad_total: Number(activo.cantidad_total ?? 0),
        }));

        /*
         * Solo se muestran activos con stock disponible.
         */
        setActivos(data.filter((activo) => Number(activo.cantidad_total) > 0));
      } catch (error) {
        console.error("Error cargando activos:", error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los activos disponibles.",
        });

        setActivos([]);
      } finally {
        setLoadingActivos(false);
      }
    };

    loadActivos();
  }, [open]);

  /*
   * Cada vez que se abre el modal, empieza limpio.
   */
  useEffect(() => {
    if (open) {
      setForm(FORM_INICIAL);
    }
  }, [open]);

  if (!open) return null;

  /* =========================
     MANEJO DE INPUTS
  ========================= */
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "cantidad" || name === "precio_diario" ? Number(value) : value,
    }));
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.activo_id) {
      Swal.fire({
        icon: "warning",
        title: "Activo obligatorio",
        text: "Seleccione una herramienta o máquina.",
      });
      return;
    }

    if (!Number.isInteger(form.cantidad) || form.cantidad <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad inválida",
        text: "La cantidad debe ser un número entero mayor que cero.",
      });
      return;
    }

    if (form.cantidad > stockDisponible) {
      Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        text: `Solo existen ${stockDisponible} unidades disponibles.`,
      });
      return;
    }

    if (!Number.isFinite(form.precio_diario) || form.precio_diario <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Precio inválido",
        text: "El precio diario debe ser mayor que cero.",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        activo_id: form.activo_id,
        cantidad: form.cantidad,
        precio_diario: form.precio_diario,
      };

      console.log("Activo enviado al contrato:", payload);

      await agregarActivoContrato(contratoId, payload);

      await Swal.fire({
        icon: "success",
        title: "Activo agregado",
        text: "El activo fue agregado correctamente al contrato.",
        timer: 1600,
        showConfirmButton: false,
      });

      setForm(FORM_INICIAL);

      await onAgregado();
      onClose();
    } catch (error: unknown) {
      console.error("Error agregando activo:", error);

      let mensaje = "No se pudo agregar el activo al contrato.";

      if (axios.isAxiosError(error)) {
        mensaje =
          error.response?.data?.message ??
          error.response?.data?.error ??
          mensaje;
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: mensaje,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[440px] rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800">
          Agregar activo al contrato
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Selecciona el activo, la cantidad y el precio diario del alquiler.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="activo_id"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Activo
            </label>

            <select
              id="activo_id"
              name="activo_id"
              value={form.activo_id}
              onChange={handleChange}
              disabled={loading || loadingActivos}
              className="w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">
                {loadingActivos ? "Cargando activos..." : "Seleccione activo"}
              </option>

              {activos.map((activo) => (
                <option key={activo.id} value={activo.id}>
                  {activo.nombre} — Stock: {activo.cantidad_total}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cantidad"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Cantidad
            </label>

            <input
              id="cantidad"
              type="number"
              name="cantidad"
              min={1}
              max={stockDisponible || undefined}
              step={1}
              value={form.cantidad}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />

            {activoSeleccionado && (
              <p className="mt-1 text-xs text-gray-500">
                Stock disponible: {stockDisponible}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="precio_diario"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Precio diario ($)
            </label>

            <input
              id="precio_diario"
              type="number"
              name="precio_diario"
              min={0.01}
              step={0.01}
              placeholder="Ejemplo: 20.00"
              value={form.precio_diario}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            El sistema calculará automáticamente:
            <p className="mt-1 font-semibold">
              cantidad × precio diario × días del contrato
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || loadingActivos}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Agregar activo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddActivoContratoModal;
