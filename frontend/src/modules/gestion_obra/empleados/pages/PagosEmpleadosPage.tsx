import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  FileDown,
  DollarSign,
  Users,
  CalendarDays,
  Wallet,
  Building2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface PagoEmpleado {
  id: string;
  fecha: string;
  empleado: string;
  cedula: string;
  cargo: string;
  obra?: string;
  tipo_pago: "diario" | "semanal" | "mensual";
  periodo: string;
  monto: number;
  cuenta: string;
  descripcion: string;
  estado: "Pagado" | "Pendiente" | "Anulado";
}

function PagosEmpleadosPage() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTipoPago, setFiltroTipoPago] = useState("Todos");

  const pagos: PagoEmpleado[] = [
    {
      id: "PAG-001",
      fecha: "2026-06-22",
      empleado: "Juan Guaraca",
      cedula: "0601234567",
      cargo: "Maestro de obra",
      obra: "Construcción Bodega Norte",
      tipo_pago: "semanal",
      periodo: "Semana 3 - Junio 2026",
      monto: 180,
      cuenta: "Caja General",
      descripcion: "Pago semanal por avance de obra",
      estado: "Pagado",
    },
    {
      id: "PAG-002",
      fecha: "2026-06-21",
      empleado: "Carlos Daquilema",
      cedula: "0607654321",
      cargo: "Operario",
      obra: "Ampliación Local Comercial",
      tipo_pago: "diario",
      periodo: "Jornada 21/06/2026",
      monto: 35,
      cuenta: "Caja Chica",
      descripcion: "Pago diario por jornada de trabajo",
      estado: "Pagado",
    },
    {
      id: "PAG-003",
      fecha: "2026-06-20",
      empleado: "María Guamán",
      cedula: "0609988776",
      cargo: "Administrativa",
      tipo_pago: "mensual",
      periodo: "Junio 2026",
      monto: 650,
      cuenta: "Banco Pichincha",
      descripcion: "Pago mensual administrativo",
      estado: "Pendiente",
    },
  ];

  const pagosFiltrados = useMemo(() => {
    return pagos.filter((pago) => {
      const matchSearch =
        pago.empleado.toLowerCase().includes(search.toLowerCase()) ||
        pago.cedula.toLowerCase().includes(search.toLowerCase()) ||
        pago.cargo.toLowerCase().includes(search.toLowerCase()) ||
        pago.obra?.toLowerCase().includes(search.toLowerCase()) ||
        pago.descripcion.toLowerCase().includes(search.toLowerCase());

      const matchEstado =
        filtroEstado === "Todos" || pago.estado === filtroEstado;

      const matchTipoPago =
        filtroTipoPago === "Todos" || pago.tipo_pago === filtroTipoPago;

      return matchSearch && matchEstado && matchTipoPago;
    });
  }, [search, filtroEstado, filtroTipoPago]);

  const resumen = useMemo(() => {
    const totalPagado = pagosFiltrados
      .filter((p) => p.estado === "Pagado")
      .reduce((acc, p) => acc + p.monto, 0);

    const totalPendiente = pagosFiltrados
      .filter((p) => p.estado === "Pendiente")
      .reduce((acc, p) => acc + p.monto, 0);

    const empleadosPagados = new Set(pagosFiltrados.map((p) => p.empleado))
      .size;

    const pagosObra = pagosFiltrados.filter((p) => p.obra).length;

    return {
      totalPagado,
      totalPendiente,
      empleadosPagados,
      pagosObra,
    };
  }, [pagosFiltrados]);

  const getEstadoClass = (estado: PagoEmpleado["estado"]) => {
    if (estado === "Pagado") return "bg-green-100 text-green-700";
    if (estado === "Pendiente") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getEstadoIcon = (estado: PagoEmpleado["estado"]) => {
    if (estado === "Pagado") return <CheckCircle size={15} />;
    if (estado === "Pendiente") return <Clock size={15} />;
    return <AlertTriangle size={15} />;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pagos Empleados</h1>
          <p className="text-gray-500 mt-1">
            Registro y control de pagos al personal con trazabilidad financiera.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
            <FileDown size={18} />
            Exportar PDF
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition">
            <Plus size={18} />
            Nuevo Pago
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total pagado</p>
              <h2 className="text-3xl font-bold mt-2">
                ${resumen.totalPagado.toLocaleString()}
              </h2>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pendiente por pagar</p>
              <h2 className="text-3xl font-bold mt-2">
                ${resumen.totalPendiente.toLocaleString()}
              </h2>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Wallet className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Empleados registrados</p>
              <h2 className="text-3xl font-bold mt-2">
                {resumen.empleadosPagados}
              </h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pagos vinculados a obra</p>
              <h2 className="text-3xl font-bold mt-2">{resumen.pagosObra}</h2>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Building2 className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empleado, cédula, cargo, obra o descripción..."
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option>Todos</option>
            <option>Pagado</option>
            <option>Pendiente</option>
            <option>Anulado</option>
          </select>

          <select
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={filtroTipoPago}
            onChange={(e) => setFiltroTipoPago(e.target.value)}
          >
            <option>Todos</option>
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Registro de pagos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cada pago confirmado debe generar automáticamente un egreso en
            transacciones.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Empleado
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Obra
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Periodo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Cuenta
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Monto
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {pagosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No hay pagos registrados
                  </td>
                </tr>
              )}

              {pagosFiltrados.map((pago) => (
                <tr
                  key={pago.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays size={16} className="text-gray-400" />
                      {pago.fecha}
                    </div>
                    <p className="text-xs text-gray-500">{pago.id}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{pago.empleado}</p>
                    <p className="text-xs text-gray-500">
                      {pago.cedula} · {pago.cargo}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">
                      {pago.obra || "No vinculado"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Tipo pago: {pago.tipo_pago}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{pago.periodo}</p>
                    <p className="text-xs text-gray-500">{pago.descripcion}</p>
                  </td>

                  <td className="px-4 py-3 text-sm">{pago.cuenta}</td>

                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    -${pago.monto.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoClass(
                        pago.estado,
                      )}`}
                    >
                      {getEstadoIcon(pago.estado)}
                      {pago.estado}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-3">
                      <button
                        className="text-cyan-600 hover:scale-110 transition"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        className="text-blue-600 hover:scale-110 transition"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        className="text-red-600 hover:scale-110 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL INFERIOR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Distribución por tipo de pago
          </h2>

          <div className="space-y-4">
            {["diario", "semanal", "mensual"].map((tipo) => {
              const total = pagosFiltrados
                .filter((p) => p.tipo_pago === tipo)
                .reduce((acc, p) => acc + p.monto, 0);

              const totalGeneral = resumen.totalPagado + resumen.totalPendiente;

              const porcentaje =
                totalGeneral > 0 ? (total / totalGeneral) * 100 : 0;

              return (
                <div key={tipo}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-700 capitalize">
                      {tipo}
                    </span>
                    <span className="font-semibold">
                      ${total.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-[var(--color-primary)] h-3 rounded-full"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Reglas ERP de nómina
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="font-semibold text-red-800">
                Pago confirmado = egreso automático
              </p>
              <p className="text-sm text-red-700">
                Al registrar un pago, el backend debe crear una transacción tipo
                egreso.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-800">
                Vinculación con obra
              </p>
              <p className="text-sm text-blue-700">
                Si el pago pertenece a una obra, debe guardar obra_id para
                calcular rentabilidad.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="font-semibold text-green-800">
                Trazabilidad financiera
              </p>
              <p className="text-sm text-green-700">
                Usa origen_modulo = pagos_empleados y origen_id = id del pago en
                transacciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PagosEmpleadosPage;
