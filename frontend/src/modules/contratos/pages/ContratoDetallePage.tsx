import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getContratoById } from "../service/contratoService";
import AddActivoContratoModal from "../components/AddActivoContratoModal";

interface ActivoContrato {
  id: string;
  nombre: string;
  cantidad: number;
  precio_dia: number;
}

interface Contrato {
  id: string;
  cliente: string;
  fecha_inicio: string;
  fecha_fin: string;
  activos: ActivoContrato[];
}

function ContratoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadContrato = async () => {
    if (!id) return;
    const data = await getContratoById(id);
    setContrato(data);
  };

  useEffect(() => {
    loadContrato();
  }, [id]);

  if (!contrato) return <p>Cargando contrato...</p>;

  // Calcular días de contrato
  const dias = Math.ceil(
    (new Date(contrato.fecha_fin).getTime() -
      new Date(contrato.fecha_inicio).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const totalContrato = contrato.activos.reduce(
    (sum, a) => sum + a.cantidad * a.precio_dia * dias,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Información del contrato */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-xl font-bold mb-2">Contrato #{contrato.id}</h2>
        <p>Cliente: {contrato.cliente}</p>
        <p>
          Fecha inicio: {new Date(contrato.fecha_inicio).toLocaleDateString()}
        </p>
        <p>
          Fecha fin: {new Date(contrato.fecha_fin).toLocaleDateString()} (Días:{" "}
          {dias})
        </p>
      </div>

      {/* Tabla activos */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">Activos del contrato</h3>
          <button
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
            onClick={() => setModalOpen(true)}
          >
            + Agregar activo
          </button>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 border">Activo</th>
              <th className="px-4 py-2 border">Cantidad</th>
              <th className="px-4 py-2 border">Precio día</th>
              <th className="px-4 py-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {contrato.activos.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{a.nombre}</td>
                <td className="px-4 py-2 border">{a.cantidad}</td>
                <td className="px-4 py-2 border">${a.precio_dia}</td>
                <td className="px-4 py-2 border">
                  ${a.cantidad * a.precio_dia * dias}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right font-bold mt-3">
          Total contrato: ${totalContrato}
        </div>
      </div>

      <AddActivoContratoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contratoId={contrato.id}
        onAgregado={loadContrato}
      />
    </div>
  );
}

export default ContratoDetallePage;
