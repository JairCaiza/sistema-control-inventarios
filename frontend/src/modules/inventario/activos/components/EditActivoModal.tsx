import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import {
  updateActivo,
  type Activo,
  type UpdateActivoData,
} from "../../activos/service/activoService";

import {
  getCategorias,
  type Categoria,
} from "../../categorias/services/categoriaService";

import {
  X,
  Pencil,
  Tag,
  DollarSign,
  Wrench,
  Loader2,
  Info,
} from "lucide-react";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;

  activo: Activo | null;

  onClose: () => void;

  onUpdated: () => void;
}

/* =====================================================
   FORM
===================================================== */

interface FormState {
  nombre: string;

  descripcion: string;

  categoria_id: string;

  valor_reposicion: string;

  marca: string;

  color: string;

  responsable: string;

  observaciones: string;
}

/* =====================================================
   COMPONENTE
===================================================== */

function EditActivoModal({ open, activo, onClose, onUpdated }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [loadingData, setLoadingData] = useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    nombre: "",
    descripcion: "",
    categoria_id: "",
    valor_reposicion: "",
    marca: "",
    color: "",
    responsable: "",
    observaciones: "",
  });

  /* =====================================================
     CARGAR DATOS
  ===================================================== */

  useEffect(() => {
    if (!open || !activo) {
      return;
    }

    setForm({
      nombre: activo.nombre || "",

      descripcion: activo.descripcion || "",

      categoria_id: activo.categoria_id || "",

      valor_reposicion:
        activo.valor_reposicion !== null &&
        activo.valor_reposicion !== undefined
          ? String(activo.valor_reposicion)
          : "",

      marca: activo.marca || "",

      color: activo.color || "",

      responsable: activo.responsable || "",

      observaciones: activo.observaciones || "",
    });

    const cargarCategorias = async () => {
      try {
        setLoadingData(true);

        const data = await getCategorias();

        setCategorias(
          (data || []).filter((categoria: any) => categoria.activo !== false),
        );
      } catch (error) {
        console.error("Error cargando categorías:", error);

        await Swal.fire({
          icon: "error",

          title: "No se pudieron cargar las categorías",
        });
      } finally {
        setLoadingData(false);
      }
    };

    cargarCategorias();
  }, [open, activo]);

  /* =====================================================
     NO RENDER
  ===================================================== */

  if (!open || !activo) {
    return null;
  }

  /* =====================================================
     HANDLE CHANGE
  ===================================================== */

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,

      [name]: value,
    }));
  };

  /* =====================================================
     VALIDAR
  ===================================================== */

  const validar = (): string | null => {
    if (!form.nombre.trim()) {
      return "El nombre del activo es obligatorio.";
    }

    if (form.nombre.trim().length < 3) {
      return "El nombre debe tener al menos 3 caracteres.";
    }

    if (!form.categoria_id) {
      return "Debe seleccionar una categoría.";
    }

    if (form.valor_reposicion && Number(form.valor_reposicion) < 0) {
      return "El valor de reposición no puede ser negativo.";
    }

    return null;
  };

  /* =====================================================
     GUARDAR
  ===================================================== */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const errorValidacion = validar();

    if (errorValidacion) {
      await Swal.fire({
        icon: "warning",

        title: "Revise la información",

        text: errorValidacion,
      });

      return;
    }

    try {
      setSaving(true);

      const payload: UpdateActivoData = {
        nombre: form.nombre.trim(),

        descripcion: form.descripcion.trim() || null,

        categoria_id: form.categoria_id,

        valor_reposicion: form.valor_reposicion
          ? Number(form.valor_reposicion)
          : null,

        marca: form.marca.trim() || null,

        color: form.color.trim() || null,

        responsable: form.responsable.trim() || null,

        observaciones: form.observaciones.trim() || null,
      };

      await updateActivo(activo.id, payload);

      await Swal.fire({
        icon: "success",

        title: "Activo actualizado",

        text: "La información del activo se actualizó correctamente.",

        timer: 1800,

        showConfirmButton: false,

        timerProgressBar: true,
      });

      onUpdated();

      onClose();
    } catch (error: any) {
      console.error("Error actualizando activo:", error);

      const errores = error?.response?.data?.errores;

      const mensaje =
        Array.isArray(errores) && errores.length > 0
          ? errores.join("\n")
          : error?.response?.data?.message ||
            "No se pudo actualizar el activo.";

      await Swal.fire({
        icon: "error",

        title: "No se pudo actualizar",

        text: mensaje,
      });
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Pencil size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Editar Activo
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Modifique la información descriptiva del activo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            <X size={21} />
          </button>
        </div>

        {/* =================================================
            INFORMACIÓN ACTUAL
        ================================================= */}

        <div className="border-b bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-800">{activo.nombre}</p>

              <p className="mt-1 text-sm text-gray-500">
                Código: <span className="font-medium">{activo.codigo}</span>
              </p>
            </div>

            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                activo.tipo_control === "unidad"
                  ? "bg-cyan-100 text-cyan-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {activo.tipo_control === "unidad"
                ? "Control individual"
                : "Control por cantidad"}
            </span>
          </div>
        </div>

        {/* =================================================
            FORMULARIO
        ================================================= */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-7 p-6">
            {/* =================================================
                INFORMACIÓN GENERAL
            ================================================= */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Tag size={18} className="text-[var(--color-primary)]" />

                <h3 className="font-semibold text-gray-800">
                  Información general
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* NOMBRE */}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>

                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* CATEGORÍA */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Categoría *
                  </label>

                  <select
                    name="categoria_id"
                    value={form.categoria_id}
                    onChange={handleChange}
                    disabled={loadingData}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)] disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar categoría</option>

                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VALOR */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Valor de reposición
                  </label>

                  <div className="relative">
                    <DollarSign
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="valor_reposicion"
                      value={form.valor_reposicion}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* DESCRIPCIÓN */}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Descripción
                  </label>

                  <textarea
                    name="descripcion"
                    rows={3}
                    value={form.descripcion}
                    onChange={handleChange}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            </section>

            <div className="border-t" />

            {/* =================================================
                INFORMACIÓN ADICIONAL
            ================================================= */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Wrench size={18} className="text-[var(--color-primary)]" />

                <h3 className="font-semibold text-gray-800">
                  Información adicional
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* MARCA */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Marca
                  </label>

                  <input
                    type="text"
                    name="marca"
                    value={form.marca}
                    onChange={handleChange}
                    placeholder="Ejemplo: Bosch"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* COLOR */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Color
                  </label>

                  <input
                    type="text"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    placeholder="Ejemplo: Azul"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* RESPONSABLE */}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Responsable
                  </label>

                  <input
                    type="text"
                    name="responsable"
                    value={form.responsable}
                    onChange={handleChange}
                    placeholder="Persona responsable del activo"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* OBSERVACIONES */}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Observaciones
                  </label>

                  <textarea
                    name="observaciones"
                    rows={3}
                    value={form.observaciones}
                    onChange={handleChange}
                    placeholder="Información adicional..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                ADVERTENCIA
            ================================================= */}

            <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />

              <p className="text-sm leading-6 text-blue-800">
                La ubicación, cantidad y estado no se modifican desde esta
                pantalla. Estos cambios deben realizarse mediante movimientos de
                inventario para mantener la trazabilidad.
              </p>
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || loadingData}
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Pencil size={18} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditActivoModal;
