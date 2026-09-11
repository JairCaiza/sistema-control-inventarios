import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

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
  ClipboardCheck,
  Wallet,
  Landmark,
  HandCoins,
  Receipt,
  TrendingUp,
  ArrowLeftRight,
  DollarSign,
  CalendarDays,
  Lock,
  UserCircle,
  PiggyBank,
} from "lucide-react";

import logo from "../assets/logoguaraca.png";

/* =====================================================
   TIPOS
===================================================== */

type RolLocal =
  | string
  | {
      nombre?: string;
      name?: string;
      rol?: string;
      role?: string;
    };

interface UsuarioLocal {
  id?: string;
  nombre?: string;
  apellido?: string;
  correo?: string;

  roles?: RolLocal[];

  rol?: RolLocal;

  role?: RolLocal;
}

interface UsuarioAlmacenado {
  usuario?: UsuarioLocal;

  user?: UsuarioLocal;

  id?: string;
  nombre?: string;
  apellido?: string;
  correo?: string;

  roles?: RolLocal[];

  rol?: RolLocal;

  role?: RolLocal;
}

/* =====================================================
   HELPERS DE AUTENTICACIÓN
===================================================== */

const leerUsuarioLocalStorage = (): UsuarioLocal | null => {
  try {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      return null;
    }

    const parsed: UsuarioAlmacenado = JSON.parse(usuarioGuardado);

    return parsed.usuario ?? parsed.user ?? parsed;
  } catch (error) {
    console.error("Error al leer usuario desde localStorage:", error);

    return null;
  }
};

/* =====================================================
   HELPERS DE ROLES
===================================================== */

const normalizarRol = (rol: RolLocal | null | undefined): string => {
  if (!rol) {
    return "";
  }

  if (typeof rol === "string") {
    return rol.trim().toLowerCase();
  }

  const nombreRol = rol.nombre ?? rol.name ?? rol.rol ?? rol.role ?? "";

  return String(nombreRol).trim().toLowerCase();
};

const obtenerRolesUsuario = (usuario: UsuarioLocal | null): string[] => {
  if (!usuario) {
    return [];
  }

  let rolesOriginales: RolLocal[] = [];

  if (Array.isArray(usuario.roles)) {
    rolesOriginales = usuario.roles;
  } else if (usuario.rol) {
    rolesOriginales = [usuario.rol];
  } else if (usuario.role) {
    rolesOriginales = [usuario.role];
  }

  return [...new Set(rolesOriginales.map(normalizarRol).filter(Boolean))];
};

/* =====================================================
   SIDEBAR
===================================================== */

