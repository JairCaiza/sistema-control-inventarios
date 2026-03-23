function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-6">
      {/* TITULO */}
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">
        Sistema de Gestión
      </h1>

      {/* USUARIO */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--text-secondary)]">Admin</span>

        <div className="w-9 h-9 bg-[var(--color-primary)] text-white flex items-center justify-center rounded-full font-semibold">
          A
        </div>
      </div>
    </header>
  );
}

export default Topbar;
