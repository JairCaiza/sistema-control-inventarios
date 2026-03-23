function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Dashboard
      </h1>

      <p className="text-sm text-[var(--text-muted)] mt-1">
        Bienvenido al sistema ConstructSys
      </p>

      {/* CARDS */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-[var(--radius-md)] shadow-[var(--shadow-soft)]">
          <h3 className="text-sm text-[var(--text-muted)]">
            Equipos disponibles
          </h3>
          <p className="text-3xl font-bold mt-2">120</p>
        </div>

        <div className="bg-white p-6 rounded-[var(--radius-md)] shadow-[var(--shadow-soft)]">
          <h3 className="text-sm text-[var(--text-muted)]">
            Equipos alquilados
          </h3>
          <p className="text-3xl font-bold mt-2">35</p>
        </div>

        <div className="bg-white p-6 rounded-[var(--radius-md)] shadow-[var(--shadow-soft)]">
          <h3 className="text-sm text-[var(--text-muted)]">Ingresos del mes</h3>
          <p className="text-3xl font-bold mt-2">$12,500</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
