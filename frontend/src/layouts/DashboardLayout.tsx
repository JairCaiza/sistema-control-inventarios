import { Outlet } from "react-router-dom";

function DashboardLayout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          background: "#1e293b",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>Inventario App</h2>

        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>Dashboard</li>
          <li>Productos</li>
          <li>Usuarios</li>
          <li>Reportes</li>
        </ul>
      </aside>

      {/* Contenido */}
      <main style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
