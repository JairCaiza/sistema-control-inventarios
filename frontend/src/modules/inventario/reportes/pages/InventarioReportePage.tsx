import { useEffect, useState } from "react";

import {
  getInventarioReporte,
  exportInventarioPDF,
  exportInventarioExcel,
  type InventarioReporte,
} from "../services/reporteService";

function InventarioReportePage() {
  const [data, setData] = useState<InventarioReporte[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadReporte = async () => {
      const res = await getInventarioReporte();
      console.log("Datos del reporte:", res); // 👈 ver datos en consola
      setData(res);
    };
    loadReporte();
  }, []);

  const filtered = data.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reporte de Inventario</h1>

        <div className="flex gap-3">
          <button
            onClick={exportInventarioPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Exportar PDF
          </button>

          <button
            onClick={exportInventarioExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* BUSCADOR */}

      <input
        placeholder="Buscar activo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-[300px]"
      />

      {/* TABLA */}

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Activo</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Ubicación</th>
              <th className="px-4 py-3 text-left">Stock</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{item.codigo}</td>

                <td className="px-4 py-3">{item.nombre}</td>

                <td className="px-4 py-3">{item.categoria}</td>

                <td className="px-4 py-3">{item.ubicacion}</td>

                <td className="px-4 py-3 font-semibold">
                  {item.cantidad_total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventarioReportePage;
