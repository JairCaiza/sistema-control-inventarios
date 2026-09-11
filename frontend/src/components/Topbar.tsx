import { Search, Bell, Settings, LogOut, ChevronRight } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { logout } from "../services/authService";

/* =====================================================
   TIPOS
===================================================== */

type RolUsuario =
  | string
  | {
      nombre?: string;
      name?: string;
      rol?: string;
      role?: string;
    };

interface UsuarioSesion {
  id?: string;
  nombre?: string;
  apellido?: string;
  correo?: string;

  roles?: RolUsuario[];

  // Compatibilidad con estructura antigua
  rol?: RolUsuario;
  role?: RolUsuario;
}

interface UsuarioAlmacenado {
  usuario?: UsuarioSesion;
  user?: UsuarioSesion;

  id?: string;
  nombre?: string;
  apellido?: string;
  correo?: string;

  roles?: RolUsuario[];

  rol?: RolUsuario;
  role?: RolUsuario;
}

interface BreadcrumbItem {
  label: string;
}

/* =====================================================
   HELPERS DE USUARIO
===================================================== */

/**
 * Convierte cualquier estructura de rol
 * a un nombre legible.
 */
const obtenerNombreRol = (rol: RolUsuario | null | undefined): string => {
  if (!rol) {
    return "";
  }

  if (typeof rol === "string") {
    return rol.trim();
  }

  return String(rol.nombre ?? rol.name ?? rol.rol ?? rol.role ?? "").trim();
};

/**
 * Obtiene todos los roles del usuario.
 *
 * Soporta:
 *
 * roles: ["Operador", "Socio"]
 *
 * rol: "Administrador"
 *
 * role: "Contador"
 */
const obtenerRolesUsuario = (usuario: UsuarioSesion | null): string[] => {
  if (!usuario) {
    return [];
  }

  let rolesOriginales: RolUsuario[] = [];

  if (Array.isArray(usuario.roles)) {
    rolesOriginales = usuario.roles;
  } else if (usuario.rol) {
    rolesOriginales = [usuario.rol];
  } else if (usuario.role) {
    rolesOriginales = [usuario.role];
  }

  return [...new Set(rolesOriginales.map(obtenerNombreRol).filter(Boolean))];
};

/**
 * Lee correctamente el usuario guardado
 * por el login.
 *
 * Nuestro sistema utiliza:
 *
 * localStorage.setItem("usuario", ...)
 */
const leerUsuarioLocalStorage = (): UsuarioSesion | null => {
  try {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      return null;
    }

    const parsed: UsuarioAlmacenado = JSON.parse(usuarioGuardado);

    /*
     * Soporta cualquiera de estas estructuras:
     *
     * {
     *   id,
     *   nombre,
     *   apellido,
     *   correo,
     *   roles
     * }
     *
     * o:
     *
     * {
     *   usuario: {
     *      ...
     *   }
     * }
     */

    return parsed.usuario ?? parsed.user ?? parsed;
  } catch (error) {
    console.error("Error al recuperar usuario del localStorage:", error);

    return null;
  }
};

/**
 * Genera las dos iniciales.
 *
 * Patricio Caiza -> PC
 * Jairo Caiza -> JC
 */
const obtenerIniciales = (usuario: UsuarioSesion | null): string => {
  if (!usuario) {
    return "U";
  }

  const nombre = usuario.nombre?.trim() ?? "";

  const apellido = usuario.apellido?.trim() ?? "";

  const inicialNombre = nombre.charAt(0).toUpperCase();

  const inicialApellido = apellido.charAt(0).toUpperCase();

  const iniciales = `${inicialNombre}${inicialApellido}`;

  return iniciales || "U";
};

/* =====================================================
   CONFIGURACIÓN DE RUTAS
===================================================== */

