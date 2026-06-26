import { useEffect, useState } from "react";

import {
  getHistorialActivo,
  type Movimiento,
} from "../../movimientos/services/movimientoService";

interface Props {
  open: boolean;

  activoId: string | null;

  onClose: () => void;
}

function ActivoDetalleModal({ open, activoId, onClose }: Props) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const [loading, setLoading] = useState(false);

  /* =========================
     CARGAR HISTORIAL
  ========================= */

  useEffect(() => {
    const loadHistorial = async () => {
      try {
        if (!activoId) return;

        setLoading(true);

        const data = await getHistorialActivo(activoId);

        setMovimientos(data);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadHistorial();
    }
  }, [open, activoId]);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0
        bg-black/40
        flex items-center
        justify-center
        z-50
      "
    >
      <div
        className="
          bg-white
          w-[900px]
          max-h-[85vh]
          overflow-auto
          rounded-lg
          shadow-lg
          p-6
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            justify-between
            items-center
            mb-4
          "
        >
          <h2 className="text-2xl font-bold">Historial del Activo</h2>

          <button
            onClick={onClose}
            className="
              px-4 py-2
              border rounded
              hover:bg-gray-100
            "
          >
            Cerrar
          </button>
        </div>

        {/* LOADING */}

        {loading && <p className="text-gray-500">Cargando historial...</p>}

        {/* TABLA */}

        {!loading && (
          <div
            className="
              border
              rounded-lg
              overflow-hidden
            "
          >
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
                  <tr
                    key={m.id}
                    className="
                      border-t
                      hover:bg-gray-50
                    "
                  >
                    {/* FECHA */}

                    <td className="px-4 py-3">
                      {new Date(m.fecha_creacion).toLocaleString()}
                    </td>

                    {/* TIPO */}

                    <td className="px-4 py-3">
                      {m.tipo_movimiento === "entrada" && (
                        <span
                          className="
                            bg-green-100
                            text-green-700
                            px-2 py-1
                            text-xs
                            rounded
                          "
                        >
                          Entrada
                        </span>
                      )}

                      {m.tipo_movimiento === "salida" && (
                        <span
                          className="
                            bg-red-100
                            text-red-700
                            px-2 py-1
                            text-xs
                            rounded
                          "
                        >
                          Salida
                        </span>
                      )}

                      {m.tipo_movimiento === "ajuste" && (
                        <span
                          className="
                            bg-yellow-100
                            text-yellow-700
                            px-2 py-1
                            text-xs
                            rounded
                          "
                        >
                          Ajuste
                        </span>
                      )}
                    </td>

                    {/* CANTIDAD */}

                    <td className="px-4 py-3">{m.cantidad}</td>

                    {/* MOTIVO */}

                    <td className="px-4 py-3">{m.motivo}</td>

                    {/* REFERENCIA */}

                    <td className="px-4 py-3">{m.referencia || "-"}</td>
                  </tr>
                ))}

                {movimientos.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="
                        text-center
                        py-6
                        text-gray-500
                      "
                    >
                      No existen movimientos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivoDetalleModal;
