// components/DevolucionesTable.tsx

interface Props {
  data: any[];
}

function DevolucionesTable({ data }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold mb-4">Devoluciones</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Contrato</th>
            <th className="p-2">Cliente</th>
            <th className="p-2">Fecha</th>
            <th className="p-2">Retraso</th>
            <th className="p-2">Penalidad</th>
            <th className="p-2">PDF</th> {/* 🔥 HU-24 */}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center p-4 text-gray-500">
                No hay devoluciones
              </td>
            </tr>
          ) : (
            data.map((d) => (
              <tr key={d.id} className="border-b hover:bg-gray-50">
                {/* 📄 Contrato */}
                <td className="p-2 font-medium">{d.numero_contrato}</td>

                {/* 👤 Cliente */}
                <td className="p-2">{d.cliente}</td>

                {/* 📅 Fecha formateada */}
                <td className="p-2">
                  {new Date(d.fecha_devolucion).toLocaleDateString()}
                </td>

                {/* ⏱ Retraso */}
                <td
                  className={`p-2 ${
                    d.dias_retraso > 0
                      ? "text-red-500 font-semibold"
                      : "text-green-600"
                  }`}
                >
                  {d.dias_retraso} días
                </td>

                {/* 💰 Penalidad */}
                <td
                  className={`p-2 ${
                    d.penalidad_total > 0
                      ? "text-red-500 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  ${Number(d.penalidad_total).toFixed(2)}
                </td>

                {/* 📄 PDF */}
                <td className="p-2">
                  <a
                    href={`/api/contratos/${d.contrato_id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Ver PDF
                  </a>
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
