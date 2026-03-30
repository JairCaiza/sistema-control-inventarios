import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../../services/api";

interface Movimiento {
  id: string;
  activo: string;
  tipo_movimiento: "entrada" | "salida" | "ajuste";
  cantidad: number;
  motivo: string;
  referencia: string | null;
  fecha_creacion: string;
}

function ActivoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  useEffect(() => {
    const loadHistorial = async () => {
      if (!id) return;

      const res = await api.get(`/movimientos/activo/${id}`);
      setMovimientos(res.data.data);
    };
    loadHistorial();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Historial del Activo</h1>

        <button
          onClick={() => navigate("/activos")}
          className="px-4 py-2 border rounded"
        >
          Volver
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Cantidad</th>
              <th className="px-4 py-3 text-left">Motivo</th>
              <th className="px-4 py-3 text-left">Referencia</th>
            </tr>
          </thead>

          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  {new Date(m.fecha_creacion).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  {m.tipo_movimiento === "entrada" && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded">
                      Entrada
                    </span>
                  )}

                  {m.tipo_movimiento === "salida" && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded">
                      Salida
                    </span>
                  )}

                  {m.tipo_movimiento === "ajuste" && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-xs rounded">
                      Ajuste
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">{m.cantidad}</td>

                <td className="px-4 py-3">{m.motivo}</td>

                <td className="px-4 py-3">{m.referencia || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActivoDetallePage;
