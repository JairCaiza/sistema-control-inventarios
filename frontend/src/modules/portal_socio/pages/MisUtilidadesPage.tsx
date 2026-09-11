import { useEffect, useMemo, useState } from "react";

import {
  TrendingUp,
  Wallet,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  Landmark,
  CreditCard,
  FileText,
  Filter,
  DollarSign,
  Percent,
} from "lucide-react";

import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

type EstadoUtilidad = "pendiente" | "pagado" | "anulado" | string;

interface UtilidadSocio {
  id: string;

  socio_id: string;

  socio_nombre: string;

  socio_identificacion?: string | null;

  periodo: string;

  utilidad_periodo: number;

  utilidad_base: number;

  porcentaje_aplicado: number;

  monto: number;

  estado: EstadoUtilidad;

  cuenta_id?: string | null;

  cuenta_nombre?: string | null;

  cuenta_tipo?: string | null;

  metodo_pago?: string | null;

  referencia?: string | null;

  fecha_pago?: string | null;

  observaciones?: string | null;

  fecha_creacion?: string;

  fecha_actualizacion?: string;
}

interface RespuestaUtilidades {
  ok?: boolean;

  success?: boolean;

  message?: string;

  total?: number;

  data?: UtilidadSocio[];
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

const formatearPeriodo = (periodo?: string | null) => {
  if (!periodo) {
    return "-";
  }

  const partes = periodo.split("-");

  if (partes.length !== 2) {
    return periodo;
  }

  const anio = Number(partes[0]);

  const mes = Number(partes[1]);

  if (!anio || !mes || mes < 1 || mes > 12) {
    return periodo;
  }

  const fecha = new Date(anio, mes - 1, 1);

  const texto = new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
  }).format(fecha);

  return texto.charAt(0).toUpperCase() + texto.slice(1);
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
  if (estado === "pagado") {
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
        Pagado
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
        transition
        hover:shadow-md
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

function MisUtilidadesPage() {
  const [utilidades, setUtilidades] = useState<UtilidadSocio[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "pendiente" | "pagado" | "anulado"
  >("todos");

  /* =====================================================
     CARGAR UTILIDADES
  ===================================================== */

  const cargarUtilidades = async () => {
    try {
      setLoading(true);

      setError("");

      const respuesta = await api.get<RespuestaUtilidades>(
        "/utilidades-socios/mis-utilidades",
      );

      setUtilidades(respuesta.data.data ?? []);
    } catch (err: any) {
      console.error("Error al cargar utilidades del socio:", err);

      setError(
        err?.response?.data?.message || "No se pudieron cargar tus utilidades.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUtilidades();
  }, []);

  /* =====================================================
     RESÚMENES
  ===================================================== */

  const totalAsignado = useMemo(
    () =>
      utilidades
        .filter((item) => item.estado !== "anulado")
        .reduce((acumulado, item) => acumulado + Number(item.monto || 0), 0),
    [utilidades],
  );

  const totalPagado = useMemo(
    () =>
      utilidades
        .filter((item) => item.estado === "pagado")
        .reduce((acumulado, item) => acumulado + Number(item.monto || 0), 0),
    [utilidades],
  );

  const totalPendiente = useMemo(
    () =>
      utilidades
        .filter((item) => item.estado === "pendiente")
        .reduce((acumulado, item) => acumulado + Number(item.monto || 0), 0),
    [utilidades],
  );

  const cantidadDistribuciones = useMemo(
    () => utilidades.filter((item) => item.estado !== "anulado").length,
    [utilidades],
  );

  /* =====================================================
     FILTROS
  ===================================================== */

  const utilidadesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return utilidades.filter((item) => {
      const coincideEstado =
        filtroEstado === "todos" || item.estado === filtroEstado;

      const coincideBusqueda =
        !texto ||
        item.periodo?.toLowerCase().includes(texto) ||
        item.referencia?.toLowerCase().includes(texto) ||
        item.cuenta_nombre?.toLowerCase().includes(texto) ||
        item.metodo_pago?.toLowerCase().includes(texto) ||
        item.observaciones?.toLowerCase().includes(texto);

      return coincideEstado && Boolean(coincideBusqueda);
    });
  }, [utilidades, busqueda, filtroEstado]);

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
            Cargando tus utilidades...
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
              No se pudieron cargar tus utilidades
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
              onClick={cargarUtilidades}
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
              Mis utilidades
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
              Consulta las distribuciones de utilidades asignadas a tu
              participación societaria y revisa su estado de pago.
            </p>
          </div>

          <button
            onClick={cargarUtilidades}
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
          titulo="Total asignado"
          valor={formatearMoneda(totalAsignado)}
          descripcion="Utilidades no anuladas"
          icono={<TrendingUp size={22} />}
        />

        <CardResumen
          titulo="Total pagado"
          valor={formatearMoneda(totalPagado)}
          descripcion="Utilidades ya pagadas"
          icono={<CheckCircle2 size={22} />}
        />

        <CardResumen
          titulo="Pendiente"
          valor={formatearMoneda(totalPendiente)}
          descripcion="Utilidades por pagar"
          icono={<Clock3 size={22} />}
        />

        <CardResumen
          titulo="Distribuciones"
          valor={String(cantidadDistribuciones)}
          descripcion="Registros vigentes"
          icono={<FileText size={22} />}
        />
      </section>

      {/* =================================================
          SIN UTILIDADES
      ================================================= */}

      {utilidades.length === 0 ? (
        <section
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            px-6
            py-16
            text-center
            shadow-sm
          "
        >
          <div
            className="
              mx-auto
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              bg-gray-100
              text-gray-400
            "
          >
            <TrendingUp size={36} />
          </div>

          <h2
            className="
              mt-5
              text-xl
              font-semibold
              text-gray-800
            "
          >
            Todavía no tienes utilidades registradas
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-xl
              text-sm
              leading-6
              text-gray-500
            "
          >
            Cuando la administración genere una distribución de utilidades
            correspondiente a tu participación, aparecerá automáticamente en
            esta sección.
          </p>

          <div
            className="
              mx-auto
              mt-7
              max-w-lg
              rounded-xl
              border
              border-blue-200
              bg-blue-50
              p-4
              text-left
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

              <p
                className="
                  text-sm
                  leading-6
                  text-blue-700
                "
              >
                La distribución se calcula de acuerdo con tu participación sobre
                el capital neto de los socios y la utilidad disponible del
                período.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
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
                lg:flex-row
                lg:items-end
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
                    placeholder="Período, referencia, cuenta, método..."
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

              {/* ESTADO */}

              <div
                className="
                  w-full
                  lg:w-56
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
                        | "pagado"
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

                  <option value="pendiente">Pendientes</option>

                  <option value="pagado">Pagados</option>

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
                {utilidadesFiltradas.length} resultado
                {utilidadesFiltradas.length !== 1 ? "s" : ""}
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
                  Historial de utilidades
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-gray-500
                  "
                >
                  Distribuciones correspondientes a tu participación.
                </p>
              </div>

              <TrendingUp
                size={21}
                className="
                  text-[var(--color-primary)]
                "
              />
            </div>

            {utilidadesFiltradas.length === 0 ? (
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
                  No se encontraron resultados
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    text-gray-500
                  "
                >
                  Cambia los filtros para consultar otras distribuciones.
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
                        Período
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
                        Utilidad período
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
                        Participación
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
                        Mi utilidad
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
                        Pago
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
                        Referencia
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
                    {utilidadesFiltradas.map((utilidad) => (
                      <tr
                        key={utilidad.id}
                        className="
                            transition
                            hover:bg-gray-50
                          "
                      >
                        {/* PERÍODO */}

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
                            <CalendarDays
                              size={16}
                              className="
                                  text-gray-400
                                "
                            />

                            <div>
                              <p
                                className="
                                    text-sm
                                    font-semibold
                                    text-gray-800
                                  "
                              >
                                {formatearPeriodo(utilidad.periodo)}
                              </p>

                              <p
                                className="
                                    mt-0.5
                                    text-xs
                                    text-gray-400
                                  "
                              >
                                {utilidad.periodo}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* UTILIDAD DEL PERÍODO */}

                        <td
                          className="
                              whitespace-nowrap
                              px-5
                              py-4
                              text-right
                              text-sm
                              text-gray-700
                            "
                        >
                          {formatearMoneda(utilidad.utilidad_periodo)}
                        </td>

                        {/* PORCENTAJE */}

                        <td
                          className="
                              whitespace-nowrap
                              px-5
                              py-4
                              text-center
                            "
                        >
                          <div
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                bg-blue-50
                                px-2.5
                                py-1
                                text-xs
                                font-semibold
                                text-blue-700
                              "
                          >
                            <Percent size={12} />
                            {Number(utilidad.porcentaje_aplicado || 0).toFixed(
                              2,
                            )}
                            %
                          </div>
                        </td>

                        {/* MONTO DEL SOCIO */}

                        <td
                          className="
                              whitespace-nowrap
                              px-5
                              py-4
                              text-right
                            "
                        >
                          <div
                            className="
                                flex
                                items-center
                                justify-end
                                gap-2
                              "
                          >
                            <DollarSign
                              size={15}
                              className="
                                  text-gray-400
                                "
                            />

                            <span
                              className="
                                  text-sm
                                  font-bold
                                  text-gray-900
                                "
                            >
                              {formatearMoneda(utilidad.monto)}
                            </span>
                          </div>
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
                          <EstadoBadge estado={utilidad.estado} />
                        </td>

                        {/* PAGO */}

                        <td
                          className="
                              min-w-[160px]
                              px-5
                              py-4
                            "
                        >
                          {utilidad.estado === "pagado" ? (
                            <div>
                              <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    text-gray-700
                                  "
                              >
                                <CreditCard
                                  size={15}
                                  className="
                                      text-gray-400
                                    "
                                />

                                {capitalizar(utilidad.metodo_pago)}
                              </div>

                              <p
                                className="
                                    mt-1
                                    text-xs
                                    text-gray-400
                                  "
                              >
                                {formatearFecha(utilidad.fecha_pago)}
                              </p>
                            </div>
                          ) : (
                            <span
                              className="
                                  text-sm
                                  text-gray-400
                                "
                            >
                              -
                            </span>
                          )}
                        </td>

                        {/* CUENTA */}

                        <td
                          className="
                              min-w-[170px]
                              px-5
                              py-4
                            "
                        >
                          {utilidad.cuenta_nombre ? (
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
                                  {utilidad.cuenta_nombre}
                                </p>

                                {utilidad.cuenta_tipo && (
                                  <p
                                    className="
                                        mt-0.5
                                        text-xs
                                        capitalize
                                        text-gray-400
                                      "
                                  >
                                    {utilidad.cuenta_tipo}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span
                              className="
                                  text-sm
                                  text-gray-400
                                "
                            >
                              Sin asignar
                            </span>
                          )}
                        </td>

                        {/* REFERENCIA */}

                        <td
                          className="
                              min-w-[150px]
                              px-5
                              py-4
                              text-sm
                              text-gray-600
                            "
                        >
                          {utilidad.referencia || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

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
              ¿Cómo se calculan mis utilidades?
            </h3>

            <p
              className="
                mt-1
                text-sm
                leading-6
                text-blue-700
              "
            >
              La administración genera las distribuciones a partir de la
              utilidad disponible del período. El monto que corresponde a cada
              socio se calcula de acuerdo con su participación sobre el capital
              neto registrado en el sistema.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MisUtilidadesPage;
