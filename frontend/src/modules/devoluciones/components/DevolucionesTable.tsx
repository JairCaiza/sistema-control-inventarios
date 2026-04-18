import { descargarNotaPDF } from "../services/devolucionService";
import type { Devolucion } from "../../../types/devolucion.types";

interface Props {
  data: Devolucion[];
}

function DevolucionesTable({ data }: Props) {
  const API_URL = import.meta.env.VITE_API_URL;

  /* 🔥 Descargar PDF con token */
  const handleDownloadNota = async (notaId: string) => {
    try {
      const blob = await descargarNotaPDF(notaId);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nota-${notaId}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando nota", error);
    }
  };

  return (
    <div
      className="
        bg-white
        rounded-[var(--radius-lg)]
        shadow-[var(--shadow-soft)]
        border border-[var(--color-border)]
        p-4
      "
    >
      <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
        Devoluciones
      </h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-[var(--text-secondary)]">
            <th className="p-2">Contrato</th>
            <th className="p-2">Cliente</th>
            <th className="p-2">Fecha</th>
            <th className="p-2">Retraso</th>
            <th className="p-2">Penalidad</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center p-4 text-[var(--text-muted)]"
              >
                No hay devoluciones
              </td>
            </tr>
          ) : (
            data.map((d) => (
              <tr
                key={d.id}
                className="border-b border-[var(--color-border)] hover:bg-gray-50 transition"
              >
                {/* 📄 Contrato */}
                <td className="p-2 font-medium text-[var(--text-primary)]">
                  {d.numero_contrato}
                </td>

                {/* 👤 Cliente */}
                <td className="p-2 text-[var(--text-secondary)]">
                  {d.cliente}
                </td>

                {/* 📅 Fecha */}
                <td className="p-2 text-[var(--text-secondary)]">
                  {new Date(d.fecha_devolucion).toLocaleDateString()}
                </td>

                {/* ⏱ Retraso */}
                <td className="p-2">
                  <span
                    className={`
                      px-2 py-1 text-xs rounded
                      ${
                        d.dias_retraso > 0
                          ? "bg-[var(--color-error)] text-white"
                          : "bg-[var(--color-accent)] text-black"
                      }
                    `}
                  >
                    {d.dias_retraso} días
                  </span>
                </td>

                {/* 💰 Penalidad */}
                <td className="p-2">
                  <span
                    className={`
                      px-2 py-1 text-xs rounded
                      ${
                        d.penalidad_total > 0
                          ? "bg-[var(--color-error)] text-white"
                          : "bg-gray-100 text-[var(--text-secondary)]"
                      }
                    `}
                  >
                    ${Number(d.penalidad_total).toFixed(2)}
                  </span>
                </td>

                {/* ⚙️ Acciones */}
                <td className="p-2 flex gap-2 flex-wrap">
                  {/* 📄 PDF contrato (este sí puede quedarse si no es protegido) */}
                  <a
                    href={`${API_URL}/contratos/${d.contrato_id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      text-xs px-3 py-1
                      rounded-[var(--radius-sm)]
                      text-white
                      bg-[var(--color-info)]
                      hover:opacity-90
                      transition
                    "
                  >
                    Contrato
                  </a>

                  {/* 🧾 NOTA DE VENTA (🔥 con token) */}
                  {d.nota_id && (
                    <button
                      onClick={() => d.nota_id && handleDownloadNota(d.nota_id)}
                      className="
                        text-xs px-3 py-1
                        rounded-[var(--radius-sm)]
                        text-white
                        bg-green-600
                        hover:opacity-90
                        transition
                      "
                    >
                      Nota de Venta
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DevolucionesTable;
