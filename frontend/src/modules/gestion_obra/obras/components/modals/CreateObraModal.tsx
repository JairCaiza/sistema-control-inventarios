import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { createObra } from "../../services/obrasService";

import { getClientes } from "../../../../clientes/service/clienteService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
}

function CreateObraModal({ open, onClose, onCreated }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [form, setForm] = useState<{
    codigo: string;
    nombre: string;

    cliente_id: string;

    descripcion: string;

    ubicacion: string;

    fecha_inicio: string;

    fecha_fin: string;

    estado:
      | "planificada"
      | "en_proceso"
      | "pausada"
      | "finalizada"
      | "cancelada";

    presupuesto: string;
  }>({
    codigo: "",

    nombre: "",

    cliente_id: "",

    descripcion: "",

    ubicacion: "",

    fecha_inicio: "",

    fecha_fin: "",

    presupuesto: "",

    estado: "planificada",
  });

  const [loading, setLoading] = useState(false);

  /* =========================
     LOAD CLIENTES
  ========================= */
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const data = await getClientes();

        setClientes(data);
      } catch (error) {
        console.error(error);
      }
    };

    if (open) {
      loadClientes();
    }
  }, [open]);

  if (!open) return null;

  /* =========================
     HANDLE CHANGE
  ========================= */
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

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createObra({
        codigo: form.codigo,

        nombre: form.nombre,

        cliente_id: form.cliente_id || undefined,

        descripcion: form.descripcion,

        ubicacion: form.ubicacion,

        fecha_inicio: form.fecha_inicio,

        fecha_fin: form.fecha_fin,

        estado: form.estado,

        presupuesto: Number(form.presupuesto || 0),
      });

      Swal.fire({
        icon: "success",
        title: "Obra creada correctamente",
        timer: 1400,
        showConfirmButton: false,
      });

      onCreated();

      onClose();

      /* RESET */
      setForm({
        codigo: "",

        nombre: "",

        cliente_id: "",

        descripcion: "",

        ubicacion: "",

        fecha_inicio: "",

        fecha_fin: "",

        presupuesto: "",

        estado: "planificada",
      });
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo crear la obra",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Nueva Obra</h2>

            <p className="text-sm text-gray-500 mt-1">
              Registra una nueva obra en el sistema
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
          {/* CODIGO */}
          <div>
            <label className="block text-sm mb-1 font-medium">Código</label>

            <input
              type="text"
              name="codigo"
              placeholder="Ej: OBR-001"
              value={form.codigo}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
          </div>

          {/* NOMBRE */}
          <div>
            <label className="block text-sm mb-1 font-medium">
              Nombre Obra
            </label>

            <input
              type="text"
              name="nombre"
              placeholder="Nombre de la obra"
              value={form.nombre}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
          </div>

          {/* CLIENTE */}
          <div>
            <label className="block text-sm mb-1 font-medium">Cliente</label>

            <select
              name="cliente_id"
              value={form.cliente_id}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            >
              <option value="">Seleccione un cliente</option>

              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido || ""}
                </option>
              ))}
            </select>
          </div>

          {/* ESTADO */}
          <div>
            <label className="block text-sm mb-1 font-medium">Estado</label>

            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            >
              <option value="planificada">Planificada</option>

              <option value="en_proceso">En Proceso</option>

              <option value="pausada">Pausada</option>

              <option value="finalizada">Finalizada</option>

              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* UBICACION */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 font-medium">Ubicación</label>

            <input
              type="text"
              name="ubicacion"
              placeholder="Dirección o ubicación"
              value={form.ubicacion}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>

          {/* FECHA INICIO */}
          <div>
            <label className="block text-sm mb-1 font-medium">
              Fecha Inicio
            </label>

            <input
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>

          {/* FECHA FIN */}
          <div>
            <label className="block text-sm mb-1 font-medium">Fecha Fin</label>

            <input
              type="date"
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>

          {/* PRESUPUESTO */}
          <div>
            <label className="block text-sm mb-1 font-medium">
              Presupuesto
            </label>

            <input
              type="number"
              name="presupuesto"
              placeholder="0.00"
              value={form.presupuesto}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>

          {/* DESCRIPCION */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 font-medium">
              Descripción
            </label>

            <textarea
              name="descripcion"
              placeholder="Descripción de la obra"
              value={form.descripcion}
              onChange={handleChange}
              rows={4}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>

          {/* BOTONES */}
          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateObraModal;
