import { useEffect, useState } from "react";

import {
  UserCircle,
  BadgeCheck,
  BadgeX,
  CreditCard,
  Phone,
  CalendarDays,
  Wallet,
  Percent,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

interface SocioPerfil {
  id: string;
  nombre: string;
  identificacion: string;
  contacto?: string | null;
  fecha_ingreso?: string | null;
  activo: boolean;

  total_aportes: number;
  total_retiros: number;
  capital_neto: number;
  porcentaje_participacion: number;
}

interface RespuestaPerfil {
  ok: boolean;
  socio?: SocioPerfil;
  data?: SocioPerfil;
  message?: string;
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
    month: "long",
    year: "numeric",
  }).format(fechaObj);
};

/* =====================================================
   COMPONENTE INFO
===================================================== */

interface InfoItemProps {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
}

function InfoItem({ titulo, valor, icono }: InfoItemProps) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
        rounded-xl
        border
        border-gray-200
        bg-white
        p-4
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-gray-100
          text-[var(--color-primary)]
        "
      >
        {icono}
      </div>

      <div>
        <p
          className="
            text-xs
            font-medium
            uppercase
            tracking-wide
            text-gray-400
          "
        >
          {titulo}
        </p>

        <p
          className="
            mt-1
            text-sm
            font-semibold
            text-gray-800
          "
        >
          {valor}
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   COMPONENTE FINANCIERO
===================================================== */

interface FinancieroCardProps {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: React.ReactNode;
}

