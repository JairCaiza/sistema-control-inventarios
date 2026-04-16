// pages/DevolucionesPage.tsx
import { useEffect, useState } from "react";
import { getDevoluciones } from "../services/devolucionService";

import DevolucionesTable from "../components/DevolucionesTable";

function DevolucionesPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await getDevoluciones();
      setData(res);
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <DevolucionesTable data={data} />
    </div>
  );
}

export default DevolucionesPage;
