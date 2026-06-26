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
  Hammer,
  HardHat,
  ClipboardList,
  Wallet,
  Landmark,
  HandCoins,
  Receipt,
  TrendingUp,
  ArrowLeftRight,
  DollarSign,
  CalendarDays,
  Lock,
} from "lucide-react";

import logo from "../assets/logoguaraca.png";

function Sidebar() {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  /* =========================
     MENÚS DESPLEGABLES
  ========================= */
  const [openAdmin, setOpenAdmin] = useState(false);

  const [openInventario, setOpenInventario] = useState(false);

  const [openObras, setOpenObras] = useState(false);

  // NUEVOS
  const [openFinanzas, setOpenFinanzas] = useState(false);

  const [openPersonal, setOpenPersonal] = useState(false);

  const [openSocios, setOpenSocios] = useState(false);

  /* =========================
     GUARDAR ESTADO SIDEBAR
  ========================= */
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");

    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-64"}
      h-screen
      overflow-y-auto
      bg-[var(--color-bg-dark)]
      text-white
      flex
      flex-col
      transition-all
      duration-300
      shadow-lg`}
    >
      {/* =========================
         HEADER
      ========================= */}
      <div
        className="
          flex
          items-center
          justify-between
          p-4
          border-b
          border-gray-700
          sticky
          top-0
          bg-[var(--color-bg-dark)]
          z-10
        "
      >
        <div className="flex items-center gap-2">
          <img src={logo} className="w-10 h-10 object-contain" />

          {!collapsed && (
            <span className="font-bold text-lg">ConstructSys</span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            text-gray-300
            hover:text-white
            transition
          "
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      {/* =========================
         MENÚ
      ========================= */}
      <nav className="flex-1 p-3 space-y-2 text-sm">
        {/* =========================
           DASHBOARD
        ========================= */}
        <Link
          to="/dashboard"
          title="Dashboard"
          className={`
            flex
            items-center
            gap-3
            p-2
            rounded
            transition
            ${
              isActive("/dashboard")
                ? "bg-[var(--color-primary)]"
                : "hover:bg-[var(--color-primary)]"
            }
          `}
        >
          <LayoutDashboard size={18} />

          {!collapsed && "Dashboard"}
        </Link>

        {/* =========================
           ADMINISTRACIÓN
        ========================= */}
        <button
          onClick={() => setOpenAdmin(!openAdmin)}
          className="
            flex
            items-center
            justify-between
            w-full
            p-2
            rounded
            hover:bg-[var(--color-primary)]
            transition
          "
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
              className={`
                flex
                items-center
                gap-2
                p-2
                rounded
                transition
                ${
                  isActive("/dashboard/usuarios")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }
              `}
            >
              <Users size={16} />
              Usuarios
            </Link>

            <Link
              to="/dashboard/roles"
              className={`
                flex
                items-center
                gap-2
                p-2
                rounded
                transition
                ${
                  isActive("/dashboard/roles")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }
              `}
            >
              <Shield size={16} />
              Roles
            </Link>
          </div>
        )}

        {/* =========================
           INVENTARIO
        ========================= */}
        <button
          onClick={() => setOpenInventario(!openInventario)}
          className="
            flex
            items-center
            justify-between
            w-full
            p-2
            rounded
            hover:bg-[var(--color-primary)]
            transition
          "
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
              className="
                block
                p-2
                rounded
                hover:bg-[var(--color-primary)]
                transition
              "
            >
              Categorías
            </Link>

            <Link
              to="/dashboard/activos"
              className="
                block
                p-2
                rounded
                hover:bg-[var(--color-primary)]
                transition
              "
            >
              Activos
            </Link>

            <Link
              to="/dashboard/ubicaciones"
              className="
                block
                p-2
                rounded
                hover:bg-[var(--color-primary)]
                transition
              "
            >
              Ubicaciones
            </Link>

            <Link
              to="/dashboard/movimientos"
              className="
                block
                p-2
                rounded
                hover:bg-[var(--color-primary)]
                transition
              "
            >
              Movimientos
            </Link>

            <Link
              to="/dashboard/reportes/inventario"
              className="
                block
                p-2
                rounded
                hover:bg-[var(--color-primary)]
                transition
              "
            >
              Reportes
            </Link>
          </div>
        )}
        {/* =========================
           CLIENTES
        ========================= */}
        <Link
          to="/dashboard/clientes"
          title="Clientes"
          className={`flex items-center gap-3 p-2 rounded transition
            ${
              isActive("/dashboard/clientes")
                ? "bg-[var(--color-primary)]"
                : "hover:bg-[var(--color-primary)]"
            }`}
        >
          <FileText size={18} />

          {!collapsed && "Clientes"}
        </Link>

        {/* =========================
           CONTRATOS
        ========================= */}
        <Link
          to="/dashboard/contratos"
          title="Contratos"
          className={`flex items-center gap-3 p-2 rounded transition
            ${
              isActive("/dashboard/contratos")
                ? "bg-[var(--color-primary)]"
                : "hover:bg-[var(--color-primary)]"
            }`}
        >
          <FileText size={18} />

          {!collapsed && "Contratos"}
        </Link>

        {/* =========================
           DEVOLUCIONES
        ========================= */}
        <Link
          to="/dashboard/devoluciones"
          title="Devoluciones"
          className={`flex items-center gap-3 p-2 rounded transition
            ${
              isActive("/dashboard/devoluciones")
                ? "bg-[var(--color-primary)]"
                : "hover:bg-[var(--color-primary)]"
            }`}
        >
          <BarChart3 size={18} />

          {!collapsed && "Devoluciones"}
        </Link>

        {/* =========================
           GESTIÓN OBRAS
        ========================= */}
        <button
          onClick={() => setOpenObras(!openObras)}
          className="flex items-center justify-between w-full p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          <span className="flex items-center gap-3">
            <Hammer size={18} />

            {!collapsed && "Gestión Obras"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`transition ${openObras ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {openObras && !collapsed && (
          <div className="ml-6 space-y-1">
            <Link
              to="/dashboard/empleados"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/empleados")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <Users size={16} />
              Empleados
            </Link>

            <Link
              to="/dashboard/obras"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/obras")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <HardHat size={16} />
              Obras
            </Link>

            <Link
              to="/dashboard/control-diario"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/control-diario")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <ClipboardList size={16} />
              Control Diario
            </Link>

            <Link
              to="/dashboard/gastos-obra"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/gastos-obra")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <Receipt size={16} />
              Gastos Obra
            </Link>

            <Link
              to="/dashboard/reporte-gastos-obra"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/reporte-gastos-obra")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <BarChart3 size={16} />
              Reportes Obras
            </Link>
          </div>
        )}

        {/* =========================
           FINANZAS
        ========================= */}
        <button
          onClick={() => setOpenFinanzas(!openFinanzas)}
          className="flex items-center justify-between w-full p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          <span className="flex items-center gap-3">
            <Landmark size={18} />

            {!collapsed && "Finanzas"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`transition ${openFinanzas ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {openFinanzas && !collapsed && (
          <div className="ml-6 space-y-1">
            <Link
              to="/dashboard/dashboardfinanciero"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/dashboardfinanciero")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <LayoutDashboard size={16} />
              Dashboard Financiero
            </Link>

            <Link
              to="/dashboard/cuentas"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/cuentas")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <Wallet size={16} />
              Cuentas
            </Link>

            <Link
              to="/dashboard/ingresos"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/ingresos")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <DollarSign size={16} />
              Ingresos
            </Link>

            <Link
              to="/dashboard/egresos"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/egresos")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <Receipt size={16} />
              Egresos
            </Link>

            <Link
              to="/dashboard/transferencias"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/transferencias")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <ArrowLeftRight size={16} />
              Transferencias
            </Link>

            <Link
              to="/dashboard/flujo-de-caja"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/flujo-de-caja")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <TrendingUp size={16} />
              Flujo Caja
            </Link>

            <Link
              to="/dashboard/utilidadmensual"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/utilidadmensual")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <BarChart3 size={16} />
              Utilidad Mensual
            </Link>

            <Link
              to="/dashboard/cierres"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/cierres")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <CalendarDays size={16} />
              Cierres
            </Link>

            <Link
              to="/dashboard/periodos"
              className={`flex items-center gap-2 p-2 rounded transition
                ${
                  isActive("/dashboard/periodos")
                    ? "bg-[var(--color-primary)]"
                    : "hover:bg-[var(--color-primary)]"
                }`}
            >
              <Lock size={16} />
              Periodos
            </Link>
          </div>
        )}
        {/* =========================
           PERSONAL
        ========================= */}
        <button
          onClick={() => setOpenPersonal(!openPersonal)}
          className="flex items-center justify-between w-full p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          <span className="flex items-center gap-3">
            <Wallet size={18} />

            {!collapsed && "Personal"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`transition ${openPersonal ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {openPersonal && !collapsed && (
          <div className="ml-6 space-y-1">
            <Link
              to="/dashboard/pagos-empleados"
              className={`flex items-center gap-2 p-2 rounded transition ${
                isActive("/dashboard/pagos-empleados")
                  ? "bg-[var(--color-primary)]"
                  : "hover:bg-[var(--color-primary)]"
              }`}
            >
              <Wallet size={16} />
              Pagos Empleados
            </Link>

            <Link
              to="/dashboard/reportes-empleados"
              className={`flex items-center gap-2 p-2 rounded transition ${
                isActive("/dashboard/reportes-empleados")
                  ? "bg-[var(--color-primary)]"
                  : "hover:bg-[var(--color-primary)]"
              }`}
            >
              <BarChart3 size={16} />
              Reportes Personal
            </Link>
          </div>
        )}

        {/* =========================
           SOCIOS
        ========================= */}
        <button
          onClick={() => setOpenSocios(!openSocios)}
          className="flex items-center justify-between w-full p-2 rounded hover:bg-[var(--color-primary)] transition"
        >
          <span className="flex items-center gap-3">
            <HandCoins size={18} />

            {!collapsed && "Socios"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`transition ${openSocios ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {openSocios && !collapsed && (
          <div className="ml-6 space-y-1">
            <Link
              to="/dashboard/socios"
              className={`flex items-center gap-2 p-2 rounded transition ${
                isActive("/dashboard/socios")
                  ? "bg-[var(--color-primary)]"
                  : "hover:bg-[var(--color-primary)]"
              }`}
            >
              <Users size={16} />
              Socios
            </Link>

            <Link
              to="/dashboard/socios/aportaciones"
              className={`flex items-center gap-2 p-2 rounded transition ${
                isActive("/dashboard/socios/aportaciones")
                  ? "bg-[var(--color-primary)]"
                  : "hover:bg-[var(--color-primary)]"
              }`}
            >
              <DollarSign size={16} />
              Aportes
            </Link>

            <Link
              to="/dashboard/socios/utilidades"
              className={`flex items-center gap-2 p-2 rounded transition ${
                isActive("/dashboard/socios/utilidades")
                  ? "bg-[var(--color-primary)]"
                  : "hover:bg-[var(--color-primary)]"
              }`}
            >
              <TrendingUp size={16} />
              Utilidades
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
