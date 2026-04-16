import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Users,
  Shield,
  Package,
  FileText,
  BarChart3,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import logo from "../assets/logoguaraca.png";

function Sidebar() {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);
  const [openInventario, setOpenInventario] = useState(false);

  /* guardar estado sidebar */
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved) setCollapsed(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-[var(--color-bg-dark)] text-white flex flex-col transition-all duration-300`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <img src={logo} className="w-10 h-10 object-contain" />
          {!collapsed && (
            <span className="font-bold text-lg">ConstructSys</span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-300 hover:text-white"
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-3 space-y-2 text-sm">
        {/* DASHBOARD */}
        <Link
          to="/dashboard"
          title="Dashboard"
          className={`flex items-center gap-3 p-2 rounded transition
          ${
            isActive("/dashboard")
              ? "bg-[var(--color-primary)]"
              : "hover:bg-[var(--color-primary)]"
          }`}
        >
          <LayoutDashboard size={18} />
          {!collapsed && "Dashboard"}
        </Link>

        {/* ADMINISTRACION */}
        <button
          onClick={() => setOpenAdmin(!openAdmin)}
          className="flex items-center justify-between w-full p-2 rounded hover:bg-[var(--color-primary)]"
        >
          <span className="flex items-center gap-3">
            <Shield size={18} />
            {!collapsed && "Administración"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`transition ${openAdmin ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {openAdmin && !collapsed && (
          <div className="ml-6 space-y-1">
            <Link
              to="/dashboard/usuarios"
              className={`flex items-center gap-2 p-2 rounded transition
              ${
                isActive("/dashboard/usuarios")
                  ? "bg-[var(--color-primary)]"
                  : "hover:bg-[var(--color-primary)]"
              }`}
            >
              <Users size={16} />
              Usuarios
            </Link>

            <Link
              to="/dashboard/roles"
              className={`flex items-center gap-2 p-2 rounded transition
              ${
                isActive("/dashboard/roles")
                  ? "bg-[var(--color-primary)]"
                  : "hover:bg-[var(--color-primary)]"
              }`}
            >
              <Shield size={16} />
              Roles
            </Link>
          </div>
        )}

        {/* INVENTARIO */}
        <button
          onClick={() => setOpenInventario(!openInventario)}
          className="flex items-center justify-between w-full p-2 rounded hover:bg-[var(--color-primary)]"
        >
          <span className="flex items-center gap-3">
            <Package size={18} />
            {!collapsed && "Inventario"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`transition ${openInventario ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {openInventario && !collapsed && (
          <div className="ml-6 space-y-1">
            <Link
              to="/dashboard/categorias"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Categorías
            </Link>

            <Link
              to="/dashboard/activos"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Activos
            </Link>

            <Link
              to="/dashboard/ubicaciones"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Ubicaciones
            </Link>

            <Link
              to="/dashboard/movimientos"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Movimientos
            </Link>

            <Link
              to="/dashboard/reportes/inventario"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Reportes
            </Link>
          </div>
        )}
        {/* CLIENTES */}
        <Link
          to="clientes"
          title="Contratos"
          className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-primary)]"
        >
          <FileText size={18} />
          {!collapsed && "Clientes"}
        </Link>
        {/* CONTRATOS */}
        <Link
          to="/dashboard/contratos"
          title="Contratos"
          className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-primary)]"
        >
          <FileText size={18} />
          {!collapsed && "Contratos"}
        </Link>

        {/* REPORTES */}
        <Link
          to="/dashboard/devoluciones"
          title="Reportes"
          className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-primary)]"
        >
          <BarChart3 size={18} />
          {!collapsed && "Devoluciones"}
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
