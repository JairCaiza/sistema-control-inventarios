import { useState } from "react";

function EmpleadoDetailPage() {
  const [tab, setTab] = useState<"info" | "obras" | "pagos" | "actividad">(
    "info",
  );

  /* =========================
     DATOS SIMULADOS
  ========================= */
  const empleado = {
    id: "1",
    nombres: "Juan",
    apellidos: "Guaraca",
    cedula: "0601234567",
    telefono: "0999999999",
    correo: "juan@gmail.com",
    cargo: "Maestro de obra",
    tipo_pago: "semanal",
    activo: true,
  };

  const obrasAsignadas = [
    {
      id: "o1",
      obra: "Edificio Central Norte",
      clasificacion: "maestro",
      fecha: "2026-05-10",
      activo: true,
    },
    {
      id: "o2",
      obra: "Centro Comercial Sur",
      clasificacion: "contratista",
      fecha: "2026-04-01",
      activo: true,
    },
  ];

  const pagos = [
    {
      id: "p1",
      obra: "Edificio Central Norte",
      monto: 180,
      fecha: "2026-05-12",
    },
    {
      id: "p2",
      obra: "Centro Comercial Sur",
      monto: 150,
      fecha: "2026-05-05",
    },
  ];

  const actividades = [
    {
      id: "a1",
      obra: "Edificio Central Norte",
      actividad: "Fundición de columnas",
      horas: 8,
      pago: 45,
    },
    {
      id: "a2",
      obra: "Centro Comercial Sur",
      actividad: "Instalación eléctrica",
      horas: 6,
      pago: 30,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ========================= HEADER ========================= */}
      <div className="bg-white border rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {empleado.nombres} {empleado.apellidos}
        </h1>

        <p className="text-gray-500 mt-1">{empleado.cargo}</p>

        <div className="mt-3 flex gap-2">
          <span className="text-sm text-gray-600">CI: {empleado.cedula}</span>

          <span
            className={`px-2 py-1 text-xs rounded ${
              empleado.activo
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {empleado.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* ========================= TABS ========================= */}
      <div className="flex gap-3 border-b">
        <button
          onClick={() => setTab("info")}
          className={`px-4 py-2 ${
            tab === "info" ? "border-b-2 border-blue-500 font-semibold" : ""
          }`}
        >
          Información
        </button>

        <button
          onClick={() => setTab("obras")}
          className={`px-4 py-2 ${
            tab === "obras" ? "border-b-2 border-blue-500 font-semibold" : ""
          }`}
        >
          Obras
        </button>

        <button
          onClick={() => setTab("pagos")}
          className={`px-4 py-2 ${
            tab === "pagos" ? "border-b-2 border-blue-500 font-semibold" : ""
          }`}
        >
          Pagos
        </button>

        <button
          onClick={() => setTab("actividad")}
          className={`px-4 py-2 ${
            tab === "actividad"
              ? "border-b-2 border-blue-500 font-semibold"
              : ""
          }`}
        >
          Actividad
        </button>
      </div>

      {/* ========================= CONTENIDO ========================= */}

      {/* INFO */}
      {tab === "info" && (
        <div className="bg-white border rounded-2xl p-5 grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Teléfono</p>
            <p className="font-medium">{empleado.telefono}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Correo</p>
            <p className="font-medium">{empleado.correo}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Cargo</p>
            <p className="font-medium">{empleado.cargo}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Tipo de pago</p>
            <p className="font-medium capitalize">{empleado.tipo_pago}</p>
          </div>
        </div>
      )}

      {/* OBRAS */}
      {tab === "obras" && (
        <div className="bg-white border rounded-2xl p-5 space-y-3">
          {obrasAsignadas.map((o) => (
            <div
              key={o.id}
              className="border rounded-xl p-3 flex justify-between"
            >
              <div>
                <h3 className="font-medium">{o.obra}</h3>
                <p className="text-sm text-gray-500 capitalize">
                  {o.clasificacion}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm">{o.fecha}</p>

                <span
                  className={`text-xs ${
                    o.activo ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {o.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGOS */}
      {tab === "pagos" && (
        <div className="bg-white border rounded-2xl p-5 space-y-3">
          {pagos.map((p) => (
            <div
              key={p.id}
              className="border rounded-xl p-3 flex justify-between"
            >
              <div>
                <h3 className="font-medium">{p.obra}</h3>
                <p className="text-sm text-gray-500">{p.fecha}</p>
              </div>

              <span className="font-bold text-green-600">${p.monto}</span>
            </div>
          ))}
        </div>
      )}

      {/* ACTIVIDAD */}
      {tab === "actividad" && (
        <div className="bg-white border rounded-2xl p-5 space-y-3">
          {actividades.map((a) => (
            <div key={a.id} className="border rounded-xl p-3">
              <div className="flex justify-between">
                <h3 className="font-medium">{a.actividad}</h3>
                <span className="text-sm text-gray-500">{a.obra}</span>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                Horas: {a.horas} | Pago: ${a.pago}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmpleadoDetailPage;
