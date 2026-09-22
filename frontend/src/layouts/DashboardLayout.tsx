import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const abrirSidebarMovil = () => {
    setMobileSidebarOpen(true);
  };

  const cerrarSidebarMovil = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* SIDEBAR */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={cerrarSidebarMovil}
      />

      {/* CONTENIDO */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOPBAR */}
        <Topbar onOpenMobileMenu={abrirSidebarMovil} />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
