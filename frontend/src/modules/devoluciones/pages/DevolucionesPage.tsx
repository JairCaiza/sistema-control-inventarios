// pages/DevolucionesPage.tsx
import { useEffect, useState } from "react";
import { getDevoluciones } from "../services/devolucionService";

import DevolucionesTable from "../components/DevolucionesTable";
import RegistrarDevolucionModal from "../components/RegistrarDevolucionModal";
import type { Devolucion } from "../../../types/devolucion.types";

function DevolucionesPage() {
  const [data, setData] = useState<Devolucion[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [contratoId, setContratoId] = useState<string>("");

  // 🔄 Cargar datos
  const loadData = async () => {
    const res = await getDevoluciones();
    setData(res);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🟢 Abrir modal desde tabla
  const handleOpenModal = (id: string) => {
    setContratoId(id);
    setOpenModal(true);
  };

  // 🔵 Botón general
  const handleNuevaDevolucion = () => {
    if (data.length === 0) return;

    setContratoId(data[0].contrato_id);
    setOpenModal(true);
  };

  return (
    <div className="p-6 bg-[var(--color-white)] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Devoluciones
        </h1>

        {/* Botón */}
        <button
          onClick={handleNuevaDevolucion}
          className="
            px-4 py-2
            rounded-[var(--radius-md)]
            text-white
            font-medium
            shadow-[var(--shadow-soft)]
            transition
            bg-[var(--color-primary)]
            hover:bg-[var(--color-accent)]
          "
        >
          Registrar devolución
        </button>
      </div>

      {/* Contenedor tabla */}
      <div
        className="
          bg-white
          rounded-[var(--radius-lg)]
          shadow-[var(--shadow-soft)]
          border border-[var(--color-border)]
          p-4
        "
      >
        <DevolucionesTable data={data} onRegistrar={handleOpenModal} />
      </div>

      {/* Modal */}
      <RegistrarDevolucionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        contratoId={contratoId}
        onSuccess={loadData}
      />
    </div>
  );
}

export default DevolucionesPage;
