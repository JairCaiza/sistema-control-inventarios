import { useEffect, useMemo, useState } from "react";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Wallet,
  CalendarDays,
  Landmark,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  Filter,
} from "lucide-react";

import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

type TipoMovimiento = "aporte" | "retiro";

type EstadoMovimiento = "pendiente" | "confirmado" | "anulado" | string;

interface MovimientoAporte {
  id: string;

  socio_id: string;

  socio_nombre: string;

  socio_identificacion?: string | null;

  cuenta_id?: string | null;

  cuenta_nombre?: string | null;

  cuenta_tipo?: string | null;

  tipo: TipoMovimiento;

  monto: number;

  fecha: string;

  metodo_pago?: string | null;

  referencia?: string | null;

  estado: EstadoMovimiento;

  observaciones?: string | null;

  fecha_creacion?: string;

  fecha_actualizacion?: string;
}

interface RespuestaAportes {
  success?: boolean;

  ok?: boolean;

  message?: string;

  total?: number;

  data?: MovimientoAporte[];
}

/* =====================================================
   HELPERS
===================================================== */

const formatearMoneda = (valor: number) => {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) {
    return "-";
  }

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fechaObj);
};

const capitalizar = (texto?: string | null) => {
  if (!texto) {
    return "-";
  }

  return texto
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
};

/* =====================================================
   BADGE ESTADO
===================================================== */

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "confirmado") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-green-100
          px-2.5
          py-1
          text-xs
          font-semibold
          text-green-700
        "
      >
        <CheckCircle2 size={13} />
        Confirmado
      </span>
    );
  }

  if (estado === "pendiente") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-yellow-100
          px-2.5
          py-1
          text-xs
          font-semibold
          text-yellow-700
        "
      >
        <Clock3 size={13} />
        Pendiente
      </span>
    );
  }

  if (estado === "anulado") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-red-100
          px-2.5
          py-1
          text-xs
          font-semibold
          text-red-700
        "
      >
        <XCircle size={13} />
        Anulado
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        rounded-full
        bg-gray-100
        px-2.5
        py-1
        text-xs
        font-semibold
        capitalize
        text-gray-700
      "
    >
      {estado}
    </span>
  );
}

/* =====================================================
   CARD RESUMEN
===================================================== */

interface CardResumenProps {
  titulo: string;

  valor: string;

  descripcion: string;

  icono: React.ReactNode;
}

