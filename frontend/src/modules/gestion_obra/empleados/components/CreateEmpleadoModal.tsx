import { useState } from "react";

import Swal from "sweetalert2";

import { createEmpleado } from "../services/empleadosService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface EmpleadoForm {
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
  direccion: string;
  fecha_nacimiento: string;
  cargo: string;
  tipo_pago: "diario" | "semanal" | "mensual";
  salario_base: string;
  fecha_ingreso: string;
  observaciones: string;
}

function CreateEmpleadoModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<EmpleadoForm>({
    nombres: "",
    apellidos: "",
    cedula: "",
    telefono: "",
    correo: "",
    direccion: "",
    fecha_nacimiento: "",
    cargo: "",
    tipo_pago: "mensual",
    salario_base: "",
    fecha_ingreso: "",
    observaciones: "",
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  /* =========================
     HANDLE CHANGE
  ========================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createEmpleado({
        ...form,
        salario_base: form.salario_base ? Number(form.salario_base) : undefined,
      });

      Swal.fire({
        icon: "success",
        title: "Empleado creado correctamente",
        timer: 1500,
        showConfirmButton: false,
      });

      onCreated();

      onClose();

      /* RESET FORM */

      setForm({
        nombres: "",
        apellidos: "",
        cedula: "",
        telefono: "",
        correo: "",
        direccion: "",
        fecha_nacimiento: "",
        cargo: "",
        tipo_pago: "mensual",
        salario_base: "",
        fecha_ingreso: "",
        observaciones: "",
      });
    } catch (error: any) {
      console.error(error);

      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo crear el empleado",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/40
        flex justify-center items-center
        p-4
        overflow-y-auto
      "
    >
      {/* CONTENEDOR MODAL */}

      <div
        className="
          bg-white
          rounded-xl
          w-full
          max-w-4xl
          shadow-xl
          my-10
          max-h-[95vh]
          overflow-y-auto
        "
      >
        {/* HEADER */}

        <div
          className="
            flex justify-between items-center
            px-6 py-4
            border-b
            sticky top-0
            bg-white
            z-10
          "
        >
          <h2 className="text-2xl font-bold text-gray-800">Nuevo Empleado</h2>

          <button
            onClick={onClose}
            className="
              text-gray-500
              hover:text-black
              text-2xl
              transition
            "
          >
            ✕
          </button>
        </div>

        {/* FORMULARIO */}

        <form
          onSubmit={handleSubmit}
          className="
            p-6
            grid grid-cols-1 md:grid-cols-2
            gap-4
          "
        >
          {/* NOMBRES */}

          <div>
            <label className="block text-sm font-medium mb-1">Nombres</label>

            <input
              type="text"
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              placeholder="Ingrese nombres"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
              required
            />
          </div>

          {/* APELLIDOS */}

          <div>
            <label className="block text-sm font-medium mb-1">Apellidos</label>

            <input
              type="text"
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
              placeholder="Ingrese apellidos"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
              required
            />
          </div>

          {/* CEDULA */}

          <div>
            <label className="block text-sm font-medium mb-1">Cédula</label>

            <input
              type="text"
              name="cedula"
              value={form.cedula}
              onChange={handleChange}
              placeholder="Ingrese cédula"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
              required
            />
          </div>

          {/* TELEFONO */}

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>

            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Ingrese teléfono"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          {/* CORREO */}

          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>

            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="Ingrese correo"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          {/* CARGO */}

          <div>
            <label className="block text-sm font-medium mb-1">Cargo</label>

            <input
              type="text"
              name="cargo"
              value={form.cargo}
              onChange={handleChange}
              placeholder="Ingrese cargo"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          {/* TIPO PAGO */}

          <div>
            <label className="block text-sm font-medium mb-1">Tipo Pago</label>

            <select
              name="tipo_pago"
              value={form.tipo_pago}
              onChange={handleChange}
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            >
              <option value="diario">Diario</option>

              <option value="semanal">Semanal</option>

              <option value="mensual">Mensual</option>
            </select>
          </div>

          {/* SALARIO */}

          <div>
            <label className="block text-sm font-medium mb-1">
              Salario Base
            </label>

            <input
              type="number"
              name="salario_base"
              value={form.salario_base}
              onChange={handleChange}
              placeholder="Ingrese salario"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          {/* FECHA NACIMIENTO */}

          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha Nacimiento
            </label>

            <input
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          {/* FECHA INGRESO */}

          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha Ingreso
            </label>

            <input
              type="date"
              name="fecha_ingreso"
              value={form.fecha_ingreso}
              onChange={handleChange}
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
            />
          </div>

          {/* DIRECCION */}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Dirección</label>

            <textarea
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Ingrese dirección"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
              rows={2}
            />
          </div>

          {/* OBSERVACIONES */}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Observaciones
            </label>

            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              placeholder="Ingrese observaciones"
              className="
                w-full
                border
                rounded-lg
                px-3 py-2
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
              "
              rows={3}
            />
          </div>

          {/* BOTONES */}

          <div className="md:col-span-2 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="
                px-5 py-2
                border
                rounded-lg
                hover:bg-gray-100
                transition
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
                px-5 py-2
                bg-[var(--color-primary)]
                text-white
                rounded-lg
                hover:opacity-90
                disabled:opacity-60
                transition
              "
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEmpleadoModal;
