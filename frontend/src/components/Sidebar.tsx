import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  Shield,
  Package,
  FileText,
  BarChart3,
  ChevronDown,
} from "lucide-react";

import logo from "../assets/logoguaraca.png";

function Sidebar() {
  const location = useLocation();

  const [openAdmin, setOpenAdmin] = useState(false);
  const [openInventario, setOpenInventario] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-[var(--color-bg-dark)] text-white flex flex-col">
      {/* LOGO */}

      <div className="flex items-center gap-3 p-5 border-b border-gray-700">
        <img src={logo} className="w-10 h-10 object-contain" />
        <span className="font-bold text-lg">ConstructSys</span>
      </div>

      {/* MENU */}

      <nav className="flex-1 p-4 space-y-2 text-sm">
        {/* DASHBOARD */}

        <Link
          to="/dashboard"
          className={`flex items-center gap-2 p-2 rounded transition
            ${isActive("/dashboard") ? "bg-[var(--color-primary)]" : "hover:bg-[var(--color-primary)]"}
          `}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        {/* ADMINISTRACIÓN */}

        <button
          onClick={() => setOpenAdmin(!openAdmin)}
          className="flex items-center justify-between w-full p-2 rounded hover:bg-[var(--color-primary)]"
        >
          <span className="flex items-center gap-2">
            <Shield size={18} />
            Administración
          </span>

          <ChevronDown
            size={16}
            className={`transition ${openAdmin ? "rotate-180" : ""}`}
          />
        </button>

        {openAdmin && (
          <div className="ml-6 space-y-1">
            <Link
              to="/usuarios"
              className={`flex items-center gap-2 p-2 rounded transition
                ${isActive("/usuarios") ? "bg-[var(--color-primary)]" : "hover:bg-[var(--color-primary)]"}
              `}
            >
              <Users size={16} />
              Usuarios
            </Link>

            <Link
              to="/roles"
              className={`flex items-center gap-2 p-2 rounded transition
                ${isActive("/roles") ? "bg-[var(--color-primary)]" : "hover:bg-[var(--color-primary)]"}
              `}
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
          <span className="flex items-center gap-2">
            <Package size={18} />
            Inventario
          </span>

          <ChevronDown
            size={16}
            className={`transition ${openInventario ? "rotate-180" : ""}`}
          />
        </button>

        {openInventario && (
          <div className="ml-6 space-y-1">
            <Link
              to="/categorias"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Categorías
            </Link>

            <Link
              to="/activos"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Activos
            </Link>

            <Link
              to="/ubicaciones"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Ubicaciones
            </Link>
            <Link
              to="/movimientos"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Movimientos
            </Link>
            <Link
              to="/reportes/inventario"
              className="block p-2 rounded hover:bg-[var(--color-primary)]"
            >
              Reportes
            </Link>
          </div>
        )}

        {/* CONTRATOS */}

        <Link
          to="/contratos"
          className="flex items-center gap-2 p-2 rounded hover:bg-[var(--color-primary)]"
        >
          <FileText size={18} />
          Contratos
        </Link>

        {/* REPORTES */}

        <Link
          to="/reportes"
          className="flex items-center gap-2 p-2 rounded hover:bg-[var(--color-primary)]"
        >
          <BarChart3 size={18} />
          Reportes
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
