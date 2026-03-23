import { Link } from "react-router-dom";
import logo from "../assets/logoguaraca.png";

function Sidebar() {
  return (
    <aside className="w-64 bg-[var(--color-bg-dark)] text-white flex flex-col">
      {/* LOGO */}
      <div className="flex items-center gap-3 p-5 border-b border-gray-700">
        <img src={logo} className="w-10 h-10 object-contain" />
        <span className="font-bold text-lg">ConstructSys</span>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-4 space-y-2 text-sm">
        <Link
          to="/dashboard"
          className="block p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          Dashboard
        </Link>

        <Link
          to="/inventario"
          className="block p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          Inventario
        </Link>

        <Link
          to="/alquiler"
          className="block p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          Alquiler
        </Link>

        <Link
          to="/ventas"
          className="block p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          Ventas
        </Link>

        <Link
          to="/finanzas"
          className="block p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          Finanzas
        </Link>

        <Link
          to="/personal"
          className="block p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          Personal
        </Link>

        <Link
          to="/socios"
          className="block p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          Socios
        </Link>

        <Link
          to="/reportes"
          className="block p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          Reportes
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
