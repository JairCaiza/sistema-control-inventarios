import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import Swal from "sweetalert2";
import { UserMinus } from "lucide-react";
import EditDesasignacionModal from "../components/modals/EditDesasignacionModal";
import type { Obra } from "../services/obrasService";

import { getObraById } from "../services/obrasService";
import { getControlesDiariosPorObra } from "../services/controlDiarioService";

import CreateAsignacionModal from "../components/modals/CreateAsignacionModal";
import CreateControlDiarioModal from "../components/modals/CreateControlDiarioModal";
import CreatePagoModal from "../components/modals/CreatePagoModal";

import {
  getEmpleadosObra,
  type EmpleadoObra,
} from "../services/empleadosObrasService";

function ObraDetailPage() {
  /* =========================
     PARAMS
  ========================= */
  const { id } = useParams();

  /* =========================
     STATES
  ========================= */
  const [openDesasignacion, setOpenDesasignacion] = useState(false);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
  const [obra, setObra] = useState<Obra | null>(null);

  const [loading, setLoading] = useState(false);

  const [empleadosObra, setEmpleadosObra] = useState<any[]>([]);
  const [controles, setControles] = useState<any[]>([]);

  /* =========================
     MODALS
  ========================= */
  const [openAsignacion, setOpenAsignacion] = useState(false);

  const [controlModalOpen, setControlModalOpen] = useState(false);

  const [openPago, setOpenPago] = useState(false);

  const loadEmpleadosObra = async () => {
    try {
      if (!id) return;

      const data = await getEmpleadosObra(id);

      setEmpleadosObra(data);
    } catch (error) {
      console.error("Error cargando empleados:", error);
    }
  };

  /* =========================
     LOAD OBRA
  ========================= */
  const loadObra = async () => {
    try {
      if (!id) return;

      setLoading(true);

      const data = await getObraById(id);

      setObra(data);
    } catch (error) {
      console.error(error);

      Swal.fire(
        "Error",
        "No se pudo cargar la información de la obra",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  const loadControles = async () => {
    try {
      if (!id) return;

      const data = await getControlesDiariosPorObra(id);
      setControles(data);
    } catch (error) {
      console.error("Error cargando controles:", error);
    }
  };

  useEffect(() => {
    loadObra();
    loadEmpleadosObra();
    loadControles();
  }, [id]);

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">Cargando obra...</div>
    );
  }

  const abrirModalDesasignacion = (empleado: EmpleadoObra) => {
    console.log("Asignación seleccionada:", empleado);
    setEmpleadoSeleccionado(empleado);
    setOpenDesasignacion(true);
  };
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{obra?.nombre}</h1>

            <p className="text-gray-500 mt-1">Código: {obra?.codigo}</p>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm capitalize">
            {obra?.estado?.replace("_", " ")}
          </span>
        </div>

        {/* INFO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {/* UBICACION */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <p className="text-sm text-gray-500">Ubicación</p>

            <h3 className="font-semibold mt-1">
              {obra?.ubicacion || "No registrada"}
            </h3>
          </div>

          {/* PRESUPUESTO */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <p className="text-sm text-gray-500">Presupuesto</p>

            <h3 className="font-semibold mt-1">
              $
              {obra?.presupuesto
                ? Number(obra.presupuesto).toLocaleString()
                : "0"}
            </h3>
          </div>

          {/* FECHA INICIO */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <p className="text-sm text-gray-500">Fecha Inicio</p>

            <h3 className="font-semibold mt-1">
              {obra?.fecha_inicio
                ? obra.fecha_inicio.split("T")[0]
                : "No registrada"}
            </h3>
          </div>

          {/* CLIENTE */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <p className="text-sm text-gray-500">Cliente</p>

            <h3 className="font-semibold mt-1">
              {obra?.cliente_nombre || "No asignado"}
            </h3>
          </div>
        </div>
      </div>

      {/* MODULOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EMPLEADOS */}
        <div className="bg-white rounded-2xl shadow border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Empleados Asignados</h2>

            <button
              onClick={() => setOpenAsignacion(true)}
              className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm hover:opacity-90 transition"
            >
              + Asignar
            </button>
          </div>

          <div className="space-y-3">
            {empleadosObra.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No hay empleados asignados
              </div>
            ) : (
              empleadosObra.map((empleado) => (
                <div
                  key={empleado.id}
                  className="border rounded-xl p-3 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">
                      {empleado.nombres} {empleado.apellidos}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {empleado.cargo_obra}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-600">Activo</span>

                    <button
                      onClick={() => abrirModalDesasignacion(empleado)}
                      className="text-red-600 hover:text-red-800"
                      title="Desasignar empleado"
                    >
                      <UserMinus size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CONTROL DIARIO */}
        <div className="bg-white rounded-2xl shadow border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Control Diario</h2>

            <button
              onClick={() => setControlModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm"
            >
              + Registrar
            </button>
          </div>

          <div className="space-y-3">
            {controles.length === 0 ? (
              <div className="text-center text-gray-500 py-3">
                No hay controles registrados
              </div>
            ) : (
              controles.map((c) => (
                <div key={c.id} className="border rounded-xl p-3">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{c.actividad}</h3>

                    <span className="text-sm text-gray-500">{c.fecha}</span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">{c.descripcion}</p>

                  <div className="text-xs text-gray-400 mt-2 flex gap-2">
                    <span>
                      ⏱ {c.hora_inicio} - {c.hora_fin}
                    </span>
                    <span>📊 {c.avance ?? 0}%</span>
                    <span>🌤 {c.clima || "N/A"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PAGOS */}
        <div className="bg-white rounded-2xl shadow border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Pagos Empleados</h2>

            <button
              onClick={() => setOpenPago(true)}
              className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm"
            >
              + Registrar Pago
            </button>
          </div>

          <div className="space-y-3">
            <div className="border rounded-xl p-3 flex justify-between">
              <div>
                <h3 className="font-medium">Juan Guaraca</h3>

                <p className="text-sm text-gray-500">Semana 1</p>
              </div>

              <span className="font-semibold">$180</span>
            </div>
          </div>
        </div>

        {/* REPORTES */}
        <div className="bg-white rounded-2xl shadow border p-5">
          <h2 className="text-lg font-bold mb-4">Reportes</h2>

          <div className="space-y-3">
            <div className="border rounded-xl p-4">
              <p className="text-sm text-gray-500">Avance General</p>

              <h3 className="text-2xl font-bold mt-2">65%</h3>
            </div>

            <div className="border rounded-xl p-4">
              <p className="text-sm text-gray-500">Gastos Totales</p>

              <h3 className="text-2xl font-bold mt-2">$78,500</h3>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ASIGNACION */}
      <CreateAsignacionModal
        open={openAsignacion}
        obraId={id || ""}
        onClose={() => setOpenAsignacion(false)}
        onAssigned={() => {
          loadEmpleadosObra();
        }}
      />

      {/* MODAL CONTROL */}
      <CreateControlDiarioModal
        open={controlModalOpen}
        onClose={() => setControlModalOpen(false)}
        obraId={id || ""}
        onSuccess={loadControles}
      />

      {/* MODAL PAGOS */}
      <CreatePagoModal open={openPago} onClose={() => setOpenPago(false)} />

      <EditDesasignacionModal
        isOpen={openDesasignacion}
        onClose={() => setOpenDesasignacion(false)}
        asignacionId={empleadoSeleccionado?.id || ""}
        onDesasignado={() => {
          loadEmpleadosObra();
        }}
      />
    </div>
  );
}

export default ObraDetailPage;
