import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileDown,
  Plus,
} from "lucide-react";

import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

interface Socio {
  id: string;
  nombre: string;
  identificacion: string;
  tipo: "Activo" | "Inactivo";
  aportes: number;
  porcentaje: number;
  ingreso: string;
  contacto: string;
}

function SociosPage() {
  /* =========================
     DATOS FICTICIOS (MOCK ERP)
  ========================= */

  const socios: Socio[] = [
    {
      id: "SOC-001",
      nombre: "Juan Pérez",
      identificacion: "1712345678",
      tipo: "Activo",
      aportes: 5000,
      porcentaje: 25,
      ingreso: "2025-01-10",
      contacto: "0999999991",
    },
    {
      id: "SOC-002",
      nombre: "María López",
      identificacion: "1723456789",
      tipo: "Activo",
      aportes: 8000,
      porcentaje: 40,
      ingreso: "2024-11-05",
      contacto: "0998888882",
    },
    {
      id: "SOC-003",
      nombre: "Carlos Ramírez",
      identificacion: "1734567890",
      tipo: "Inactivo",
      aportes: 3000,
      porcentaje: 15,
      ingreso: "2023-06-20",
      contacto: "0997777773",
    },
    {
      id: "SOC-004",
      nombre: "Ana Torres",
      identificacion: "1745678901",
      tipo: "Activo",
      aportes: 4000,
      porcentaje: 20,
      ingreso: "2025-03-18",
      contacto: "0996666664",
    },
  ];

  /* =========================
     KPIs
  ========================= */

  const totalSocios = socios.length;

  const activos = socios.filter((s) => s.tipo === "Activo").length;

  const capitalTotal = socios.reduce((acc, s) => acc + s.aportes, 0);

  const promedioAporte = capitalTotal / socios.length;

  /* =========================
     CRUD SIMULADO
  ========================= */

  const handleCreate = () => console.log("Crear socio");
  const handleView = (id: string) => console.log("Ver", id);
  const handleEdit = (id: string) => console.log("Editar", id);
  const handleDelete = (id: string) => console.log("Eliminar", id);

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Socios
          </h1>
          <p className="text-gray-500 mt-1">
            Administración de socios, aportes y participación accionaria.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white">
            <FileDown size={18} />
            Exportar
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white"
          >
            <Plus size={18} />
            Nuevo Socio
          </button>
        </div>
      </div>

      {/* =========================
          KPIs
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Total Socios</p>
          <h2 className="text-2xl font-bold">{totalSocios}</h2>
          <Users className="text-gray-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Activos</p>
          <h2 className="text-2xl font-bold text-green-600">{activos}</h2>
          <TrendingUp className="text-green-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Capital Total</p>
          <h2 className="text-2xl font-bold text-blue-600">
            ${capitalTotal.toLocaleString()}
          </h2>
          <DollarSign className="text-blue-600 mt-2" />
        </div>

        <div className="bg-white border shadow rounded-xl p-5">
          <p className="text-sm text-gray-500">Aporte Promedio</p>
          <h2 className="text-2xl font-bold text-purple-600">
            ${promedioAporte.toFixed(0)}
          </h2>
          <TrendingDown className="text-purple-600 mt-2" />
        </div>
      </div>

      {/* =========================
          FILTROS
      ========================= */}
      <div className="bg-white border shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar socio..."
            className="border px-4 py-2 rounded-lg"
          />

          <select className="border px-4 py-2 rounded-lg">
            <option>Estado</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>

          <input type="date" className="border px-4 py-2 rounded-lg" />

          <button className="border px-4 py-2 rounded-lg hover:bg-gray-100">
            Limpiar
          </button>
        </div>
      </div>

      {/* =========================
          TABLA SOCIOS
      ========================= */}
      <div className="bg-white border shadow rounded-xl overflow-hidden">
        <div className="p-5 border-b flex justify-between">
          <h2 className="font-semibold">Listado de Socios</h2>
          <span className="text-sm text-gray-500">
            {socios.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Identificación</th>
                <th className="p-3 text-left">Contacto</th>
                <th className="p-3 text-right">Aportes</th>
                <th className="p-3 text-right">%</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-left">Ingreso</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {socios.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{s.nombre}</td>
                  <td className="p-3 text-sm">{s.identificacion}</td>
                  <td className="p-3 text-sm">{s.contacto}</td>

                  <td className="p-3 text-right font-semibold text-blue-600">
                    ${s.aportes.toLocaleString()}
                  </td>

                  <td className="p-3 text-right">{s.porcentaje}%</td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        s.tipo === "Activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.tipo}
                    </span>
                  </td>

                  <td className="p-3 text-sm">{s.ingreso}</td>

                  <td className="p-3">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleView(s.id)}>
                        <FaEye />
                      </button>

                      <button onClick={() => handleEdit(s.id)}>
                        <FaEdit />
                      </button>

                      <button onClick={() => handleDelete(s.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          FOOTER
      ========================= */}
      <div className="bg-gray-50 border rounded-xl p-4 text-sm text-gray-600">
        Gestión de socios del sistema ERP (datos ficticios).
      </div>
    </div>
  );
}

export default SociosPage;
