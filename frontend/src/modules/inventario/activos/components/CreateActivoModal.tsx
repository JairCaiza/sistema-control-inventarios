import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import {
  createActivo,
  type CreateActivoData,
  type TipoControlActivo,
} from "../../activos/service/activoService";

import type { Categoria } from "../../categorias/services/categoriaService";

import { getCategorias } from "../../categorias/services/categoriaService";

import type { Ubicacion } from "../../ubicaciones/services/ubicacionService";

import { getUbicaciones } from "../../ubicaciones/services/ubicacionService";

import {
  X,
  PackagePlus,
  Boxes,
  Wrench,
  MapPin,
  Tag,
  DollarSign,
  Info,
  Loader2,
} from "lucide-react";

/* =====================================================
   PROPS
===================================================== */

interface Props {
  open: boolean;

  onClose: () => void;

  onCreated: () => void;
}

/* =====================================================
   ESTADO DEL FORMULARIO
===================================================== */

interface FormState {
  nombre: string;

  descripcion: string;

  categoria_id: string;

  ubicacion_id: string;

  estado: "disponible" | "mantenimiento" | "danado" | "perdido" | "dado_baja";

  tipo_control: "unidad" | "cantidad";

  cantidad_total: string;

  valor_reposicion: string;

  marca: string;

  color: string;

  responsable: string;

  observaciones: string;
}

/* =====================================================
   FORM INICIAL
===================================================== */

const getInitialForm = (): FormState => ({
  nombre: "",

  descripcion: "",

  categoria_id: "",

  ubicacion_id: "",

  estado: "disponible",

  tipo_control: "cantidad",

  cantidad_total: "1",

  valor_reposicion: "",

  marca: "",

  color: "",

  responsable: "",

  observaciones: "",
});

/* =====================================================
   COMPONENTE
===================================================== */

