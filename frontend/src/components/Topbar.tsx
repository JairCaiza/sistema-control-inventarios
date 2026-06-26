import { Search, Bell, Settings, LogOut, ChevronRight } from "lucide-react";

function Topbar() {
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
      {/* =========================
          IZQUIERDA
      ========================= */}
      <div className="flex flex-col justify-center">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500">
          <span>Dashboard</span>

          <ChevronRight size={14} className="mx-1" />

          <span>Finanzas</span>

          <ChevronRight size={14} className="mx-1" />

          <span className="font-medium text-gray-700">Ingresos</span>
        </div>

        {/* Título */}
        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          Sistema de Gestión
        </h1>
      </div>

      {/* =========================
          CENTRO
      ========================= */}
      <div className="hidden lg:flex flex-1 justify-center px-10">
        <div className="relative w-full max-w-xl">
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
              Buscar activos, clientes,
              obras, empleados...
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

      {/* =========================
          DERECHA
      ========================= */}
      <div className="flex items-center gap-4">
        {/* PERIODO */}
        <div className="hidden xl:block text-right">
          <p className="text-xs text-gray-500">Período Activo</p>

          <p className="font-semibold text-sm">Junio 2026</p>
        </div>

        {/* NOTIFICACIONES */}
        <button
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

        {/* USUARIO */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-700">Administrador</p>

            <p className="text-xs text-gray-500">Super Admin</p>
          </div>

          <div
            className="
              w-10
              h-10
              bg-[var(--color-primary)]
              text-white
              flex
              items-center
              justify-center
              rounded-full
              font-bold
            "
          >
            A
          </div>
        </div>

        {/* CERRAR SESIÓN */}
        <button
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
