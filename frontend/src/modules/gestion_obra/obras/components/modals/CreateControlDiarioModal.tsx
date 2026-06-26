import { useState } from "react";
import Swal from "sweetalert2";
import { registrarControlDiario } from "../../services/controlDiarioService";

interface Props {
  open: boolean;
  onClose: () => void;
  obraId: string;
  onSuccess?: () => void; // 👈 NUEVO
}

function CreateControlDiarioModal({ open, onClose, obraId, onSuccess }: Props) {
  const [form, setForm] = useState({
    actividad: "",
    descripcion: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    avance: "",
    observaciones: "",
    clima: "",
  });

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      obra_id: obraId,
      actividad: form.actividad,
      descripcion: form.descripcion,
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      avance: form.avance ? Number(form.avance) : undefined,
      observaciones: form.observaciones,
      clima: form.clima,
    };

    try {
      await registrarControlDiario(payload);
      Swal.fire({
        icon: "success",
        title: "Registro guardado",
        text: "El control diario se guardó correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      console.log("✔ CONTROL GUARDADO");
      if (onSuccess) {
        await onSuccess();
      }

      // limpiar formulario
      setForm({
        actividad: "",
        descripcion: "",
        fecha: "",
        hora_inicio: "",
        hora_fin: "",
        avance: "",
        observaciones: "",
        clima: "",
      });

      onClose();
    } catch (error) {
      console.error("❌ ERROR AL GUARDAR CONTROL", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Registrar Control Diario
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Registra las actividades realizadas en la obra
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* ACTIVIDAD */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Actividad
            </label>

            <input
              type="text"
              name="actividad"
              value={form.actividad}
              onChange={handleChange}
              placeholder="Ej: Fundición de columnas"
              className="w-full border rounded-xl px-4 py-3 mt-1"
              required
            />
          </div>

          {/* FECHA */}
          <div>
            <label className="text-sm font-medium text-gray-700">Fecha</label>

            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 mt-1"
              required
            />
          </div>

          {/* AVANCE */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Avance %
            </label>

            <input
              type="number"
              name="avance"
              value={form.avance}
              onChange={handleChange}
              placeholder="Ej: 70"
              className="w-full border rounded-xl px-4 py-3 mt-1"
            />
          </div>

          {/* HORA INICIO */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Hora Inicio
            </label>

            <input
              type="time"
              name="hora_inicio"
              value={form.hora_inicio}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 mt-1"
            />
          </div>

          {/* HORA FIN */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Hora Fin
            </label>

            <input
              type="time"
              name="hora_fin"
              value={form.hora_fin}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 mt-1"
            />
          </div>

          {/* CLIMA */}
          <div>
            <label className="text-sm font-medium text-gray-700">Clima</label>

            <select
              name="clima"
              value={form.clima}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 mt-1"
            >
              <option value="">Seleccione</option>
              <option value="soleado">Soleado</option>
              <option value="nublado">Nublado</option>
              <option value="lluvia">Lluvia</option>
              <option value="tormenta">Tormenta</option>
            </select>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Descripción
            </label>

            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={4}
              placeholder="Describe lo realizado durante la jornada..."
              className="w-full border rounded-xl px-4 py-3 mt-1 resize-none"
            />
          </div>

          {/* OBSERVACIONES */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Observaciones
            </label>

            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows={3}
              placeholder="Novedades, problemas, materiales faltantes..."
              className="w-full border rounded-xl px-4 py-3 mt-1 resize-none"
            />
          </div>

          {/* BOTONES */}
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white"
            >
              Guardar Control
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateControlDiarioModal;