function CreateActivoModal({ open, onClose, onCreated }: Props) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [form, setForm] = useState<FormState>(getInitialForm());

  const [loadingData, setLoadingData] = useState(false);

  const [saving, setSaving] = useState(false);

  /* =====================================================
     CARGAR CATÁLOGOS
  ===================================================== */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const [cats, ubis] = await Promise.all([
          getCategorias(),
          getUbicaciones(),
        ]);

        /*
         * Solo categorías activas si
         * el tipo incluye el campo activo.
         */
        setCategorias((cats || []).filter((cat: any) => cat.activo !== false));

        setUbicaciones(ubis || []);
      } catch (error) {
        console.error("Error cargando catálogos:", error);

        await Swal.fire({
          icon: "error",

          title: "No se pudieron cargar los datos",

          text: "No fue posible obtener categorías o ubicaciones.",
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      setForm(getInitialForm());

      loadData();
    }
  }, [open]);

  /* =====================================================
     NO RENDER
  ===================================================== */

  if (!open) {
    return null;
  }

  /* =====================================================
     HANDLE CHANGE
  ===================================================== */

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

  /* =====================================================
     CAMBIO TIPO CONTROL
  ===================================================== */

  const handleTipoControlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipo = e.target.value as TipoControlActivo;

    setForm((prev) => ({
      ...prev,

      tipo_control: tipo,

      /*
       * Al cambiar a unidad dejamos
       * cantidad 1 por defecto.
       *
       * El usuario puede subirla si
       * quiere registrar varias unidades
       * individuales de una sola vez.
       */
      cantidad_total: tipo === "unidad" ? "1" : prev.cantidad_total || "1",
    }));
  };

  /* =====================================================
     VALIDACIÓN FRONTEND
  ===================================================== */

  const validarFormulario = (): string | null => {
    if (!form.nombre.trim()) {
      return "El nombre del activo es obligatorio.";
    }

    if (!form.categoria_id) {
      return "Debe seleccionar una categoría.";
    }

    if (!form.ubicacion_id) {
      return "Debe seleccionar una ubicación inicial.";
    }

    const cantidad = Number(form.cantidad_total);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return "La cantidad debe ser un número entero mayor que cero.";
    }

    if (form.valor_reposicion && Number(form.valor_reposicion) < 0) {
      return "El valor de reposición no puede ser negativo.";
    }

    return null;
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const mensajeValidacion = validarFormulario();

    if (mensajeValidacion) {
      await Swal.fire({
        icon: "warning",

        title: "Revise la información",

        text: mensajeValidacion,
      });

      return;
    }

    const cantidad = Number(form.cantidad_total);

    /*
     * Si es control individual y
     * cantidad > 1, informamos claramente
     * qué hará el backend.
     */
    if (form.tipo_control === "unidad" && cantidad > 1) {
      const confirmacion = await Swal.fire({
        icon: "question",

        title: "Registrar varias unidades",

        html: `
            <div style="text-align:left; line-height:1.7">
              <p>
                Se crearán <strong>${cantidad} activos independientes</strong>.
              </p>

              <p>
                Cada unidad tendrá:
              </p>

              <ul style="margin-left:20px; list-style:disc">
                <li>Su propio código</li>
                <li>Stock individual de 1</li>
                <li>Su propio estado</li>
                <li>Su propio historial</li>
              </ul>
            </div>
          `,

        showCancelButton: true,

        confirmButtonText: "Sí, registrar",

        cancelButtonText: "Cancelar",

        confirmButtonColor: "#2563eb",
      });

      if (!confirmacion.isConfirmed) {
        return;
      }
    }

    try {
      setSaving(true);

      const payload: CreateActivoData = {
        nombre: form.nombre.trim(),

        descripcion: form.descripcion.trim() || null,

        categoria_id: form.categoria_id,

        ubicacion_id: form.ubicacion_id,

        estado: form.estado,

        tipo_control: form.tipo_control,

        cantidad_total: cantidad,

        valor_reposicion: form.valor_reposicion
          ? Number(form.valor_reposicion)
          : null,

        marca: form.marca.trim() || null,

        color: form.color.trim() || null,

        responsable: form.responsable.trim() || null,

        observaciones: form.observaciones.trim() || null,
      };

      const resultado = await createActivo(payload);

      await Swal.fire({
        icon: "success",

        title:
          form.tipo_control === "unidad" && resultado.cantidad_creada > 1
            ? "Activos registrados"
            : "Activo registrado",

        text:
          form.tipo_control === "unidad" && resultado.cantidad_creada > 1
            ? `Se crearon ${resultado.cantidad_creada} activos individuales correctamente.`
            : "El activo fue registrado correctamente.",

        timer: 2200,

        showConfirmButton: false,

        timerProgressBar: true,
      });

      onCreated();

      onClose();
    } catch (error: any) {
      console.error("Error registrando activo:", error);

      const errores = error?.response?.data?.errores;

      const mensaje =
        Array.isArray(errores) && errores.length > 0
          ? errores.join("\n")
          : error?.response?.data?.message || "Error al crear el activo.";

      await Swal.fire({
        icon: "error",

        title: "No se pudo registrar",

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
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)]">
              <PackagePlus size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">Nuevo Activo</h2>

              <p className="mt-1 text-sm text-gray-500">
                Registre equipos, herramientas, encofrados u otros elementos del
                inventario.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            <X size={22} />
          </button>
        </div>

        {/* =================================================
            BODY
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
                    Nombre del activo *
                  </label>

                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ejemplo: Taladro Industrial Bosch"
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
                    <option value="">Seleccione una categoría</option>

                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* UBICACIÓN */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Ubicación inicial *
                  </label>

                  <div className="relative">
                    <MapPin
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <select
                      name="ubicacion_id"
                      value={form.ubicacion_id}
                      onChange={handleChange}
                      disabled={loadingData}
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 outline-none transition focus:border-[var(--color-primary)] disabled:bg-gray-100"
                    >
                      <option value="">Seleccione una ubicación</option>

                      {ubicaciones.map((ubicacion) => (
                        <option key={ubicacion.id} value={ubicacion.id}>
                          {ubicacion.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DESCRIPCIÓN */}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Descripción
                  </label>

                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Características generales del activo..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            </section>

            <div className="border-t" />

            {/* =================================================
                CONTROL DE INVENTARIO
            ================================================= */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Boxes size={18} className="text-[var(--color-primary)]" />

                <h3 className="font-semibold text-gray-800">
                  Control de inventario
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {/* TIPO CONTROL */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo de control *
                  </label>

                  <select
                    name="tipo_control"
                    value={form.tipo_control}
                    onChange={handleTipoControlChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  >
                    <option value="cantidad">Por cantidad</option>

                    <option value="unidad">Individual</option>
                  </select>
                </div>

                {/* CANTIDAD */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {form.tipo_control === "unidad"
                      ? "Unidades a registrar *"
                      : "Stock inicial *"}
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="cantidad_total"
                    value={form.cantidad_total}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* ESTADO */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Estado inicial *
                  </label>

                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  >
                    <option value="disponible">Disponible</option>

                    <option value="mantenimiento">Mantenimiento</option>

                    <option value="danado">Dañado</option>

                    <option value="perdido">Perdido</option>

                    <option value="dado_baja">Dado de baja</option>
                  </select>
                </div>
              </div>

              {/* EXPLICACIÓN */}

              <div className="mt-4 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />

                <div className="text-sm leading-6 text-blue-800">
                  {form.tipo_control === "unidad" ? (
                    <>
                      <strong>Control individual:</strong> cada unidad será
                      creada como un activo independiente con su propio código,
                      estado, ubicación e historial. Por ejemplo, si registra 5
                      unidades se crearán 5 activos diferentes.
                    </>
                  ) : (
                    <>
                      <strong>Control por cantidad:</strong> se creará un solo
                      activo y la cantidad ingresada representará su stock
                      inicial. Posteriormente el stock puede dividirse entre
                      disponible, mantenimiento, dañado u otros estados.
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                El estado <strong>Alquilado</strong> no puede registrarse
                manualmente. Ese estado será generado automáticamente cuando el
                activo sea incluido en un contrato de alquiler.
              </div>
            </section>

            <div className="border-t" />

            {/* =================================================
                DETALLES DEL ACTIVO
            ================================================= */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Wrench size={18} className="text-[var(--color-primary)]" />

                <h3 className="font-semibold text-gray-800">
                  Detalles adicionales
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

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Responsable
                  </label>

                  <input
                    type="text"
                    name="responsable"
                    value={form.responsable}
                    onChange={handleChange}
                    placeholder="Persona responsable"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* VALOR REPOSICIÓN */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Valor de reposición
                  </label>

                  <div className="relative">
                    <DollarSign
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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

                {/* OBSERVACIONES */}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Observaciones
                  </label>

                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Información adicional del activo..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            </section>
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
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <PackagePlus size={18} />

                  {form.tipo_control === "unidad" &&
                  Number(form.cantidad_total) > 1
                    ? `Registrar ${form.cantidad_total} unidades`
                    : "Guardar activo"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateActivoModal;