function Sidebar() {
  const location = useLocation();

  /* =====================================================
     SIDEBAR COLAPSADO
  ===================================================== */

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("sidebarCollapsed");

      if (saved === null) {
        return false;
      }

      const parsed = JSON.parse(saved);

      return typeof parsed === "boolean" ? parsed : false;
    } catch (error) {
      console.error("Error al recuperar estado del Sidebar:", error);

      return false;
    }
  });

  /* =====================================================
     USUARIO AUTENTICADO
  ===================================================== */

  const [usuario, setUsuario] = useState<UsuarioLocal | null>(() =>
    leerUsuarioLocalStorage(),
  );

  /* =====================================================
     ESTADOS DE MENÚS MANUALES
  ===================================================== */

  const [openAdmin, setOpenAdmin] = useState(false);

  const [openInventario, setOpenInventario] = useState(false);

  const [openObras, setOpenObras] = useState(false);

  const [openFinanzas, setOpenFinanzas] = useState(false);

  const [openPersonal, setOpenPersonal] = useState(false);

  const [openSocios, setOpenSocios] = useState(false);

  const [openPortalSocio, setOpenPortalSocio] = useState(false);

  /* =====================================================
     SINCRONIZAR USUARIO
  ===================================================== */

  useEffect(() => {
    const actualizarUsuario = () => {
      setUsuario(leerUsuarioLocalStorage());
    };

    const manejarStorage = (event: StorageEvent) => {
      if (event.key === "usuario" || event.key === null) {
        actualizarUsuario();
      }
    };

    const manejarFocus = () => {
      actualizarUsuario();
    };

    const manejarAuthChange = () => {
      actualizarUsuario();
    };

    window.addEventListener("storage", manejarStorage);

    window.addEventListener("focus", manejarFocus);

    window.addEventListener("auth-change", manejarAuthChange);

    return () => {
      window.removeEventListener("storage", manejarStorage);

      window.removeEventListener("focus", manejarFocus);

      window.removeEventListener("auth-change", manejarAuthChange);
    };
  }, []);

  /* =====================================================
     GUARDAR ESTADO DEL SIDEBAR
  ===================================================== */

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  /* =====================================================
     ROLES
  ===================================================== */

  const roles = useMemo(() => obtenerRolesUsuario(usuario), [usuario]);

  const esAdministrador = roles.includes("administrador");

  const esContador = roles.includes("contador");

  const esOperador = roles.includes("operador");

  const esSocio = roles.includes("socio");

  const puedeAdministrarSocios = esAdministrador || esContador;

  /* =====================================================
     DEBUG TEMPORAL
  ===================================================== */

  useEffect(() => {
    console.log("SIDEBAR - USUARIO:", usuario);

    console.log("SIDEBAR - ROLES:", roles);

    console.log("SIDEBAR - ADMIN:", esAdministrador);

    console.log("SIDEBAR - CONTADOR:", esContador);

    console.log("SIDEBAR - OPERADOR:", esOperador);

    console.log("SIDEBAR - SOCIO:", esSocio);
  }, [usuario, roles, esAdministrador, esContador, esOperador, esSocio]);

  /* =====================================================
     HELPERS DE RUTAS
  ===================================================== */

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const isSectionActive = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  /* =====================================================
     ESTADO DERIVADO DE MENÚS
  ===================================================== */

  const adminAbierto =
    openAdmin ||
    isSectionActive("/dashboard/usuarios") ||
    isSectionActive("/dashboard/roles");

  const inventarioAbierto =
    openInventario ||
    isSectionActive("/dashboard/categorias") ||
    isSectionActive("/dashboard/ubicaciones") ||
    isSectionActive("/dashboard/activos") ||
    isSectionActive("/dashboard/movimientos") ||
    isSectionActive("/dashboard/reportes/inventario");

  const obrasAbierto =
    openObras ||
    isSectionActive("/dashboard/empleados") ||
    isSectionActive("/dashboard/obras") ||
    isSectionActive("/dashboard/control-diario") ||
    isSectionActive("/dashboard/asistencia") ||
    isSectionActive("/dashboard/gastos-obra") ||
    isSectionActive("/dashboard/reporte-gastos-obra");

  const finanzasAbierto =
    openFinanzas ||
    isSectionActive("/dashboard/dashboardfinanciero") ||
    isSectionActive("/dashboard/cuentas") ||
    isSectionActive("/dashboard/ingresos") ||
    isSectionActive("/dashboard/egresos") ||
    isSectionActive("/dashboard/transferencias") ||
    isSectionActive("/dashboard/flujo-de-caja") ||
    isSectionActive("/dashboard/utilidadmensual") ||
    isSectionActive("/dashboard/cierres") ||
    isSectionActive("/dashboard/periodos");

  const personalAbierto =
    openPersonal ||
    isSectionActive("/dashboard/pagos-empleados") ||
    isSectionActive("/dashboard/reportes-empleados");

  const sociosAbierto = openSocios || isSectionActive("/dashboard/socios");

  const portalSocioAbierto =
    openPortalSocio || isSectionActive("/dashboard/mi-portal");

  /* =====================================================
     CLASES REUTILIZABLES
  ===================================================== */

  const claseItemPrincipal = (activo: boolean) => `
    flex
    items-center
    gap-3
    w-full
    p-2
    rounded
    transition
    ${activo ? "bg-[var(--color-primary)]" : "hover:bg-[var(--color-primary)]"}
  `;

  const claseSubItem = (activo: boolean) => `
    flex
    items-center
    gap-2
    p-2
    rounded
    transition
    ${activo ? "bg-[var(--color-primary)]" : "hover:bg-[var(--color-primary)]"}
  `;

  const claseBotonSeccion = (activo = false) => `
    flex
    items-center
    justify-between
    w-full
    p-2
    rounded
    transition
    ${activo ? "bg-[var(--color-primary)]" : "hover:bg-[var(--color-primary)]"}
  `;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <aside
      className={`
        ${collapsed ? "w-20" : "w-64"}
        h-screen
        overflow-y-auto
        bg-[var(--color-bg-dark)]
        text-white
        flex
        flex-col
        transition-all
        duration-300
        shadow-lg
      `}
    >
      {/* =================================================
          HEADER
      ================================================= */}

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
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <img
            src={logo}
            className="
              w-10
              h-10
              object-contain
            "
            alt="ConstructSys"
          />

          {!collapsed && (
            <span
              className="
                font-bold
                text-lg
              "
            >
              ConstructSys
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="
            text-gray-300
            hover:text-white
            transition
          "
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      {/* =================================================
          MENÚ
      ================================================= */}

      <nav
        className="
          flex-1
          p-3
          space-y-2
          text-sm
        "
      >
        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Link
          to="/dashboard"
          title="Dashboard"
          className={claseItemPrincipal(isActive("/dashboard"))}
        >
          <LayoutDashboard size={18} />

          {!collapsed && "Dashboard"}
        </Link>

        {/* =================================================
            ADMINISTRACIÓN
        ================================================= */}

        <button
          type="button"
          onClick={() => setOpenAdmin((prev) => !prev)}
          className={claseBotonSeccion(adminAbierto)}
        >
          <span
            className="
              flex
              items-center
              gap-3
            "
          >
            <Shield size={18} />

            {!collapsed && "Administración"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`
                transition
                ${adminAbierto ? "rotate-180" : ""}
              `}
            />
          )}
        </button>

        {adminAbierto && !collapsed && (
          <div
            className="
              ml-6
              space-y-1
            "
          >
            <Link
              to="/dashboard/usuarios"
              className={claseSubItem(isActive("/dashboard/usuarios"))}
            >
              <Users size={16} />
              Usuarios
            </Link>

            <Link
              to="/dashboard/roles"
              className={claseSubItem(isActive("/dashboard/roles"))}
            >
              <Shield size={16} />
              Roles
            </Link>
          </div>
        )}

        {/* =================================================
            INVENTARIO
        ================================================= */}

        <button
          type="button"
          onClick={() => setOpenInventario((prev) => !prev)}
          className={claseBotonSeccion(inventarioAbierto)}
        >
          <span
            className="
              flex
              items-center
              gap-3
            "
          >
            <Package size={18} />

            {!collapsed && "Inventario"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`
                transition
                ${inventarioAbierto ? "rotate-180" : ""}
              `}
            />
          )}
        </button>

        {inventarioAbierto && !collapsed && (
          <div
            className="
              ml-6
              space-y-1
            "
          >
            <Link
              to="/dashboard/categorias"
              className={claseSubItem(isActive("/dashboard/categorias"))}
            >
              Categorías
            </Link>

            <Link
              to="/dashboard/ubicaciones"
              className={claseSubItem(isActive("/dashboard/ubicaciones"))}
            >
              Ubicaciones
            </Link>

            <Link
              to="/dashboard/activos"
              className={claseSubItem(isActive("/dashboard/activos"))}
            >
              Activos
            </Link>

            <Link
              to="/dashboard/movimientos"
              className={claseSubItem(isActive("/dashboard/movimientos"))}
            >
              Movimientos
            </Link>

            <Link
              to="/dashboard/reportes/inventario"
              className={claseSubItem(
                isActive("/dashboard/reportes/inventario"),
              )}
            >
              Reportes
            </Link>
          </div>
        )}

        {/* =================================================
            CLIENTES
        ================================================= */}

        <Link
          to="/dashboard/clientes"
          title="Clientes"
          className={claseItemPrincipal(isActive("/dashboard/clientes"))}
        >
          <FileText size={18} />

          {!collapsed && "Clientes"}
        </Link>

        {/* =================================================
            CONTRATOS
        ================================================= */}

        <Link
          to="/dashboard/contratos"
          title="Contratos"
          className={claseItemPrincipal(isActive("/dashboard/contratos"))}
        >
          <FileText size={18} />

          {!collapsed && "Contratos"}
        </Link>

        {/* =================================================
            DEVOLUCIONES
        ================================================= */}

        <Link
          to="/dashboard/devoluciones"
          title="Devoluciones"
          className={claseItemPrincipal(isActive("/dashboard/devoluciones"))}
        >
          <BarChart3 size={18} />

          {!collapsed && "Devoluciones"}
        </Link>

        {/* =================================================
            GESTIÓN OBRAS
        ================================================= */}

        <button
          type="button"
          onClick={() => setOpenObras((prev) => !prev)}
          className={claseBotonSeccion(obrasAbierto)}
        >
          <span
            className="
              flex
              items-center
              gap-3
            "
          >
            <Hammer size={18} />

            {!collapsed && "Gestión Obras"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`
                transition
                ${obrasAbierto ? "rotate-180" : ""}
              `}
            />
          )}
        </button>

        {obrasAbierto && !collapsed && (
          <div
            className="
              ml-6
              space-y-1
            "
          >
            <Link
              to="/dashboard/empleados"
              className={claseSubItem(isSectionActive("/dashboard/empleados"))}
            >
              <Users size={16} />
              Empleados
            </Link>

            <Link
              to="/dashboard/obras"
              className={claseSubItem(isSectionActive("/dashboard/obras"))}
            >
              <HardHat size={16} />
              Obras
            </Link>

            <Link
              to="/dashboard/control-diario"
              className={claseSubItem(isActive("/dashboard/control-diario"))}
            >
              <ClipboardList size={16} />
              Control Diario
            </Link>

            <Link
              to="/dashboard/asistencia"
              className={claseSubItem(isSectionActive("/dashboard/asistencia"))}
            >
              <ClipboardCheck size={16} />
              Asistencia
            </Link>

            <Link
              to="/dashboard/gastos-obra"
              className={claseSubItem(isActive("/dashboard/gastos-obra"))}
            >
              <Receipt size={16} />
              Gastos Obra
            </Link>

            <Link
              to="/dashboard/reporte-gastos-obra"
              className={claseSubItem(
                isActive("/dashboard/reporte-gastos-obra"),
              )}
            >
              <BarChart3 size={16} />
              Reportes Obras
            </Link>
          </div>
        )}

        {/* =================================================
            FINANZAS
        ================================================= */}

        <button
          type="button"
          onClick={() => setOpenFinanzas((prev) => !prev)}
          className={claseBotonSeccion(finanzasAbierto)}
        >
          <span
            className="
              flex
              items-center
              gap-3
            "
          >
            <Landmark size={18} />

            {!collapsed && "Finanzas"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`
                transition
                ${finanzasAbierto ? "rotate-180" : ""}
              `}
            />
          )}
        </button>

        {finanzasAbierto && !collapsed && (
          <div
            className="
              ml-6
              space-y-1
            "
          >
            <Link
              to="/dashboard/dashboardfinanciero"
              className={claseSubItem(
                isActive("/dashboard/dashboardfinanciero"),
              )}
            >
              <LayoutDashboard size={16} />
              Dashboard Financiero
            </Link>

            <Link
              to="/dashboard/cuentas"
              className={claseSubItem(isActive("/dashboard/cuentas"))}
            >
              <Wallet size={16} />
              Cuentas
            </Link>

            <Link
              to="/dashboard/ingresos"
              className={claseSubItem(isActive("/dashboard/ingresos"))}
            >
              <DollarSign size={16} />
              Ingresos
            </Link>

            <Link
              to="/dashboard/egresos"
              className={claseSubItem(isActive("/dashboard/egresos"))}
            >
              <Receipt size={16} />
              Egresos
            </Link>

            <Link
              to="/dashboard/transferencias"
              className={claseSubItem(isActive("/dashboard/transferencias"))}
            >
              <ArrowLeftRight size={16} />
              Transferencias
            </Link>

            <Link
              to="/dashboard/flujo-de-caja"
              className={claseSubItem(isActive("/dashboard/flujo-de-caja"))}
            >
              <TrendingUp size={16} />
              Flujo Caja
            </Link>

            <Link
              to="/dashboard/utilidadmensual"
              className={claseSubItem(isActive("/dashboard/utilidadmensual"))}
            >
              <BarChart3 size={16} />
              Utilidad Mensual
            </Link>

            <Link
              to="/dashboard/cierres"
              className={claseSubItem(isActive("/dashboard/cierres"))}
            >
              <CalendarDays size={16} />
              Cierres
            </Link>

            <Link
              to="/dashboard/periodos"
              className={claseSubItem(isActive("/dashboard/periodos"))}
            >
              <Lock size={16} />
              Periodos
            </Link>
          </div>
        )}

        {/* =================================================
            PERSONAL
        ================================================= */}

        <button
          type="button"
          onClick={() => setOpenPersonal((prev) => !prev)}
          className={claseBotonSeccion(personalAbierto)}
        >
          <span
            className="
              flex
              items-center
              gap-3
            "
          >
            <Wallet size={18} />

            {!collapsed && "Personal"}
          </span>

          {!collapsed && (
            <ChevronDown
              size={16}
              className={`
                transition
                ${personalAbierto ? "rotate-180" : ""}
              `}
            />
          )}
        </button>

        {personalAbierto && !collapsed && (
          <div
            className="
              ml-6
              space-y-1
            "
          >
            <Link
              to="/dashboard/pagos-empleados"
              className={claseSubItem(isActive("/dashboard/pagos-empleados"))}
            >
              <Wallet size={16} />
              Pagos Empleados
            </Link>

            <Link
              to="/dashboard/reportes-empleados"
              className={claseSubItem(
                isActive("/dashboard/reportes-empleados"),
              )}
            >
              <BarChart3 size={16} />
              Reportes Personal
            </Link>
          </div>
        )}

        {/* =================================================
            ADMINISTRACIÓN DE SOCIOS
        ================================================= */}

        {puedeAdministrarSocios && (
          <>
            {!collapsed && (
              <div
                className="
                  pt-3
                  pb-1
                "
              >
                <div
                  className="
                    border-t
                    border-gray-700
                  "
                />

                <p
                  className="
                    mt-3
                    px-2
                    text-[11px]
                    uppercase
                    tracking-wider
                    text-gray-400
                    font-semibold
                  "
                >
                  Administración societaria
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpenSocios((prev) => !prev)}
              className={claseBotonSeccion(sociosAbierto)}
            >
              <span
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <HandCoins size={18} />

                {!collapsed && "Socios"}
              </span>

              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={`
                    transition
                    ${sociosAbierto ? "rotate-180" : ""}
                  `}
                />
              )}
            </button>

            {sociosAbierto && !collapsed && (
              <div
                className="
                  ml-6
                  space-y-1
                "
              >
                <Link
                  to="/dashboard/socios"
                  className={claseSubItem(isActive("/dashboard/socios"))}
                >
                  <Users size={16} />
                  Socios
                </Link>

                <Link
                  to="/dashboard/socios/aportaciones"
                  className={claseSubItem(
                    isActive("/dashboard/socios/aportaciones"),
                  )}
                >
                  <DollarSign size={16} />
                  Aportes
                </Link>

                <Link
                  to="/dashboard/socios/utilidades"
                  className={claseSubItem(
                    isActive("/dashboard/socios/utilidades"),
                  )}
                >
                  <TrendingUp size={16} />
                  Utilidades
                </Link>
              </div>
            )}
          </>
        )}

        {/* =================================================
            PORTAL PERSONAL DEL SOCIO
        ================================================= */}

        {esSocio && (
          <>
            {!collapsed && (
              <div
                className="
                  pt-3
                  pb-1
                "
              >
                <div
                  className="
                    border-t
                    border-gray-700
                  "
                />

                <p
                  className="
                    mt-3
                    px-2
                    text-[11px]
                    uppercase
                    tracking-wider
                    text-gray-400
                    font-semibold
                  "
                >
                  Mi información
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpenPortalSocio((prev) => !prev)}
              title="Mi Portal"
              className={claseBotonSeccion(
                isSectionActive("/dashboard/mi-portal"),
              )}
            >
              <span
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <UserCircle size={18} />

                {!collapsed && "Mi Portal"}
              </span>

              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={`
                    transition
                    ${portalSocioAbierto ? "rotate-180" : ""}
                  `}
                />
              )}
            </button>

            {portalSocioAbierto && !collapsed && (
              <div
                className="
                  ml-6
                  space-y-1
                "
              >
                <Link
                  to="/dashboard/mi-portal"
                  className={claseSubItem(isActive("/dashboard/mi-portal"))}
                >
                  <LayoutDashboard size={16} />
                  Resumen
                </Link>

                <Link
                  to="/dashboard/mi-portal/perfil"
                  className={claseSubItem(
                    isActive("/dashboard/mi-portal/perfil"),
                  )}
                >
                  <UserCircle size={16} />
                  Mi Perfil
                </Link>

                <Link
                  to="/dashboard/mi-portal/aportes"
                  className={claseSubItem(
                    isActive("/dashboard/mi-portal/aportes"),
                  )}
                >
                  <PiggyBank size={16} />
                  Mis Aportes
                </Link>

                <Link
                  to="/dashboard/mi-portal/utilidades"
                  className={claseSubItem(
                    isActive("/dashboard/mi-portal/utilidades"),
                  )}
                >
                  <TrendingUp size={16} />
                  Mis Utilidades
                </Link>
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