function FinancieroCard({
  titulo,
  valor,
  descripcion,
  icono,
}: FinancieroCardProps) {
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

function MiPerfilSocioPage() {
  const [perfil, setPerfil] = useState<SocioPerfil | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =====================================================
     CARGAR PERFIL
  ===================================================== */

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      setError("");

      const respuesta = await api.get<RespuestaPerfil>("/socios/mi-perfil");

      const perfilData = respuesta.data.socio ?? respuesta.data.data ?? null;

      setPerfil(perfilData);
    } catch (err: any) {
      console.error("Error al cargar el perfil del socio:", err);

      setError(err?.response?.data?.message || "No se pudo cargar tu perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

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
            Cargando tu perfil...
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
              No se pudo cargar tu perfil
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
              onClick={cargarPerfil}
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
     SIN PERFIL
  ===================================================== */

  if (!perfil) {
    return (
      <div
        className="
          rounded-xl
          border
          border-gray-200
          bg-white
          p-8
          text-center
          shadow-sm
        "
      >
        <UserCircle
          size={44}
          className="
            mx-auto
            text-gray-300
          "
        />

        <h2
          className="
            mt-4
            text-lg
            font-semibold
            text-gray-800
          "
        >
          No hay información disponible
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-gray-500
          "
        >
          No se encontró información asociada a tu perfil de socio.
        </p>
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
        <div
          className="
            flex
            flex-col
            gap-5
            p-6
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
                h-16
                w-16
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-[var(--color-primary)]
                text-white
              "
            >
              <UserCircle size={34} />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-medium
                  text-[var(--color-primary)]
                "
              >
                Mi perfil
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
                {perfil.nombre}
              </h1>

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                {perfil.activo ? (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-green-100
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-green-700
                    "
                  >
                    <BadgeCheck size={14} />
                    Socio activo
                  </span>
                ) : (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-red-100
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-red-700
                    "
                  >
                    <BadgeX size={14} />
                    Socio inactivo
                  </span>
                )}

                <span
                  className="
                    rounded-full
                    bg-gray-100
                    px-3
                    py-1
                    text-xs
                    font-medium
                    text-gray-600
                  "
                >
                  Participación{" "}
                  {Number(perfil.porcentaje_participacion || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={cargarPerfil}
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
          DATOS PERSONALES
      ================================================= */}

      <section
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
            border-b
            border-gray-100
            pb-4
          "
        >
          <h2
            className="
              text-lg
              font-semibold
              text-gray-900
            "
          >
            Información personal
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
            "
          >
            Datos registrados en tu perfil de socio.
          </p>
        </div>

        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          <InfoItem
            titulo="Nombre"
            valor={perfil.nombre || "-"}
            icono={<UserCircle size={20} />}
          />

          <InfoItem
            titulo="Identificación"
            valor={perfil.identificacion || "-"}
            icono={<CreditCard size={20} />}
          />

          <InfoItem
            titulo="Contacto"
            valor={perfil.contacto || "No registrado"}
            icono={<Phone size={20} />}
          />

          <InfoItem
            titulo="Fecha de ingreso"
            valor={formatearFecha(perfil.fecha_ingreso)}
            icono={<CalendarDays size={20} />}
          />
        </div>
      </section>

      {/* =================================================
          INFORMACIÓN FINANCIERA
      ================================================= */}

      <section>
        <div
          className="
            mb-4
            flex
            items-end
            justify-between
            gap-4
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-semibold
                text-gray-900
              "
            >
              Información financiera
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              Resumen de tu participación societaria actual.
            </p>
          </div>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <FinancieroCard
            titulo="Aportes"
            valor={formatearMoneda(perfil.total_aportes)}
            descripcion="Aportes confirmados"
            icono={<ArrowDownCircle size={22} />}
          />

          <FinancieroCard
            titulo="Retiros"
            valor={formatearMoneda(perfil.total_retiros)}
            descripcion="Retiros confirmados"
            icono={<ArrowUpCircle size={22} />}
          />

          <FinancieroCard
            titulo="Capital neto"
            valor={formatearMoneda(perfil.capital_neto)}
            descripcion="Aportes menos retiros"
            icono={<Wallet size={22} />}
          />

          <FinancieroCard
            titulo="Participación"
            valor={`${Number(perfil.porcentaje_participacion || 0).toFixed(
              2,
            )} %`}
            descripcion="Participación según capital"
            icono={<Percent size={22} />}
          />
        </div>
      </section>

      {/* =================================================
          DETALLE DE PARTICIPACIÓN
      ================================================= */}

      <section
        className="
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-2
        "
      >
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
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                bg-gray-100
                text-[var(--color-primary)]
              "
            >
              <Wallet size={20} />
            </div>

            <div>
              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Composición de capital
              </h3>

              <p
                className="
                  text-xs
                  text-gray-500
                "
              >
                Estado actual de tus aportaciones.
              </p>
            </div>
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
                Total aportado
              </span>

              <span
                className="
                  font-semibold
                  text-gray-900
                "
              >
                {formatearMoneda(perfil.total_aportes)}
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
                Total retirado
              </span>

              <span
                className="
                  font-semibold
                  text-gray-900
                "
              >
                {formatearMoneda(perfil.total_retiros)}
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
                  font-medium
                  text-gray-700
                "
              >
                Capital neto
              </span>

              <span
                className="
                  text-xl
                  font-bold
                  text-gray-900
                "
              >
                {formatearMoneda(perfil.capital_neto)}
              </span>
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
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                bg-gray-100
                text-[var(--color-primary)]
              "
            >
              <Percent size={20} />
            </div>

            <div>
              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Participación societaria
              </h3>

              <p
                className="
                  text-xs
                  text-gray-500
                "
              >
                Calculada automáticamente según el capital neto.
              </p>
            </div>
          </div>

          <div
            className="
              mt-7
              flex
              flex-col
              items-center
              justify-center
            "
          >
            <div
              className="
                flex
                h-36
                w-36
                items-center
                justify-center
                rounded-full
                border-[11px]
                border-gray-100
              "
            >
              <div className="text-center">
                <p
                  className="
                    text-3xl
                    font-bold
                    text-gray-900
                  "
                >
                  {Number(perfil.porcentaje_participacion || 0).toFixed(2)}%
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

            <p
              className="
                mt-5
                max-w-sm
                text-center
                text-sm
                leading-6
                text-gray-500
              "
            >
              Este porcentaje se calcula automáticamente a partir de tu capital
              neto frente al capital neto total de los socios.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          AVISO
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
              Información de consulta
            </h3>

            <p
              className="
                mt-1
                text-sm
                leading-6
                text-blue-700
              "
            >
              Los datos mostrados en este portal provienen de los registros
              administrativos del sistema. Los aportes, retiros y participación
              son calculados con la información confirmada actualmente.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MiPerfilSocioPage;
