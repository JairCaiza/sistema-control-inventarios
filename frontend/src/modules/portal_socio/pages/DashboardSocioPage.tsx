import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  Percent,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  UserCircle,
  CalendarDays,
  BadgeDollarSign,
} from "lucide-react";

import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

interface ResumenSocio {
  socio_id: string;
  nombre: string;
  total_aportes: number;
  total_retiros: number;
  capital_neto: number;
  porcentaje_participacion: number;
}

interface MovimientoAporte {
  id: string;
  socio_id: string;
  socio_nombre: string;
  socio_identificacion?: string | null;

  cuenta_id?: string | null;
  cuenta_nombre?: string | null;
  cuenta_tipo?: string | null;

  tipo: "aporte" | "retiro";

  monto: number;

  fecha: string;

  metodo_pago?: string | null;

  referencia?: string | null;

  estado: "pendiente" | "confirmado" | "anulado" | string;

  observaciones?: string | null;

  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

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

  estado: "pendiente" | "pagado" | "anulado" | string;

  cuenta_nombre?: string | null;
  cuenta_tipo?: string | null;

  metodo_pago?: string | null;
  referencia?: string | null;

  fecha_pago?: string | null;

  observaciones?: string | null;

  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

interface RespuestaResumen {
  ok: boolean;
  resumen?: ResumenSocio;
  data?: ResumenSocio;
  message?: string;
}

interface RespuestaAportes {
  success?: boolean;
  ok?: boolean;
  message?: string;
  total?: number;
  data?: MovimientoAporte[];
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

const formatearPeriodo = (periodo: string) => {
  if (!periodo) {
    return "-";
  }

  const partes = periodo.split("-");

  if (partes.length !== 2) {
    return periodo;
  }

  const anio = Number(partes[0]);

  const mes = Number(partes[1]);

  if (!anio || !mes) {
    return periodo;
  }

  const fecha = new Date(anio, mes - 1, 1);

  return new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
  }).format(fecha);
};

/* =====================================================
   COMPONENTE CARD
===================================================== */

interface CardResumenProps {
  titulo: string;
  valor: string;
  subtitulo: string;
  icono: React.ReactNode;
}

