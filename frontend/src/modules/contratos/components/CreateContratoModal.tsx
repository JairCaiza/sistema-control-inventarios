import { useEffect, useState } from "react";
import { createContrato } from "../service/contratoService";
import { getClientes } from "../../clientes/service/clienteService";
import Swal from "sweetalert2";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Cliente {
  id: string;
  nombre: string;
}

function CreateContratoModal({ open, onClose, onCreated }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [form, setForm] = useState({
    cliente_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    observacion: "",
  });

  useEffect(() => {
    const loadClientes = async () => {
      const data = await getClientes();
      setClientes(data);
    };

    loadClientes();
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
      await createContrato(form);

      Swal.fire({
        icon: "success",
        title: "Contrato creado",
        timer: 2000,
        showConfirmButton: false,
      });

      onCreated();
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message ?? "Error creando contrato",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4">Nuevo Contrato</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            name="cliente_id"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Seleccione cliente</option>

            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <input
            name="fecha_inicio"
            type="date"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="fecha_fin"
            type="date"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            name="observacion"
            placeholder="Observación"
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

export default CreateContratoModal;
