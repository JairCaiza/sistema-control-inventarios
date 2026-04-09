import { useEffect, useState } from "react";
import { createContrato } from "../service/contratoService";
import { getClientes } from "../../clientes/service/clienteService";
import Swal from "sweetalert2";
import axios from "axios";

/* 📌 Props */
interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* 📌 Tipos */
interface Cliente {
  id: string;
  nombre: string;
}

interface FormState {
  numero_contrato: string;
  cliente_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
  estado: string; // 🔥 requerido por backend
}

function CreateContratoModal({ open, onClose, onCreated }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    numero_contrato: "",
    cliente_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    observaciones: "",
    estado: "activo", // 🔥 valor por defecto
  });

  /* 📌 Generar iniciales del cliente */
  const getIniciales = (nombre: string) => {
    return nombre
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase())
      .join("")
      .slice(0, 3);
  };

  /* 📌 Generar correlativo (temporal) */
  const generarCorrelativo = () => {
    const random = Math.floor(Math.random() * 9999) + 1;
    return String(random).padStart(4, "0");
  };

  /* 📌 Generar número contrato */
  const generarNumeroContrato = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return "";

    const iniciales = getIniciales(cliente.nombre);
    const correlativo = generarCorrelativo();

    return `CT-${iniciales}-${correlativo}`;
  };

  /* 📌 Cargar clientes */
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const res = await getClientes();
        setClientes(res.data ?? res);
      } catch (error) {
        console.error("Error cargando clientes", error);
      }
    };

    if (open) loadClientes();
  }, [open]);

  /* 📌 Manejo de inputs */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // 🔥 Generar número automáticamente
    if (name === "cliente_id") {
      const numero = generarNumeroContrato(value);

      setForm((prev) => ({
        ...prev,
        cliente_id: value,
        numero_contrato: numero,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* 📌 Calcular días */
  const calcularDias = () => {
    if (!form.fecha_inicio || !form.fecha_fin) return 0;

    const inicio = new Date(form.fecha_inicio);
    const fin = new Date(form.fecha_fin);

    const diff = fin.getTime() - inicio.getTime();

    return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
  };

  /* 📌 Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.cliente_id ||
      !form.fecha_inicio ||
      !form.fecha_fin ||
      !form.numero_contrato
    ) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Complete todos los campos",
      });
      return;
    }

    if (calcularDias() <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Fechas inválidas",
        text: "La fecha fin debe ser mayor a la fecha inicio",
      });
      return;
    }

    try {
      setLoading(true);

      console.log("DATA ENVIADA:", form);

      const contrato = await createContrato(form);

      console.log("Contrato creado:", contrato);

      Swal.fire({
        icon: "success",
        title: "Contrato creado",
        text: form.numero_contrato,
        timer: 2000,
        showConfirmButton: false,
      });

      // 🔄 Reset
      setForm({
        numero_contrato: "",
        cliente_id: "",
        fecha_inicio: "",
        fecha_fin: "",
        observaciones: "",
        estado: "ACTIVO",
      });

      onCreated();
      onClose();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message ?? "Error creando contrato",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4">Nuevo Contrato</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 📌 Número contrato */}
          <input
            value={form.numero_contrato}
            readOnly
            placeholder="Número contrato"
            className="w-full border p-2 rounded bg-gray-100"
          />

          {/* 📌 Cliente */}
          <select
            name="cliente_id"
            value={form.cliente_id}
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

          {/* 📌 Fecha inicio */}
          <input
            name="fecha_inicio"
            type="date"
            value={form.fecha_inicio}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* 📌 Fecha fin */}
          <input
            name="fecha_fin"
            type="date"
            value={form.fecha_fin}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* 📌 Días */}
          <p className="text-sm text-gray-500">
            Duración: {calcularDias()} días
          </p>

          {/* 📌 Observación */}
          <input
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            placeholder="Observación"
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

export default CreateContratoModal;