function CardResumen({ titulo, valor, subtitulo, icono }: CardResumenProps) {
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
            {subtitulo}
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

function DashboardSocioPage() {
  const [resumen, setResumen] = useState<ResumenSocio | null>(null);

  const [aportes, setAportes] = useState<MovimientoAporte[]>([]);

  const [utilidades, setUtilidades] = useState<UtilidadSocio[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =====================================================
     CARGAR INFORMACIÓN
  ===================================================== */

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [respuestaResumen, respuestaAportes, respuestaUtilidades] =
        await Promise.all([
          api.get<RespuestaResumen>("/socios/mi-resumen"),

          api.get<RespuestaAportes>("/aportes-socios/mis-aportes"),

          api.get<RespuestaUtilidades>("/utilidades-socios/mis-utilidades"),
        ]);

      const resumenData =
        respuestaResumen.data.resumen ?? respuestaResumen.data.data ?? null;

      setResumen(resumenData);

      setAportes(respuestaAportes.data.data ?? []);

      setUtilidades(respuestaUtilidades.data.data ?? []);
    } catch (err: any) {
      console.error("Error al cargar dashboard del socio:", err);

      setError(
        err?.response?.data?.message ||
          "No se pudo cargar la información del portal.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  /* =====================================================
     CÁLCULOS
  ===================================================== */

  const totalUtilidades = useMemo(
    () =>
      utilidades
        .filter((item) => item.estado !== "anulado")
        .reduce((acumulado, item) => acumulado + Number(item.monto || 0), 0),
    [utilidades],
  );

  const totalUtilidadesPagadas = useMemo(
    () =>
      utilidades
        .filter((item) => item.estado === "pagado")
        .reduce((acumulado, item) => acumulado + Number(item.monto || 0), 0),
    [utilidades],
  );

  const totalUtilidadesPendientes = useMemo(
    () =>
      utilidades
        .filter((item) => item.estado === "pendiente")
        .reduce((acumulado, item) => acumulado + Number(item.monto || 0), 0),
    [utilidades],
  );

  const ultimosMovimientos = useMemo(() => {
    return [
      ...aportes.map((item) => ({
        id: item.id,
        fecha: item.fecha,
        tipo: item.tipo,
        descripcion:
          item.tipo === "aporte" ? "Aporte de capital" : "Retiro de capital",
        monto: Number(item.monto || 0),
        estado: item.estado,
      })),

      ...utilidades.map((item) => ({
        id: item.id,
        fecha: item.fecha_pago || item.fecha_creacion || "",
        tipo: "utilidad",
        descripcion: `Utilidad ${formatearPeriodo(item.periodo)}`,
        monto: Number(item.monto || 0),
        estado: item.estado,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime(),
      )
      .slice(0, 6);
  }, [aportes, utilidades]);

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
            Cargando tu información...
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
        <div className="flex items-start gap-3">
          <AlertCircle size={22} className="mt-0.5 text-red-600" />

          <div>
            <h2
              className="
                font-semibold
                text-red-800
              "
            >
              No se pudo cargar el portal
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
              onClick={cargarDashboard}
              className="
                mt-4
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
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-sm
        "
      >
        <div className="p-6 lg:p-7">
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                flex
                items-start
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[var(--color-primary)]
                  text-white
                "
              >
                <UserCircle size={30} />
              </div>

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
                  Bienvenido
                  {resumen?.nombre ? `, ${resumen.nombre}` : ""}
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
                  Consulta tu capital, participación, aportes, retiros y
                  distribuciones de utilidades.
                </p>
              </div>
            </div>

            <button
              onClick={cargarDashboard}
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
        </div>
      </section>

      {/* =================================================
          CARDS
      ================================================= */}

      <section
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-5
        "
      >
        <CardResumen
          titulo="Mi capital"
          valor={formatearMoneda(resumen?.capital_neto ?? 0)}
          subtitulo="Capital neto actual"
          icono={<Wallet size={22} />}
        />

        <CardResumen
          titulo="Participación"
          valor={`${Number(resumen?.porcentaje_participacion ?? 0).toFixed(
            2,
          )} %`}
          subtitulo="Participación societaria"
          icono={<Percent size={22} />}
        />

        <CardResumen
          titulo="Mis aportes"
          valor={formatearMoneda(resumen?.total_aportes ?? 0)}
          subtitulo="Aportes confirmados"
          icono={<ArrowDownCircle size={22} />}
        />

        <CardResumen
          titulo="Mis retiros"
          valor={formatearMoneda(resumen?.total_retiros ?? 0)}
          subtitulo="Retiros confirmados"
          icono={<ArrowUpCircle size={22} />}
        />

        <CardResumen
          titulo="Mis utilidades"
          valor={formatearMoneda(totalUtilidades)}
          subtitulo="Utilidades asignadas"
          icono={<TrendingUp size={22} />}
        />
      </section>

      {/* =================================================
          SEGUNDA FILA
      ================================================= */}

      <section
        className="
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-3
        "
      >
        {/* UTILIDADES */}

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
              items-center
              justify-between
            "
          >
            <div>
              <h2
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Estado de utilidades
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-gray-500
                "
              >
                Resumen de tus distribuciones
              </p>
            </div>

            <BadgeDollarSign
              size={22}
              className="text-[var(--color-primary)]"
            />
          </div>

          <div
            className="
              mt-5
              space-y-4
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-gray-100
                pb-3
              "
            >
              <span
                className="
                  text-sm
                  text-gray-500
                "
              >
                Pagadas
              </span>

              <span
                className="
                  font-semibold
                  text-gray-900
                "
              >
                {formatearMoneda(totalUtilidadesPagadas)}
              </span>
            </div>

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-gray-100
                pb-3
              "
            >
              <span
                className="
                  text-sm
                  text-gray-500
                "
              >
                Pendientes
              </span>

              <span
                className="
                  font-semibold
                  text-gray-900
                "
              >
                {formatearMoneda(totalUtilidadesPendientes)}
              </span>
            </div>

            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <span
                className="
                  text-sm
                  text-gray-500
                "
              >
                Distribuciones
              </span>

              <span
                className="
                  font-semibold
                  text-gray-900
                "
              >
                {utilidades.filter((item) => item.estado !== "anulado").length}
              </span>
            </div>
          </div>
        </div>

        {/* CAPITAL */}

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
              items-center
              justify-between
            "
          >
            <div>
              <h2
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Mi capital
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-gray-500
                "
              >
                Composición actual
              </p>
            </div>

            <Wallet size={22} className="text-[var(--color-primary)]" />
          </div>

          <div
            className="
              mt-5
              space-y-4
            "
          >
            <div
              className="
                flex
                justify-between
                gap-4
              "
            >
              <span
                className="
                  text-sm
                  text-gray-500
                "
              >
                Aportes
              </span>

              <span
                className="
                  font-semibold
                  text-gray-900
                "
              >
                {formatearMoneda(resumen?.total_aportes ?? 0)}
              </span>
            </div>

            <div
              className="
                flex
                justify-between
                gap-4
              "
            >
              <span
                className="
                  text-sm
                  text-gray-500
                "
              >
                Retiros
              </span>

              <span
                className="
                  font-semibold
                  text-gray-900
                "
              >
                {formatearMoneda(resumen?.total_retiros ?? 0)}
              </span>
            </div>

            <div
              className="
                border-t
                border-gray-100
                pt-4
              "
            >
              <div
                className="
                  flex
                  justify-between
                  gap-4
                "
              >
                <span
                  className="
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Capital neto
                </span>

                <span
                  className="
                    text-lg
                    font-bold
                    text-gray-900
                  "
                >
                  {formatearMoneda(resumen?.capital_neto ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PARTICIPACIÓN */}

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
              items-center
              justify-between
            "
          >
            <div>
              <h2
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Mi participación
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-gray-500
                "
              >
                Según tu capital neto
              </p>
            </div>

            <Percent size={22} className="text-[var(--color-primary)]" />
          </div>

          <div
            className="
              mt-6
              flex
              items-center
              justify-center
            "
          >
            <div
              className="
                flex
                h-32
                w-32
                items-center
                justify-center
                rounded-full
                border-[10px]
                border-gray-100
              "
            >
              <div className="text-center">
                <p
                  className="
                    text-2xl
                    font-bold
                    text-gray-900
                  "
                >
                  {Number(resumen?.porcentaje_participacion ?? 0).toFixed(2)}%
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-gray-500
                  "
                >
                  participación
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          ÚLTIMOS MOVIMIENTOS
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
              Últimos movimientos
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-gray-500
              "
            >
              Actividad reciente relacionada con tu participación.
            </p>
          </div>

          <CalendarDays size={21} className="text-[var(--color-primary)]" />
        </div>

        {ultimosMovimientos.length === 0 ? (
          <div
            className="
              px-6
              py-12
              text-center
            "
          >
            <Wallet
              size={38}
              className="
                mx-auto
                text-gray-300
              "
            />

            <h3
              className="
                mt-3
                font-medium
                text-gray-700
              "
            >
              No existen movimientos
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              Tus aportes, retiros y utilidades aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="
                min-w-full
                divide-y
                divide-gray-200
              "
            >
              <thead className="bg-gray-50">
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
                    Movimiento
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
                {ultimosMovimientos.map((movimiento) => (
                  <tr
                    key={`${movimiento.tipo}-${movimiento.id}`}
                    className="
                        transition
                        hover:bg-gray-50
                      "
                  >
                    <td
                      className="
                          whitespace-nowrap
                          px-5
                          py-4
                          text-sm
                          text-gray-600
                        "
                    >
                      {formatearFecha(movimiento.fecha)}
                    </td>

                    <td
                      className="
                          px-5
                          py-4
                        "
                    >
                      <div
                        className="
                            flex
                            items-center
                            gap-3
                          "
                      >
                        <div
                          className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-lg
                              bg-gray-100
                              text-[var(--color-primary)]
                            "
                        >
                          {movimiento.tipo === "aporte" ? (
                            <ArrowDownCircle size={17} />
                          ) : movimiento.tipo === "retiro" ? (
                            <ArrowUpCircle size={17} />
                          ) : (
                            <TrendingUp size={17} />
                          )}
                        </div>

                        <div>
                          <p
                            className="
                                text-sm
                                font-medium
                                text-gray-800
                              "
                          >
                            {movimiento.descripcion}
                          </p>

                          <p
                            className="
                                mt-0.5
                                text-xs
                                capitalize
                                text-gray-400
                              "
                          >
                            {movimiento.tipo}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td
                      className="
                          whitespace-nowrap
                          px-5
                          py-4
                          text-right
                          text-sm
                          font-semibold
                          text-gray-900
                        "
                    >
                      {formatearMoneda(movimiento.monto)}
                    </td>

                    <td
                      className="
                          whitespace-nowrap
                          px-5
                          py-4
                          text-center
                        "
                    >
                      <span
                        className="
                            inline-flex
                            rounded-full
                            bg-gray-100
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            capitalize
                            text-gray-700
                          "
                      >
                        {movimiento.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardSocioPage;