function CardResumen({ titulo, valor, descripcion, icono }: CardResumenProps) {
  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-sm
              font-medium
              text-gray-500
            "
          >
            {titulo}
          </p>

          <p
            className="
              mt-2
              text-2xl
              font-bold
              text-gray-900
            "
          >
            {valor}
          </p>

          <p
            className="
              mt-1
              text-xs
              text-gray-500
            "
          >
            {descripcion}
          </p>
        </div>

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-gray-100
            text-[var(--color-primary)]
          "
        >
          {icono}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

function MisAportesPage() {
  const [movimientos, setMovimientos] = useState<MovimientoAporte[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [filtroTipo, setFiltroTipo] = useState<"todos" | "aporte" | "retiro">(
    "todos",
  );

  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "pendiente" | "confirmado" | "anulado"
  >("todos");

  /* =====================================================
     CARGAR DATOS
  ===================================================== */

  const cargarMovimientos = async () => {
    try {
      setLoading(true);

      setError("");

      const respuesta = await api.get<RespuestaAportes>(
        "/aportes-socios/mis-aportes",
      );

      setMovimientos(respuesta.data.data ?? []);
    } catch (err: any) {
      console.error("Error al cargar aportes y retiros:", err);

      setError(
        err?.response?.data?.message ||
          "No se pudieron cargar tus aportes y retiros.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMovimientos();
  }, []);

  /* =====================================================
     RESÚMENES
  ===================================================== */

  const totalAportes = useMemo(
    () =>
      movimientos
        .filter(
          (item) => item.tipo === "aporte" && item.estado === "confirmado",
        )
        .reduce((acumulado, item) => acumulado + Number(item.monto || 0), 0),
    [movimientos],
  );

  const totalRetiros = useMemo(
    () =>
      movimientos
        .filter(
          (item) => item.tipo === "retiro" && item.estado === "confirmado",
        )
        .reduce((acumulado, item) => acumulado + Number(item.monto || 0), 0),
    [movimientos],
  );

  const capitalNeto = useMemo(
    () => Number((totalAportes - totalRetiros).toFixed(2)),
    [totalAportes, totalRetiros],
  );

  const pendientes = useMemo(
    () => movimientos.filter((item) => item.estado === "pendiente").length,
    [movimientos],
  );

  /* =====================================================
     FILTROS
  ===================================================== */

  const movimientosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return movimientos.filter((item) => {
      const coincideTipo = filtroTipo === "todos" || item.tipo === filtroTipo;

      const coincideEstado =
        filtroEstado === "todos" || item.estado === filtroEstado;

      const coincideBusqueda =
        !texto ||
        item.referencia?.toLowerCase().includes(texto) ||
        item.cuenta_nombre?.toLowerCase().includes(texto) ||
        item.metodo_pago?.toLowerCase().includes(texto) ||
        item.observaciones?.toLowerCase().includes(texto) ||
        item.tipo.toLowerCase().includes(texto);

      return coincideTipo && coincideEstado && Boolean(coincideBusqueda);
    });
  }, [movimientos, busqueda, filtroTipo, filtroEstado]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[420px]
          items-center
          justify-center
        "
      >
        <div className="text-center">
          <RefreshCw
            size={34}
            className="
              mx-auto
              animate-spin
              text-[var(--color-primary)]
            "
          />

          <p
            className="
              mt-3
              text-sm
              text-gray-500
            "
          >
            Cargando tus movimientos...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div
        className="
          rounded-xl
          border
          border-red-200
          bg-red-50
          p-6
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <AlertCircle
            size={22}
            className="
              mt-0.5
              text-red-600
            "
          />

          <div>
            <h2
              className="
                font-semibold
                text-red-800
              "
            >
              No se pudieron cargar tus movimientos
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-red-700
              "
            >
              {error}
            </p>

            <button
              onClick={cargarMovimientos}
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-red-600
                px-4
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:bg-red-700
              "
            >
              <RefreshCw size={16} />
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="
        space-y-6
        pb-8
      "
    >
      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-6
          shadow-sm
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div>
            <p
              className="
                text-sm
                font-medium
                text-[var(--color-primary)]
              "
            >
              Portal del Socio
            </p>

            <h1
              className="
                mt-1
                text-2xl
                font-bold
                text-gray-900
                lg:text-3xl
              "
            >
              Mis aportes y retiros
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-gray-500
              "
            >
              Consulta el historial de tus aportaciones, retiros de capital y su
              estado dentro del sistema.
            </p>
          </div>

          <button
            onClick={cargarMovimientos}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-50
            "
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
        </div>
      </section>

      {/* =================================================
          RESUMEN
      ================================================= */}

      <section
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <CardResumen
          titulo="Total aportado"
          valor={formatearMoneda(totalAportes)}
          descripcion="Aportes confirmados"
          icono={<ArrowDownCircle size={22} />}
        />

        <CardResumen
          titulo="Total retirado"
          valor={formatearMoneda(totalRetiros)}
          descripcion="Retiros confirmados"
          icono={<ArrowUpCircle size={22} />}
        />

        <CardResumen
          titulo="Capital neto"
          valor={formatearMoneda(capitalNeto)}
          descripcion="Aportes menos retiros"
          icono={<Wallet size={22} />}
        />

        <CardResumen
          titulo="Pendientes"
          valor={String(pendientes)}
          descripcion="Movimientos por confirmar"
          icono={<Clock3 size={22} />}
        />
      </section>

      {/* =================================================
          FILTROS
      ================================================= */}

      <section
        className="
          rounded-xl
          border
          border-gray-200
          bg-white
          p-4
          shadow-sm
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            xl:flex-row
            xl:items-end
          "
        >
          {/* BÚSQUEDA */}

          <div
            className="
              flex-1
            "
          >
            <label
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-gray-500
              "
            >
              Buscar
            </label>

            <div
              className="
                relative
              "
            >
              <Search
                size={17}
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
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Referencia, cuenta, método de pago..."
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  py-2.5
                  pl-10
                  pr-3
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-[var(--color-primary)]
                  focus:ring-1
                  focus:ring-[var(--color-primary)]
                "
              />
            </div>
          </div>

          {/* TIPO */}

          <div
            className="
              w-full
              xl:w-52
            "
          >
            <label
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-gray-500
              "
            >
              Tipo
            </label>

            <select
              value={filtroTipo}
              onChange={(event) =>
                setFiltroTipo(
                  event.target.value as "todos" | "aporte" | "retiro",
                )
              }
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-gray-700
                outline-none
                transition
                focus:border-[var(--color-primary)]
                focus:ring-1
                focus:ring-[var(--color-primary)]
              "
            >
              <option value="todos">Todos</option>

              <option value="aporte">Aportes</option>

              <option value="retiro">Retiros</option>
            </select>
          </div>

          {/* ESTADO */}

          <div
            className="
              w-full
              xl:w-52
            "
          >
            <label
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-gray-500
              "
            >
              Estado
            </label>

            <select
              value={filtroEstado}
              onChange={(event) =>
                setFiltroEstado(
                  event.target.value as
                    | "todos"
                    | "pendiente"
                    | "confirmado"
                    | "anulado",
                )
              }
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-gray-700
                outline-none
                transition
                focus:border-[var(--color-primary)]
                focus:ring-1
                focus:ring-[var(--color-primary)]
              "
            >
              <option value="todos">Todos</option>

              <option value="confirmado">Confirmados</option>

              <option value="pendiente">Pendientes</option>

              <option value="anulado">Anulados</option>
            </select>
          </div>

          {/* CONTADOR */}

          <div
            className="
              flex
              h-[42px]
              items-center
              gap-2
              rounded-lg
              bg-gray-50
              px-4
              text-sm
              text-gray-600
            "
          >
            <Filter size={16} />
            {movimientosFiltrados.length} resultado
            {movimientosFiltrados.length !== 1 ? "s" : ""}
          </div>
        </div>
      </section>

      {/* =================================================
          TABLA
      ================================================= */}

      <section
        className="
          overflow-hidden
          rounded-xl
          border
          border-gray-200
          bg-white
          shadow-sm
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-gray-100
            px-5
            py-4
          "
        >
          <div>
            <h2
              className="
                font-semibold
                text-gray-900
              "
            >
              Historial de movimientos
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-gray-500
              "
            >
              Aportes y retiros asociados a tu cuenta de socio.
            </p>
          </div>

          <Wallet
            size={21}
            className="
              text-[var(--color-primary)]
            "
          />
        </div>

        {movimientosFiltrados.length === 0 ? (
          <div
            className="
              px-6
              py-14
              text-center
            "
          >
            <FileText
              size={42}
              className="
                mx-auto
                text-gray-300
              "
            />

            <h3
              className="
                mt-4
                text-base
                font-semibold
                text-gray-700
              "
            >
              No existen movimientos
            </h3>

            <p
              className="
                mx-auto
                mt-2
                max-w-md
                text-sm
                leading-6
                text-gray-500
              "
            >
              No encontramos aportes o retiros que coincidan con los filtros
              seleccionados.
            </p>
          </div>
        ) : (
          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-full
                divide-y
                divide-gray-200
              "
            >
              <thead
                className="
                  bg-gray-50
                "
              >
                <tr>
                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    Fecha
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    Tipo
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-right
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    Monto
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    Cuenta
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    Método
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    Referencia
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-center
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-gray-100
                  bg-white
                "
              >
                {movimientosFiltrados.map((movimiento) => (
                  <tr
                    key={movimiento.id}
                    className="
                        transition
                        hover:bg-gray-50
                      "
                  >
                    {/* FECHA */}

                    <td
                      className="
                          whitespace-nowrap
                          px-5
                          py-4
                        "
                    >
                      <div
                        className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-gray-600
                          "
                      >
                        <CalendarDays
                          size={15}
                          className="
                              text-gray-400
                            "
                        />

                        {formatearFecha(movimiento.fecha)}
                      </div>
                    </td>

                    {/* TIPO */}

                    <td
                      className="
                          whitespace-nowrap
                          px-5
                          py-4
                        "
                    >
                      <div
                        className="
                            flex
                            items-center
                            gap-2
                          "
                      >
                        <div
                          className={`
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg

                              ${
                                movimiento.tipo === "aporte"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-orange-50 text-orange-600"
                              }
                            `}
                        >
                          {movimiento.tipo === "aporte" ? (
                            <ArrowDownCircle size={16} />
                          ) : (
                            <ArrowUpCircle size={16} />
                          )}
                        </div>

                        <span
                          className="
                              text-sm
                              font-medium
                              capitalize
                              text-gray-800
                            "
                        >
                          {movimiento.tipo}
                        </span>
                      </div>
                    </td>

                    {/* MONTO */}

                    <td
                      className="
                          whitespace-nowrap
                          px-5
                          py-4
                          text-right
                          text-sm
                          font-bold
                          text-gray-900
                        "
                    >
                      {formatearMoneda(movimiento.monto)}
                    </td>

                    {/* CUENTA */}

                    <td
                      className="
                          min-w-[180px]
                          px-5
                          py-4
                        "
                    >
                      <div
                        className="
                            flex
                            items-start
                            gap-2
                          "
                      >
                        <Landmark
                          size={15}
                          className="
                              mt-0.5
                              shrink-0
                              text-gray-400
                            "
                        />

                        <div>
                          <p
                            className="
                                text-sm
                                font-medium
                                text-gray-700
                              "
                          >
                            {movimiento.cuenta_nombre || "Sin cuenta"}
                          </p>

                          {movimiento.cuenta_tipo && (
                            <p
                              className="
                                  mt-0.5
                                  text-xs
                                  capitalize
                                  text-gray-400
                                "
                            >
                              {movimiento.cuenta_tipo}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* MÉTODO */}

                    <td
                      className="
                          whitespace-nowrap
                          px-5
                          py-4
                        "
                    >
                      <div
                        className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-gray-600
                          "
                      >
                        <CreditCard
                          size={15}
                          className="
                              text-gray-400
                            "
                        />

                        {capitalizar(movimiento.metodo_pago)}
                      </div>
                    </td>

                    {/* REFERENCIA */}

                    <td
                      className="
                          min-w-[160px]
                          px-5
                          py-4
                          text-sm
                          text-gray-600
                        "
                    >
                      {movimiento.referencia || "-"}
                    </td>

                    {/* ESTADO */}

                    <td
                      className="
                          whitespace-nowrap
                          px-5
                          py-4
                          text-center
                        "
                    >
                      <EstadoBadge estado={movimiento.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =================================================
          INFORMACIÓN
      ================================================= */}

      <section
        className="
          rounded-xl
          border
          border-blue-200
          bg-blue-50
          p-4
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <AlertCircle
            size={20}
            className="
              mt-0.5
              shrink-0
              text-blue-600
            "
          />

          <div>
            <h3
              className="
                text-sm
                font-semibold
                text-blue-900
              "
            >
              Sobre tus movimientos
            </h3>

            <p
              className="
                mt-1
                text-sm
                leading-6
                text-blue-700
              "
            >
              El capital neto se calcula únicamente con aportes y retiros
              confirmados. Los movimientos pendientes no modifican tu
              participación hasta que sean confirmados por la administración.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MisAportesPage;