const obtenerNavegacion = (
  pathname: string,
): {
  titulo: string;
  breadcrumbs: BreadcrumbItem[];
} => {
  /* =================================================
     PORTAL DEL SOCIO
  ================================================= */

  if (
    pathname === "/dashboard/mi-portal" ||
    pathname === "/dashboard/mi-portal/"
  ) {
    return {
      titulo: "Mi Portal",
      breadcrumbs: [
        {
          label: "Mi Portal",
        },
        {
          label: "Resumen",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/mi-portal/perfil")) {
    return {
      titulo: "Mi Perfil",
      breadcrumbs: [
        {
          label: "Mi Portal",
        },
        {
          label: "Mi Perfil",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/mi-portal/aportes")) {
    return {
      titulo: "Mis Aportes",
      breadcrumbs: [
        {
          label: "Mi Portal",
        },
        {
          label: "Mis Aportes",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/mi-portal/utilidades")) {
    return {
      titulo: "Mis Utilidades",
      breadcrumbs: [
        {
          label: "Mi Portal",
        },
        {
          label: "Mis Utilidades",
        },
      ],
    };
  }

  /* =================================================
     DASHBOARD
  ================================================= */

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return {
      titulo: "Dashboard General",
      breadcrumbs: [
        {
          label: "Dashboard",
        },
      ],
    };
  }

  /* =================================================
     ADMINISTRACIÓN
  ================================================= */

  if (pathname.startsWith("/dashboard/usuarios")) {
    return {
      titulo: "Gestión de Usuarios",
      breadcrumbs: [
        {
          label: "Administración",
        },
        {
          label: "Usuarios",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/roles")) {
    return {
      titulo: "Gestión de Roles",
      breadcrumbs: [
        {
          label: "Administración",
        },
        {
          label: "Roles",
        },
      ],
    };
  }

  /* =================================================
     INVENTARIO
  ================================================= */

  if (pathname.startsWith("/dashboard/categorias")) {
    return {
      titulo: "Categorías",
      breadcrumbs: [
        {
          label: "Inventario",
        },
        {
          label: "Categorías",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/ubicaciones")) {
    return {
      titulo: "Ubicaciones",
      breadcrumbs: [
        {
          label: "Inventario",
        },
        {
          label: "Ubicaciones",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/activos")) {
    return {
      titulo: "Gestión de Activos",
      breadcrumbs: [
        {
          label: "Inventario",
        },
        {
          label: "Activos",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/movimientos")) {
    return {
      titulo: "Movimientos de Inventario",
      breadcrumbs: [
        {
          label: "Inventario",
        },
        {
          label: "Movimientos",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/reportes")) {
    return {
      titulo: "Reportes de Inventario",
      breadcrumbs: [
        {
          label: "Inventario",
        },
        {
          label: "Reportes",
        },
      ],
    };
  }

  /* =================================================
     CLIENTES
  ================================================= */

  if (pathname.startsWith("/dashboard/clientes")) {
    return {
      titulo: "Gestión de Clientes",
      breadcrumbs: [
        {
          label: "Clientes",
        },
      ],
    };
  }

  /* =================================================
     CONTRATOS
  ================================================= */

  if (pathname.startsWith("/dashboard/contratos")) {
    return {
      titulo: "Gestión de Contratos",
      breadcrumbs: [
        {
          label: "Contratos",
        },
      ],
    };
  }

  /* =================================================
     DEVOLUCIONES
  ================================================= */

  if (pathname.startsWith("/dashboard/devoluciones")) {
    return {
      titulo: "Gestión de Devoluciones",
      breadcrumbs: [
        {
          label: "Devoluciones",
        },
      ],
    };
  }

  /* =================================================
     GESTIÓN DE OBRAS
  ================================================= */

  if (pathname.startsWith("/dashboard/obras")) {
    return {
      titulo: "Gestión de Obras",
      breadcrumbs: [
        {
          label: "Gestión de Obras",
        },
        {
          label: "Obras",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/control-diario")) {
    return {
      titulo: "Control Diario",
      breadcrumbs: [
        {
          label: "Gestión de Obras",
        },
        {
          label: "Control Diario",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/gastos-obra")) {
    return {
      titulo: "Gastos de Obra",
      breadcrumbs: [
        {
          label: "Gestión de Obras",
        },
        {
          label: "Gastos de Obra",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/reporte-gastos-obra")) {
    return {
      titulo: "Reportes de Obras",
      breadcrumbs: [
        {
          label: "Gestión de Obras",
        },
        {
          label: "Reportes",
        },
      ],
    };
  }

  /* =================================================
     FINANZAS
  ================================================= */

  if (pathname.startsWith("/dashboard/dashboardfinanciero")) {
    return {
      titulo: "Dashboard Financiero",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Dashboard",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/cuentas")) {
    return {
      titulo: "Cuentas Financieras",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Cuentas",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/ingresos")) {
    return {
      titulo: "Gestión de Ingresos",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Ingresos",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/egresos")) {
    return {
      titulo: "Gestión de Egresos",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Egresos",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/transferencias")) {
    return {
      titulo: "Transferencias",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Transferencias",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/flujo-de-caja")) {
    return {
      titulo: "Flujo de Caja",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Flujo de Caja",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/utilidadmensual")) {
    return {
      titulo: "Utilidad Mensual",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Utilidad Mensual",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/cierres")) {
    return {
      titulo: "Cierres de Caja",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Cierres",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/periodos")) {
    return {
      titulo: "Períodos Contables",
      breadcrumbs: [
        {
          label: "Finanzas",
        },
        {
          label: "Períodos",
        },
      ],
    };
  }

  /* =================================================
     PERSONAL
  ================================================= */

  if (pathname.startsWith("/dashboard/empleados")) {
    return {
      titulo: "Gestión de Personal",
      breadcrumbs: [
        {
          label: "Personal",
        },
        {
          label: "Empleados",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/pagos-empleados")) {
    return {
      titulo: "Pagos a Empleados",
      breadcrumbs: [
        {
          label: "Personal",
        },
        {
          label: "Pagos",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/reportes-empleados")) {
    return {
      titulo: "Reportes de Personal",
      breadcrumbs: [
        {
          label: "Personal",
        },
        {
          label: "Reportes",
        },
      ],
    };
  }

  /* =================================================
     SOCIOS
  ================================================= */

  if (pathname.startsWith("/dashboard/socios/utilidades")) {
    return {
      titulo: "Utilidades de Socios",
      breadcrumbs: [
        {
          label: "Socios",
        },
        {
          label: "Utilidades",
        },
      ],
    };
  }

  if (
    pathname.startsWith("/dashboard/socios/aportaciones") ||
    pathname.startsWith("/dashboard/socios/aportes")
  ) {
    return {
      titulo: "Aportes de Socios",
      breadcrumbs: [
        {
          label: "Socios",
        },
        {
          label: "Aportes",
        },
      ],
    };
  }

  if (pathname.startsWith("/dashboard/socios")) {
    return {
      titulo: "Gestión de Socios",
      breadcrumbs: [
        {
          label: "Socios",
        },
        {
          label: "Gestión de Socios",
        },
      ],
    };
  }

  /* =================================================
     FALLBACK
  ================================================= */

  return {
    titulo: "Sistema de Gestión",
    breadcrumbs: [
      {
        label: "Dashboard",
      },
    ],
  };
};

/* =====================================================
   TOPBAR
===================================================== */

function Topbar() {
  const navigate = useNavigate();

  const location = useLocation();

  /* =====================================================
     NAVEGACIÓN ACTUAL
  ===================================================== */

  const navegacion = obtenerNavegacion(location.pathname);

  /* =====================================================
     USUARIO AUTENTICADO
  ===================================================== */

  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() =>
    leerUsuarioLocalStorage(),
  );

  /*
   * Solamente actualizamos desde eventos externos.
   *
   * No hacemos setState directamente en el cuerpo
   * inicial de un useEffect.
   */
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
     INFORMACIÓN VISUAL DEL USUARIO
  ===================================================== */

  const roles = obtenerRolesUsuario(usuario);

  const textoRoles = roles.length > 0 ? roles.join(" • ") : "Sin rol";

  const iniciales = obtenerIniciales(usuario);

  const correoUsuario = usuario?.correo || "Usuario";

  const nombreCompleto = [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(" ");

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",

      text: "Tendrá que iniciar sesión nuevamente para acceder al sistema.",

      icon: "question",

      showCancelButton: true,

      confirmButtonText: "Sí, cerrar sesión",

      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    logout();

    navigate("/", {
      replace: true,
    });
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <header
      className="
        h-16
        bg-white
        border-b
        border-[var(--color-border)]
        flex
        items-center
        justify-between
        px-6
        shadow-sm
      "
    >
      {/* =================================================
          IZQUIERDA
      ================================================= */}

      <div
        className="
          flex
          flex-col
          justify-center
          min-w-[280px]
        "
      >
        {/* BREADCRUMB */}

        <div
          className="
            flex
            items-center
            text-xs
            text-gray-500
          "
        >
          <span
            className="
              hover:text-[var(--color-primary)]
              cursor-pointer
              transition
            "
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </span>

          {navegacion.breadcrumbs
            .filter((item) => item.label !== "Dashboard")
            .map((item, index, array) => (
              <div
                key={`${item.label}-${index}`}
                className="
                    flex
                    items-center
                  "
              >
                <ChevronRight
                  size={13}
                  className="
                      mx-1
                      text-gray-400
                    "
                />

                <span
                  className={
                    index === array.length - 1
                      ? "font-medium text-gray-700"
                      : ""
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
        </div>

        {/* TÍTULO */}

        <h1
          className="
            text-lg
            font-bold
            text-[var(--text-primary)]
          "
        >
          {navegacion.titulo}
        </h1>
      </div>

      {/* =================================================
          BUSCADOR
      ================================================= */}

      <div
        className="
          hidden
          lg:flex
          flex-1
          justify-center
          px-8
        "
      >
        <div
          className="
            relative
            w-full
            max-w-xl
          "
        >
          <Search
            size={18}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
          />

          <input
            type="text"
            placeholder="
              Buscar activos, clientes, obras, empleados...
            "
            className="
              w-full
              pl-10
              pr-4
              py-2
              border
              border-gray-300
              rounded-lg
              focus:outline-none
              focus:ring-2
              focus:ring-[var(--color-primary)]
            "
          />
        </div>
      </div>

      {/* =================================================
          DERECHA
      ================================================= */}

      <div
        className="
          flex
          items-center
          gap-4
        "
      >
        {/* PERÍODO */}

        <div
          className="
            hidden
            xl:block
            text-right
          "
        >
          <p
            className="
              text-xs
              text-gray-500
            "
          >
            Período Activo
          </p>

          <p
            className="
              font-semibold
              text-sm
            "
          >
            Junio 2026
          </p>
        </div>

        {/* NOTIFICACIONES */}

        <button
          type="button"
          className="
            relative
            p-2
            rounded-lg
            hover:bg-gray-100
            transition
          "
          title="Notificaciones"
        >
          <Bell size={20} />

          <span
            className="
              absolute
              -top-1
              -right-1
              w-5
              h-5
              bg-red-500
              text-white
              text-xs
              rounded-full
              flex
              items-center
              justify-center
            "
          >
            3
          </span>
        </button>

        {/* CONFIGURACIÓN */}

        <button
          type="button"
          className="
            p-2
            rounded-lg
            hover:bg-gray-100
            transition
          "
          title="Configuración"
        >
          <Settings size={20} />
        </button>

        {/* =================================================
            USUARIO AUTENTICADO
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-3
          "
          title={
            nombreCompleto ? `${nombreCompleto} - ${textoRoles}` : textoRoles
          }
        >
          {/* INFORMACIÓN */}

          <div
            className="
              text-right
              hidden
              md:block
              max-w-[230px]
            "
          >
            {/* CORREO */}

            <p
              className="
                text-sm
                font-semibold
                text-gray-700
                truncate
              "
              title={usuario?.correo ?? ""}
            >
              {correoUsuario}
            </p>

            {/* ROLES */}

            <p
              className="
                text-xs
                text-gray-500
                truncate
              "
              title={textoRoles}
            >
              {textoRoles}
            </p>
          </div>

          {/* AVATAR */}

          <div
            className="
              w-10
              h-10
              min-w-10
              bg-[var(--color-primary)]
              text-white
              flex
              items-center
              justify-center
              rounded-full
              font-bold
              text-sm
              select-none
            "
            title={nombreCompleto || correoUsuario}
          >
            {iniciales}
          </div>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            p-2
            rounded-lg
            hover:bg-red-50
            hover:text-red-600
            transition
          "
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
