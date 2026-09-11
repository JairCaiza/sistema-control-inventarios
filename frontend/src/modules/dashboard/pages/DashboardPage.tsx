import { useCallback, useEffect, useMemo, useState } from "react";

import type { ReactNode } from "react";

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Construction,
  FileText,
  Loader2,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { api } from "../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

interface RegistroBase {
  id?: string;
  [key: string]: unknown;
}

interface DashboardData {
  activos: RegistroBase[];
  contratos: RegistroBase[];
  clientes: RegistroBase[];
  obras: RegistroBase[];
  empleados: RegistroBase[];
  devoluciones: RegistroBase[];
  cuentas: RegistroBase[];
  asistencias: RegistroBase[];
}

interface EstadoInventario {
  nombre: string;
  cantidad: number;
  color: string;
  colorBarra: string;
  colorTexto: string;
}

interface ObraResumen {
  id: string;
  codigo: string;
  nombre: string;
  cliente: string;
  avance: number;
  empleados: number;
}

interface ActividadReciente {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  fechaOrden: number;
  tipo: "contrato" | "cliente" | "obra" | "devolucion" | "asistencia";
}

interface AlertaOperativa {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: "warning" | "danger" | "info" | "success";
}

/* =====================================================
   RUTAS
===================================================== */

const RUTAS = {
  activos: "/dashboard/activos",
  movimientos: "/dashboard/movimientos",
  contratos: "/dashboard/contratos",
  clientes: "/dashboard/clientes",
  obras: "/dashboard/obras",
  empleados: "/dashboard/empleados",
  devoluciones: "/dashboard/devoluciones",
  asistencia: "/dashboard/asistencia",
  finanzas: "/dashboard/dashboardfinanciero",
  cuentas: "/dashboard/cuentas",
};

/* =====================================================
   ESTADO INICIAL
===================================================== */

const estadoInicial: DashboardData = {
  activos: [],
  contratos: [],
  clientes: [],
  obras: [],
  empleados: [],
  devoluciones: [],
  cuentas: [],
  asistencias: [],
};

/* =====================================================
   HELPERS
===================================================== */

const extraerLista = (respuesta: unknown): RegistroBase[] => {
  if (Array.isArray(respuesta)) {
    return respuesta as RegistroBase[];
  }

  if (!respuesta || typeof respuesta !== "object") {
    return [];
  }

  const objeto = respuesta as Record<string, unknown>;

  const claves = [
    "data",
    "resultados",
    "registros",
    "items",
    "rows",
    "activos",
    "contratos",
    "clientes",
    "obras",
    "empleados",
    "devoluciones",
    "cuentas",
    "asistencias",
  ];

  for (const clave of claves) {
    const valor = objeto[clave];

    if (Array.isArray(valor)) {
      return valor as RegistroBase[];
    }

    if (valor && typeof valor === "object") {
      const interno = extraerLista(valor);

      if (interno.length > 0) {
        return interno;
      }
    }
  }

  return [];
};

const obtenerTexto = (
  registro: RegistroBase,
  campos: string[],
  defecto = "",
): string => {
  for (const campo of campos) {
    const valor = registro[campo];

    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return String(valor);
    }
  }

  return defecto;
};

const obtenerNumero = (
  registro: RegistroBase,
  campos: string[],
  defecto = 0,
): number => {
  for (const campo of campos) {
    const valor = registro[campo];

    if (valor !== undefined && valor !== null && valor !== "") {
      const numero = Number(valor);

      if (Number.isFinite(numero)) {
        return numero;
      }
    }
  }

  return defecto;
};

const obtenerBooleano = (
  registro: RegistroBase,
  campo: string,
  defecto = true,
): boolean => {
  const valor = registro[campo];

  if (valor === undefined || valor === null) {
    return defecto;
  }

  if (typeof valor === "boolean") {
    return valor;
  }

  return String(valor).toLowerCase() === "true";
};

const obtenerFecha = (
  registro: RegistroBase,
  campos: string[],
): Date | null => {
  for (const campo of campos) {
    const valor = registro[campo];

    if (!valor) {
      continue;
    }

    const fecha = new Date(String(valor));

    if (!Number.isNaN(fecha.getTime())) {
      return fecha;
    }
  }

  return null;
};

const esMesActual = (fecha: Date | null) => {
  if (!fecha) {
    return false;
  }

  const hoy = new Date();

  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth()
  );
};

const diferenciaDias = (fecha: Date) => {
  const hoy = new Date();

  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  const objetivo = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  );

  return Math.ceil((objetivo.getTime() - inicioHoy.getTime()) / 86400000);
};

const fechaRelativa = (fecha: Date | null) => {
  if (!fecha) {
    return "Sin fecha";
  }

  const diferencia = Date.now() - fecha.getTime();

  const minutos = Math.floor(diferencia / 60000);

  if (minutos < 1) {
    return "Ahora";
  }

  if (minutos < 60) {
    return `Hace ${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `Hace ${horas} h`;
  }

  const dias = Math.floor(horas / 24);

  if (dias === 1) {
    return "Ayer";
  }

  if (dias < 7) {
    return `Hace ${dias} días`;
  }

  return fecha.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
  });
};

const moneda = (valor: number) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));

/* =====================================================
   DASHBOARD
===================================================== */

function DashboardPage() {
  const navigate = useNavigate();

  const [datos, setDatos] = useState<DashboardData>(estadoInicial);

  const [cargando, setCargando] = useState(true);

  const [actualizando, setActualizando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* ===================================================
     CARGA REAL
  =================================================== */

  const cargarDashboard = useCallback(async (refrescar = false) => {
    try {
      if (refrescar) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError(null);

      const resultados = await Promise.allSettled([
        api.get("/activos"),

        api.get("/contratos"),

        api.get("/clientes"),

        api.get("/obras", {
          params: {
            limit: 100,
          },
        }),

        api.get("/empleados"),

        api.get("/devoluciones"),

        api.get("/cuentas-financieras"),

        api.get("/asistencias"),
      ]);

      const obtener = (indice: number): RegistroBase[] => {
        const resultado = resultados[indice];

        if (resultado.status === "fulfilled") {
          return extraerLista(resultado.value.data);
        }

        console.warn("Error módulo dashboard:", resultado.reason);

        return [];
      };

      setDatos({
        activos: obtener(0),

        contratos: obtener(1),

        clientes: obtener(2),

        obras: obtener(3),

        empleados: obtener(4),

        devoluciones: obtener(5),

        cuentas: obtener(6),

        asistencias: obtener(7),
      });

      const fallidos = resultados.filter(
        (resultado) => resultado.status === "rejected",
      ).length;

      if (fallidos > 0) {
        setError(
          `${fallidos} módulo${
            fallidos === 1 ? "" : "s"
          } no pudieron cargar información.`,
        );
      }
    } catch (err) {
      console.error(err);

      setError("No se pudo cargar la información del dashboard.");
    } finally {
      setCargando(false);

      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDashboard();
  }, [cargarDashboard]);

  /* ===================================================
     INVENTARIO
  =================================================== */

  const resumenInventario = useMemo<EstadoInventario[]>(() => {
    let disponibles = 0;

    let alquilados = 0;

    let mantenimiento = 0;

    let danados = 0;

    datos.activos.forEach((activo) => {
      const total = Math.max(
        1,
        obtenerNumero(activo, ["cantidad_total", "stock_total", "cantidad"], 1),
      );

      const disponible = obtenerNumero(
        activo,
        ["cantidad_disponible", "stock_disponible", "disponibles"],
        -1,
      );

      const alquilado = obtenerNumero(
        activo,
        ["cantidad_alquilada", "alquilados"],
        -1,
      );

      const mantenimientoCantidad = obtenerNumero(
        activo,
        ["cantidad_mantenimiento", "mantenimiento"],
        -1,
      );

      const danado = obtenerNumero(
        activo,
        ["cantidad_danada", "cantidad_dañada", "danados", "dañados"],
        -1,
      );

      if (
        disponible >= 0 ||
        alquilado >= 0 ||
        mantenimientoCantidad >= 0 ||
        danado >= 0
      ) {
        disponibles += Math.max(0, disponible);

        alquilados += Math.max(0, alquilado);

        mantenimiento += Math.max(0, mantenimientoCantidad);

        danados += Math.max(0, danado);

        return;
      }

      const estado = obtenerTexto(activo, ["estado", "estado_actual"])
        .toLowerCase()
        .trim();

      if (estado === "alquilado" || estado === "alquilada") {
        alquilados += total;
      } else if (estado === "mantenimiento" || estado === "en_mantenimiento") {
        mantenimiento += total;
      } else if (["dañado", "danado", "dañada", "danada"].includes(estado)) {
        danados += total;
      } else {
        disponibles += total;
      }
    });

    return [
      {
        nombre: "Disponibles",
        cantidad: disponibles,
        color: "#22c55e",
        colorBarra: "from-emerald-400 to-emerald-600",
        colorTexto: "text-emerald-600",
      },
      {
        nombre: "Alquilados",
        cantidad: alquilados,
        color: "#3b82f6",
        colorBarra: "from-blue-400 to-indigo-600",
        colorTexto: "text-blue-600",
      },
      {
        nombre: "Mantenimiento",
        cantidad: mantenimiento,
        color: "#f59e0b",
        colorBarra: "from-amber-400 to-orange-500",
        colorTexto: "text-amber-600",
      },
      {
        nombre: "Dañados",
        cantidad: danados,
        color: "#f43f5e",
        colorBarra: "from-rose-400 to-red-600",
        colorTexto: "text-rose-600",
      },
    ];
  }, [datos.activos]);

  const totalEquipos = useMemo(
    () => resumenInventario.reduce((suma, item) => suma + item.cantidad, 0),
    [resumenInventario],
  );

  const equiposDisponibles = resumenInventario[0]?.cantidad ?? 0;

  const porcentajeDisponible =
    totalEquipos > 0 ? (equiposDisponibles / totalEquipos) * 100 : 0;

  /* ===================================================
     CONTRATOS
  =================================================== */

  const contratosActivos = useMemo(
    () =>
      datos.contratos.filter(
        (contrato) =>
          obtenerTexto(contrato, ["estado"]).toLowerCase() === "activo",
      ).length,
    [datos.contratos],
  );

  const contratosMes = useMemo(
    () =>
      datos.contratos.filter((contrato) =>
        esMesActual(
          obtenerFecha(contrato, ["fecha_creacion", "fecha_inicio", "fecha"]),
        ),
      ).length,
    [datos.contratos],
  );

  /* ===================================================
     CLIENTES
  =================================================== */

  const clientesMes = useMemo(
    () =>
      datos.clientes.filter((cliente) =>
        esMesActual(obtenerFecha(cliente, ["fecha_creacion", "created_at"])),
      ).length,
    [datos.clientes],
  );

  /* ===================================================
     EMPLEADOS
  =================================================== */

  const empleadosActivos = useMemo(
    () =>
      datos.empleados.filter((empleado) =>
        obtenerBooleano(empleado, "activo", true),
      ).length,
    [datos.empleados],
  );

  /* ===================================================
     OBRAS
  =================================================== */

  const obrasEnProceso = useMemo(
    () =>
      datos.obras.filter(
        (obra) => obtenerTexto(obra, ["estado"]) === "en_proceso",
      ).length,
    [datos.obras],
  );

  const obrasActivas = useMemo<ObraResumen[]>(() => {
    return datos.obras
      .filter((obra) => obtenerTexto(obra, ["estado"]) === "en_proceso")
      .map((obra) => ({
        id: String(obra.id ?? ""),

        codigo: obtenerTexto(obra, ["codigo"], "S/C"),

        nombre: obtenerTexto(obra, ["nombre"], "Obra"),

        cliente: obtenerTexto(
          obra,
          ["cliente_nombre", "cliente", "nombre_cliente", "razon_social"],
          "Sin cliente",
        ),

        avance: Math.min(
          100,
          Math.max(
            0,
            obtenerNumero(obra, [
              "avance",
              "avance_promedio",
              "porcentaje_avance",
            ]),
          ),
        ),

        empleados: obtenerNumero(obra, [
          "empleados_activos",
          "total_empleados",
          "empleados",
        ]),
      }))
      .slice(0, 4);
  }, [datos.obras]);

  /* ===================================================
     DEVOLUCIONES
  =================================================== */

  const devolucionesMes = useMemo(
    () =>
      datos.devoluciones.filter((devolucion) =>
        esMesActual(
          obtenerFecha(devolucion, [
            "fecha_devolucion",
            "fecha_creacion",
            "fecha",
          ]),
        ),
      ).length,
    [datos.devoluciones],
  );

  /* ===================================================
     ASISTENCIA
  =================================================== */

  const asistenciasMes = useMemo(
    () =>
      datos.asistencias.filter((asistencia) =>
        esMesActual(obtenerFecha(asistencia, ["fecha", "fecha_creacion"])),
      ).length,
    [datos.asistencias],
  );

  /* ===================================================
     FINANZAS
  =================================================== */

  const cuentasActivas = useMemo(
    () =>
      datos.cuentas.filter((cuenta) => obtenerBooleano(cuenta, "activo", true)),
    [datos.cuentas],
  );

  const saldoTotal = useMemo(
    () =>
      cuentasActivas.reduce(
        (suma, cuenta) =>
          suma + obtenerNumero(cuenta, ["saldo_actual", "saldo"]),
        0,
      ),
    [cuentasActivas],
  );

  /* ===================================================
     ACTIVIDAD
  =================================================== */

  const actividades = useMemo<ActividadReciente[]>(() => {
    const lista: ActividadReciente[] = [];

    datos.contratos.forEach((registro) => {
      const fecha = obtenerFecha(registro, ["fecha_creacion", "fecha_inicio"]);

      if (!fecha) {
        return;
      }

      lista.push({
        id: `contrato-${registro.id ?? fecha.getTime()}`,
        titulo: "Contrato registrado",
        descripcion: obtenerTexto(
          registro,
          ["numero_contrato", "numero"],
          "Nuevo contrato",
        ),
        fecha: fechaRelativa(fecha),
        fechaOrden: fecha.getTime(),
        tipo: "contrato",
      });
    });

    datos.clientes.forEach((registro) => {
      const fecha = obtenerFecha(registro, ["fecha_creacion", "created_at"]);

      if (!fecha) {
        return;
      }

      lista.push({
        id: `cliente-${registro.id ?? fecha.getTime()}`,
        titulo: "Cliente registrado",
        descripcion: obtenerTexto(
          registro,
          ["nombre", "nombres", "razon_social", "nombre_completo"],
          "Nuevo cliente",
        ),
        fecha: fechaRelativa(fecha),
        fechaOrden: fecha.getTime(),
        tipo: "cliente",
      });
    });

    datos.obras.forEach((registro) => {
      const fecha = obtenerFecha(registro, ["fecha_creacion", "fecha_inicio"]);

      if (!fecha) {
        return;
      }

      lista.push({
        id: `obra-${registro.id ?? fecha.getTime()}`,
        titulo: "Obra registrada",
        descripcion: `${obtenerTexto(registro, ["codigo"])} ${obtenerTexto(
          registro,
          ["nombre"],
        )}`.trim(),
        fecha: fechaRelativa(fecha),
        fechaOrden: fecha.getTime(),
        tipo: "obra",
      });
    });

    datos.devoluciones.forEach((registro) => {
      const fecha = obtenerFecha(registro, [
        "fecha_devolucion",
        "fecha_creacion",
      ]);

      if (!fecha) {
        return;
      }

      lista.push({
        id: `dev-${registro.id ?? fecha.getTime()}`,
        titulo: "Devolución registrada",
        descripcion: "Retorno de activos registrado",
        fecha: fechaRelativa(fecha),
        fechaOrden: fecha.getTime(),
        tipo: "devolucion",
      });
    });

    datos.asistencias.forEach((registro) => {
      const fecha = obtenerFecha(registro, ["fecha_creacion", "fecha"]);

      if (!fecha) {
        return;
      }

      lista.push({
        id: `asis-${registro.id ?? fecha.getTime()}`,
        titulo: "Asistencia registrada",
        descripcion:
          `${obtenerTexto(registro, [
            "nombres",
            "empleado_nombres",
          ])} ${obtenerTexto(registro, [
            "apellidos",
            "empleado_apellidos",
          ])}`.trim() || "Registro de asistencia",
        fecha: fechaRelativa(fecha),
        fechaOrden: fecha.getTime(),
        tipo: "asistencia",
      });
    });

    return lista.sort((a, b) => b.fechaOrden - a.fechaOrden).slice(0, 5);
  }, [datos]);

  /* ===================================================
     ALERTAS
  =================================================== */

  const alertas = useMemo<AlertaOperativa[]>(() => {
    const lista: AlertaOperativa[] = [];

    const mantenimiento = resumenInventario[2]?.cantidad ?? 0;

    const danados = resumenInventario[3]?.cantidad ?? 0;

    if (mantenimiento > 0) {
      lista.push({
        id: "mantenimiento",
        titulo: `${mantenimiento} activo${
          mantenimiento === 1 ? "" : "s"
        } en mantenimiento`,
        descripcion: "Equipos temporalmente no disponibles.",
        tipo: "warning",
      });
    }

    if (danados > 0) {
      lista.push({
        id: "danados",
        titulo: `${danados} activo${danados === 1 ? "" : "s"} dañado${
          danados === 1 ? "" : "s"
        }`,
        descripcion: "Requieren revisión antes de volver a utilizarse.",
        tipo: "danger",
      });
    }

    const proximos = datos.contratos.filter((contrato) => {
      if (obtenerTexto(contrato, ["estado"]) !== "activo") {
        return false;
      }

      const fecha = obtenerFecha(contrato, ["fecha_fin", "fecha_fin_prevista"]);

      if (!fecha) {
        return false;
      }

      const dias = diferenciaDias(fecha);

      return dias >= 0 && dias <= 3;
    }).length;

    if (proximos > 0) {
      lista.push({
        id: "vencimiento",
        titulo: `${proximos} contrato${proximos === 1 ? "" : "s"} próximo${
          proximos === 1 ? "" : "s"
        } a vencer`,
        descripcion: "Finalizan dentro de los próximos tres días.",
        tipo: "info",
      });
    }

    if (lista.length === 0) {
      lista.push({
        id: "ok",
        titulo: "Operación estable",
        descripcion: "No existen alertas críticas en este momento.",
        tipo: "success",
      });
    }

    return lista.slice(0, 4);
  }, [datos.contratos, resumenInventario]);

  /* ===================================================
     LOADING
  =================================================== */

  if (cargando) {
    return (
      <div
        className="
          flex
          min-h-[520px]
          items-center
          justify-center
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-blue-600
              to-violet-600
              shadow-xl
              shadow-blue-500/20
            "
          >
            <Loader2
              size={30}
              className="
                animate-spin
                text-white
              "
            />
          </div>

          <p
            className="
              mt-4
              font-medium
              text-slate-500
            "
          >
            Cargando Dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div
      className="
        space-y-6
        pb-8
      "
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          flex
          flex-col
          gap-5
          xl:flex-row
          xl:items-center
          xl:justify-between
        "
      >
        <div>
          <div
            className="
              mb-2
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                inline-flex
                h-2.5
                w-2.5
                rounded-full
                bg-emerald-500
                shadow-[0_0_0_5px_rgba(16,185,129,0.12)]
              "
            />

            <span
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.16em]
                text-emerald-600
              "
            >
              Sistema operativo
            </span>
          </div>

          <h1
            className="
              text-3xl
              font-black
              tracking-tight
              text-slate-900
              md:text-4xl
            "
          >
            Dashboard General
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
              md:text-base
            "
          >
            Información operativa de ConstructSys en tiempo real.
          </p>
        </div>

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              shadow-sm
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
              "
            >
              <CalendarDays size={18} />
            </div>

            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Fecha
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  capitalize
                  text-slate-700
                "
              >
                {new Date().toLocaleDateString("es-EC", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void cargarDashboard(true)}
            disabled={actualizando}
            className="
              inline-flex
              items-center
              gap-2
              rounded-2xl
              bg-gradient-to-r
              from-blue-600
              to-indigo-600
              px-5
              py-3
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-blue-500/20
              transition
              hover:-translate-y-0.5
              hover:shadow-xl
              disabled:opacity-60
            "
          >
            <RefreshCw
              size={17}
              className={actualizando ? "animate-spin" : ""}
            />

            {actualizando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-amber-200
            bg-gradient-to-r
            from-amber-50
            to-orange-50
            p-4
            text-sm
            font-medium
            text-amber-800
          "
        >
          <AlertTriangle size={19} />

          {error}
        </div>
      )}

      {/* =================================================
          KPIS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <KpiCard
          titulo="Equipos disponibles"
          valor={String(equiposDisponibles)}
          descripcion={`${porcentajeDisponible.toFixed(1)}% del inventario`}
          icono={<PackageCheck size={22} />}
          variante="emerald"
        />

        <KpiCard
          titulo="Contratos activos"
          valor={String(contratosActivos)}
          descripcion={`${contratosMes} registrados este mes`}
          icono={<FileText size={22} />}
          variante="blue"
        />

        <KpiCard
          titulo="Obras en ejecución"
          valor={String(obrasEnProceso)}
          descripcion={`${datos.obras.length} obras registradas`}
          icono={<Construction size={22} />}
          variante="orange"
        />

        <KpiCard
          titulo="Clientes registrados"
          valor={String(datos.clientes.length)}
          descripcion={`${clientesMes} nuevos este mes`}
          icono={<Users size={22} />}
          variante="violet"
        />
      </div>

      {/* =================================================
          GRÁFICOS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          xl:grid-cols-3
        "
      >
        {/* ===============================================
            DONUT INVENTARIO
        =============================================== */}

        <div
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(15,23,42,0.06)]
          "
        >
          <PanelHeader
            titulo="Estado del inventario"
            descripcion="Distribución de activos"
            icono={<Boxes size={19} />}
          />

          <div
            className="
              mt-6
              flex
              flex-col
              items-center
            "
          >
            <DonutInventario datos={resumenInventario} total={totalEquipos} />

            <div
              className="
                mt-7
                w-full
                space-y-3
              "
            >
              {resumenInventario.map((item) => {
                const porcentaje =
                  totalEquipos > 0 ? (item.cantidad / totalEquipos) * 100 : 0;

                return (
                  <div
                    key={item.nombre}
                    className="
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                  >
                    <div
                      className="
                          flex
                          min-w-0
                          items-center
                          gap-2.5
                        "
                    >
                      <span
                        className="
                            h-2.5
                            w-2.5
                            shrink-0
                            rounded-full
                          "
                        style={{
                          backgroundColor: item.color,
                        }}
                      />

                      <span
                        className="
                            truncate
                            text-sm
                            font-medium
                            text-slate-600
                          "
                      >
                        {item.nombre}
                      </span>
                    </div>

                    <div
                      className="
                          flex
                          items-center
                          gap-3
                        "
                    >
                      <span
                        className="
                            text-xs
                            font-semibold
                            text-slate-400
                          "
                      >
                        {porcentaje.toFixed(1)}%
                      </span>

                      <span
                        className={`min-w-8 text-right text-sm font-black ${item.colorTexto}`}
                      >
                        {item.cantidad}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===============================================
            BARRAS OPERACIÓN
        =============================================== */}

        <div
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(15,23,42,0.06)]
          "
        >
          <PanelHeader
            titulo="Actividad del mes"
            descripcion="Registros operativos"
            icono={<TrendingUp size={19} />}
          />

          <div
            className="
              mt-7
              flex
              h-[250px]
              items-end
              justify-around
              gap-4
              border-b
              border-slate-100
              px-2
            "
          >
            <BarraVertical
              titulo="Contratos"
              valor={contratosMes}
              maximo={Math.max(
                contratosMes,
                devolucionesMes,
                asistenciasMes,
                clientesMes,
                1,
              )}
              gradiente="from-blue-400 to-blue-600"
            />

            <BarraVertical
              titulo="Clientes"
              valor={clientesMes}
              maximo={Math.max(
                contratosMes,
                devolucionesMes,
                asistenciasMes,
                clientesMes,
                1,
              )}
              gradiente="from-violet-400 to-violet-600"
            />

            <BarraVertical
              titulo="Devol."
              valor={devolucionesMes}
              maximo={Math.max(
                contratosMes,
                devolucionesMes,
                asistenciasMes,
                clientesMes,
                1,
              )}
              gradiente="from-orange-400 to-orange-600"
            />

            <BarraVertical
              titulo="Asistencia"
              valor={asistenciasMes}
              maximo={Math.max(
                contratosMes,
                devolucionesMes,
                asistenciasMes,
                clientesMes,
                1,
              )}
              gradiente="from-emerald-400 to-emerald-600"
            />
          </div>

          <div
            className="
              mt-5
              grid
              grid-cols-2
              gap-3
            "
          >
            <MiniResumen
              titulo="Personal activo"
              valor={String(empleadosActivos)}
              clase="bg-cyan-50 text-cyan-700"
            />

            <MiniResumen
              titulo="Obras activas"
              valor={String(obrasEnProceso)}
              clase="bg-amber-50 text-amber-700"
            />
          </div>
        </div>

        {/* ===============================================
            FINANZAS
        =============================================== */}

        <div
          className="
            relative
            overflow-hidden
            rounded-[24px]
            bg-gradient-to-br
            from-[#111827]
            via-[#172554]
            to-[#312e81]
            p-6
            text-white
            shadow-[0_18px_45px_rgba(30,64,175,0.18)]
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-16
              h-48
              w-48
              rounded-full
              bg-blue-400/20
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-20
              -left-16
              h-52
              w-52
              rounded-full
              bg-violet-500/20
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-blue-300
                  "
                >
                  Finanzas
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                  "
                >
                  Resumen financiero
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-300
                  "
                >
                  Saldo disponible actual
                </p>
              </div>

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white/10
                  text-blue-200
                  backdrop-blur
                "
              >
                <Wallet size={21} />
              </div>
            </div>

            <div
              className="
                mt-7
                rounded-2xl
                border
                border-white/10
                bg-white/10
                p-5
                backdrop-blur-md
              "
            >
              <p
                className="
                  text-sm
                  text-slate-300
                "
              >
                Saldo consolidado
              </p>

              <p
                className="
                  mt-2
                  text-4xl
                  font-black
                  tracking-tight
                "
              >
                {moneda(saldoTotal)}
              </p>

              <div
                className="
                  mt-4
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-emerald-300
                "
              >
                <TrendingUp size={16} />
                {cuentasActivas.length} cuenta
                {cuentasActivas.length === 1 ? "" : "s"} activa
                {cuentasActivas.length === 1 ? "" : "s"}
              </div>
            </div>

            <div
              className="
                mt-5
                space-y-3
              "
            >
              {cuentasActivas.slice(0, 3).map((cuenta) => {
                const saldo = obtenerNumero(cuenta, ["saldo_actual", "saldo"]);

                const porcentaje =
                  saldoTotal > 0
                    ? Math.max(0, Math.min(100, (saldo / saldoTotal) * 100))
                    : 0;

                return (
                  <div
                    key={String(cuenta.id ?? obtenerTexto(cuenta, ["nombre"]))}
                  >
                    <div
                      className="
                            mb-1.5
                            flex
                            justify-between
                            gap-3
                            text-xs
                          "
                    >
                      <span
                        className="
                              truncate
                              text-slate-300
                            "
                      >
                        {obtenerTexto(cuenta, ["nombre"], "Cuenta")}
                      </span>

                      <span className="font-bold">{moneda(saldo)}</span>
                    </div>

                    <div
                      className="
                            h-1.5
                            overflow-hidden
                            rounded-full
                            bg-white/10
                          "
                    >
                      <div
                        className="
                              h-full
                              rounded-full
                              bg-gradient-to-r
                              from-cyan-400
                              via-blue-400
                              to-violet-400
                            "
                        style={{
                          width: `${porcentaje}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigate(RUTAS.finanzas)}
              className="
                mt-6
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-4
                py-3
                text-sm
                font-bold
                text-blue-700
                transition
                hover:bg-blue-50
              "
            >
              Ver finanzas
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          INVENTARIO BARRAS
      ================================================= */}

      <div
        className="
          rounded-[24px]
          border
          border-slate-200
          bg-white
          p-6
          shadow-[0_10px_35px_rgba(15,23,42,0.05)]
        "
      >
        <PanelHeader
          titulo="Distribución de inventario"
          descripcion="Disponibilidad general por estado"
          icono={<PackageOpen size={19} />}
        />

        <div
          className="
            mt-6
            grid
            gap-5
            md:grid-cols-2
          "
        >
          {resumenInventario.map((item) => {
            const porcentaje =
              totalEquipos > 0 ? (item.cantidad / totalEquipos) * 100 : 0;

            return (
              <div
                key={item.nombre}
                className="
                    rounded-2xl
                    border
                    border-slate-100
                    bg-slate-50/70
                    p-4
                  "
              >
                <div
                  className="
                      mb-3
                      flex
                      items-end
                      justify-between
                    "
                >
                  <div>
                    <p
                      className="
                          text-sm
                          font-semibold
                          text-slate-700
                        "
                    >
                      {item.nombre}
                    </p>

                    <p
                      className="
                          mt-1
                          text-xs
                          text-slate-400
                        "
                    >
                      {porcentaje.toFixed(1)}% del total
                    </p>
                  </div>

                  <p className={`text-2xl font-black ${item.colorTexto}`}>
                    {item.cantidad}
                  </p>
                </div>

                <div
                  className="
                      h-3
                      overflow-hidden
                      rounded-full
                      bg-white
                      shadow-inner
                    "
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.colorBarra}`}
                    style={{
                      width: `${Math.min(porcentaje, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================
          OBRAS
      ================================================= */}

      <div
        className="
          rounded-[24px]
          border
          border-slate-200
          bg-white
          p-6
          shadow-[0_10px_35px_rgba(15,23,42,0.05)]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <PanelHeader
            titulo="Obras en ejecución"
            descripcion="Seguimiento del avance operativo"
            icono={<Building2 size={19} />}
          />

          <button
            type="button"
            onClick={() => navigate(RUTAS.obras)}
            className="
              inline-flex
              items-center
              gap-2
              self-start
              rounded-xl
              bg-blue-50
              px-4
              py-2
              text-sm
              font-bold
              text-blue-600
              transition
              hover:bg-blue-100
            "
          >
            Ver todas
            <ArrowRight size={16} />
          </button>
        </div>

        {obrasActivas.length === 0 ? (
          <div
            className="
              mt-6
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-slate-50
              py-12
              text-center
            "
          >
            <Construction
              size={38}
              className="
                mx-auto
                text-slate-300
              "
            />

            <p
              className="
                mt-3
                font-semibold
                text-slate-600
              "
            >
              No existen obras en proceso
            </p>
          </div>
        ) : (
          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {obrasActivas.map((obra, index) => (
              <button
                key={obra.id}
                type="button"
                onClick={() => navigate(`/dashboard/obras/${obra.id}`)}
                className="
                    group
                    relative
                    overflow-hidden
                    rounded-[20px]
                    border
                    border-slate-200
                    bg-gradient-to-br
                    from-white
                    to-slate-50
                    p-5
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-blue-300
                    hover:shadow-xl
                  "
              >
                <div
                  className={`absolute left-0 top-0 h-1 w-full ${
                    index % 4 === 0
                      ? "bg-gradient-to-r from-blue-400 to-cyan-400"
                      : index % 4 === 1
                        ? "bg-gradient-to-r from-violet-400 to-fuchsia-400"
                        : index % 4 === 2
                          ? "bg-gradient-to-r from-orange-400 to-amber-400"
                          : "bg-gradient-to-r from-emerald-400 to-teal-400"
                  }`}
                />

                <div
                  className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                >
                  <div>
                    <span
                      className="
                          inline-flex
                          rounded-lg
                          bg-blue-50
                          px-2.5
                          py-1
                          text-xs
                          font-bold
                          text-blue-600
                        "
                    >
                      {obra.codigo}
                    </span>

                    <h3
                      className="
                          mt-3
                          line-clamp-2
                          font-bold
                          text-slate-800
                        "
                    >
                      {obra.nombre}
                    </h3>

                    <p
                      className="
                          mt-1
                          truncate
                          text-sm
                          text-slate-500
                        "
                    >
                      {obra.cliente}
                    </p>
                  </div>

                  <div
                    className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-orange-50
                        text-orange-600
                      "
                  >
                    <Construction size={19} />
                  </div>
                </div>

                <div className="mt-5">
                  <div
                    className="
                        mb-2
                        flex
                        items-center
                        justify-between
                      "
                  >
                    <span
                      className="
                          text-xs
                          font-medium
                          text-slate-500
                        "
                    >
                      Avance
                    </span>

                    <span
                      className="
                          text-sm
                          font-black
                          text-slate-800
                        "
                    >
                      {obra.avance}%
                    </span>
                  </div>

                  <div
                    className="
                        h-2
                        overflow-hidden
                        rounded-full
                        bg-slate-100
                      "
                  >
                    <div
                      className="
                          h-full
                          rounded-full
                          bg-gradient-to-r
                          from-blue-500
                          via-indigo-500
                          to-violet-500
                        "
                      style={{
                        width: `${obra.avance}%`,
                      }}
                    />
                  </div>
                </div>

                <div
                  className="
                      mt-5
                      flex
                      items-center
                      justify-between
                      border-t
                      border-slate-100
                      pt-4
                    "
                >
                  <div
                    className="
                        flex
                        items-center
                        gap-2
                        text-xs
                        font-medium
                        text-slate-500
                      "
                  >
                    <Users size={15} />
                    {obra.empleados} empleados
                  </div>

                  <span
                    className="
                        rounded-full
                        bg-emerald-50
                        px-2.5
                        py-1
                        text-[11px]
                        font-bold
                        text-emerald-600
                      "
                  >
                    En proceso
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =================================================
          ACTIVIDAD + ALERTAS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          xl:grid-cols-2
        "
      >
        {/* ACTIVIDAD */}

        <div
          className="
            overflow-hidden
            rounded-[24px]
            border
            border-slate-200
            bg-white
            shadow-[0_10px_35px_rgba(15,23,42,0.05)]
          "
        >
          <div
            className="
              border-b
              border-slate-100
              p-6
            "
          >
            <PanelHeader
              titulo="Actividad reciente"
              descripcion="Últimos movimientos registrados"
              icono={<Clock3 size={19} />}
            />
          </div>

          {actividades.length === 0 ? (
            <div
              className="
                p-10
                text-center
                text-sm
                text-slate-400
              "
            >
              No existe actividad reciente.
            </div>
          ) : (
            <div>
              {actividades.map((actividad, index) => (
                <div
                  key={actividad.id}
                  className="
                      relative
                      flex
                      gap-4
                      border-b
                      border-slate-100
                      px-6
                      py-4
                      transition
                      last:border-none
                      hover:bg-slate-50
                    "
                >
                  <div
                    className="
                        relative
                        flex
                        flex-col
                        items-center
                      "
                  >
                    <div
                      className={`
                          z-10
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl

                          ${
                            actividad.tipo === "contrato"
                              ? "bg-blue-50 text-blue-600"
                              : actividad.tipo === "cliente"
                                ? "bg-violet-50 text-violet-600"
                                : actividad.tipo === "obra"
                                  ? "bg-orange-50 text-orange-600"
                                  : actividad.tipo === "devolucion"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-cyan-50 text-cyan-600"
                          }
                        `}
                    >
                      {actividad.tipo === "contrato" ? (
                        <FileText size={17} />
                      ) : actividad.tipo === "cliente" ? (
                        <Users size={17} />
                      ) : actividad.tipo === "obra" ? (
                        <Construction size={17} />
                      ) : actividad.tipo === "devolucion" ? (
                        <PackageOpen size={17} />
                      ) : (
                        <UserRound size={17} />
                      )}
                    </div>

                    {index < actividades.length - 1 && (
                      <div
                        className="
                            absolute
                            top-10
                            h-[42px]
                            w-px
                            bg-slate-200
                          "
                      />
                    )}
                  </div>

                  <div
                    className="
                        min-w-0
                        flex-1
                      "
                  >
                    <div
                      className="
                          flex
                          items-start
                          justify-between
                          gap-3
                        "
                    >
                      <div>
                        <p
                          className="
                              font-bold
                              text-slate-800
                            "
                        >
                          {actividad.titulo}
                        </p>

                        <p
                          className="
                              mt-1
                              text-sm
                              text-slate-500
                            "
                        >
                          {actividad.descripcion}
                        </p>
                      </div>

                      <span
                        className="
                            whitespace-nowrap
                            text-xs
                            font-medium
                            text-slate-400
                          "
                      >
                        {actividad.fecha}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ALERTAS */}

        <div
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(15,23,42,0.05)]
          "
        >
          <PanelHeader
            titulo="Alertas operativas"
            descripcion="Situaciones que requieren atención"
            icono={<AlertTriangle size={19} />}
          />

          <div
            className="
              mt-6
              space-y-3
            "
          >
            {alertas.map((alerta) => (
              <AlertaCard key={alerta.id} alerta={alerta} />
            ))}
          </div>

          <div
            className="
              mt-6
              rounded-2xl
              bg-gradient-to-r
              from-emerald-50
              via-cyan-50
              to-blue-50
              p-4
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
                  rounded-xl
                  bg-white
                  text-emerald-600
                  shadow-sm
                "
              >
                <CheckCircle2 size={20} />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-bold
                    text-slate-800
                  "
                >
                  Sistema actualizado
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-slate-500
                  "
                >
                  La información proviene de los módulos reales de ConstructSys.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MÓDULOS
      ================================================= */}

      <div
        className="
          rounded-[24px]
          border
          border-slate-200
          bg-white
          p-6
          shadow-[0_10px_35px_rgba(15,23,42,0.05)]
        "
      >
        <PanelHeader
          titulo="Módulos principales"
          descripcion="Acceso rápido a las áreas del sistema"
          icono={<Boxes size={19} />}
        />

        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
          <ModuloCard
            titulo="Inventario"
            descripcion="Equipos, existencias y movimientos"
            valor={`${totalEquipos} activos`}
            icono={<Boxes size={22} />}
            gradiente="from-blue-500 to-cyan-500"
            onClick={() => navigate(RUTAS.activos)}
          />

          <ModuloCard
            titulo="Alquileres"
            descripcion="Contratos y devoluciones"
            valor={`${contratosActivos} contratos activos`}
            icono={<Truck size={22} />}
            gradiente="from-orange-500 to-amber-500"
            onClick={() => navigate(RUTAS.contratos)}
          />

          <ModuloCard
            titulo="Gestión de obras"
            descripcion="Avance, personal y operación"
            valor={`${obrasEnProceso} en ejecución`}
            icono={<Construction size={22} />}
            gradiente="from-violet-500 to-fuchsia-500"
            onClick={() => navigate(RUTAS.obras)}
          />

          <ModuloCard
            titulo="Personal"
            descripcion="Empleados y asistencia"
            valor={`${empleadosActivos} empleados activos`}
            icono={<Users size={22} />}
            gradiente="from-cyan-500 to-blue-500"
            onClick={() => navigate(RUTAS.empleados)}
          />

          <ModuloCard
            titulo="Clientes"
            descripcion="Personas y empresas"
            valor={`${datos.clientes.length} clientes`}
            icono={<UserRound size={22} />}
            gradiente="from-emerald-500 to-teal-500"
            onClick={() => navigate(RUTAS.clientes)}
          />

          <ModuloCard
            titulo="Finanzas"
            descripcion="Cuentas y flujo financiero"
            valor={moneda(saldoTotal)}
            icono={<CircleDollarSign size={22} />}
            gradiente="from-indigo-500 to-violet-600"
            onClick={() => navigate(RUTAS.finanzas)}
          />
        </div>
      </div>

      {/* =================================================
          ACCESOS RÁPIDOS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-2
          gap-3
          md:grid-cols-3
          xl:grid-cols-6
        "
      >
        <AccesoRapido
          titulo="Inventario"
          icono={<PackageOpen size={20} />}
          clase="bg-blue-50 text-blue-600 hover:border-blue-300"
          onClick={() => navigate(RUTAS.activos)}
        />

        <AccesoRapido
          titulo="Contratos"
          icono={<FileText size={20} />}
          clase="bg-orange-50 text-orange-600 hover:border-orange-300"
          onClick={() => navigate(RUTAS.contratos)}
        />

        <AccesoRapido
          titulo="Clientes"
          icono={<Users size={20} />}
          clase="bg-violet-50 text-violet-600 hover:border-violet-300"
          onClick={() => navigate(RUTAS.clientes)}
        />

        <AccesoRapido
          titulo="Obras"
          icono={<Building2 size={20} />}
          clase="bg-amber-50 text-amber-600 hover:border-amber-300"
          onClick={() => navigate(RUTAS.obras)}
        />

        <AccesoRapido
          titulo="Movimientos"
          icono={<Wrench size={20} />}
          clase="bg-cyan-50 text-cyan-600 hover:border-cyan-300"
          onClick={() => navigate(RUTAS.movimientos)}
        />

        <AccesoRapido
          titulo="Finanzas"
          icono={<Wallet size={20} />}
          clase="bg-emerald-50 text-emerald-600 hover:border-emerald-300"
          onClick={() => navigate(RUTAS.finanzas)}
        />
      </div>
    </div>
  );
}

/* =====================================================
   KPI CARD
===================================================== */

interface KpiCardProps {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: ReactNode;
  variante: "blue" | "emerald" | "orange" | "violet";
}

function KpiCard({
  titulo,
  valor,
  descripcion,
  icono,
  variante,
}: KpiCardProps) {
  const estilos = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      barra: "from-blue-400 via-blue-500 to-indigo-600",
      glow: "bg-blue-400/10",
      mini: "text-blue-600 bg-blue-50",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      barra: "from-emerald-400 via-emerald-500 to-teal-500",
      glow: "bg-emerald-400/10",
      mini: "text-emerald-600 bg-emerald-50",
    },

    orange: {
      icon: "bg-orange-50 text-orange-600",
      barra: "from-orange-400 via-orange-500 to-amber-500",
      glow: "bg-orange-400/10",
      mini: "text-orange-600 bg-orange-50",
    },

    violet: {
      icon: "bg-violet-50 text-violet-600",
      barra: "from-violet-400 via-violet-500 to-fuchsia-500",
      glow: "bg-violet-400/10",
      mini: "text-violet-600 bg-violet-50",
    },
  }[variante];

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(15,23,42,0.05)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]
      "
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${estilos.glow} blur-2xl`}
      />

      <div
        className="
          relative
          z-10
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
              font-semibold
              text-slate-500
            "
          >
            {titulo}
          </p>

          <p
            className="
              mt-2
              text-3xl
              font-black
              tracking-tight
              text-slate-900
            "
          >
            {valor}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${estilos.icon}`}
        >
          {icono}
        </div>
      </div>

      <div
        className="
          relative
          z-10
          mt-4
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${estilos.mini}`}
        >
          {descripcion}
        </span>

        <MiniSparkline variante={variante} />
      </div>

      <div
        className={`absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r ${estilos.barra}`}
      />
    </div>
  );
}

/* =====================================================
   SPARKLINE
===================================================== */

function MiniSparkline({
  variante,
}: {
  variante: "blue" | "emerald" | "orange" | "violet";
}) {
  const color =
    variante === "blue"
      ? "#2563eb"
      : variante === "emerald"
        ? "#10b981"
        : variante === "orange"
          ? "#f97316"
          : "#8b5cf6";

  return (
    <svg width="70" height="30" viewBox="0 0 70 30" fill="none">
      <path
        d="M2 24 C8 22, 10 15, 16 17 C22 19, 26 9, 32 12 C38 15, 42 5, 48 8 C55 11, 58 4, 68 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M2 24 C8 22, 10 15, 16 17 C22 19, 26 9, 32 12 C38 15, 42 5, 48 8 C55 11, 58 4, 68 3 L68 30 L2 30 Z"
        fill={color}
        opacity="0.08"
      />
    </svg>
  );
}

/* =====================================================
   HEADER PANEL
===================================================== */

function PanelHeader({
  titulo,
  descripcion,
  icono,
}: {
  titulo: string;
  descripcion: string;
  icono: ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
      "
    >
      <div>
        <h2
          className="
            text-lg
            font-black
            tracking-tight
            text-slate-900
          "
        >
          {titulo}
        </h2>

        <p
          className="
            mt-1
            text-xs
            text-slate-400
          "
        >
          {descripcion}
        </p>
      </div>

      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-slate-50
          text-slate-500
        "
      >
        {icono}
      </div>
    </div>
  );
}

/* =====================================================
   DONUT
===================================================== */

function DonutInventario({
  datos,
  total,
}: {
  datos: EstadoInventario[];
  total: number;
}) {
  const radio = 56;

  const circunferencia = 2 * Math.PI * radio;

  let acumulado = 0;

  return (
    <div
      className="
        relative
        h-[190px]
        w-[190px]
      "
    >
      <svg
        viewBox="0 0 150 150"
        className="
          h-full
          w-full
          -rotate-90
          drop-shadow-sm
        "
      >
        <circle
          cx="75"
          cy="75"
          r={radio}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="18"
        />

        {datos.map((item) => {
          const porcentaje = total > 0 ? item.cantidad / total : 0;

          const largo = porcentaje * circunferencia;

          const offset = -acumulado;

          acumulado += largo;

          return (
            <circle
              key={item.nombre}
              cx="75"
              cy="75"
              r={radio}
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeLinecap="butt"
              strokeDasharray={`${largo} ${circunferencia - largo}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>

      <div
        className="
          absolute
          inset-0
          flex
          flex-col
          items-center
          justify-center
        "
      >
        <p
          className="
            text-4xl
            font-black
            tracking-tight
            text-slate-900
          "
        >
          {total}
        </p>

        <p
          className="
            mt-1
            text-xs
            font-semibold
            text-slate-400
          "
        >
          Activos
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   BARRA VERTICAL
===================================================== */

function BarraVertical({
  titulo,
  valor,
  maximo,
  gradiente,
}: {
  titulo: string;
  valor: number;
  maximo: number;
  gradiente: string;
}) {
  const altura = maximo > 0 ? Math.max(8, (valor / maximo) * 180) : 8;

  return (
    <div
      className="
        flex
        h-full
        flex-1
        flex-col
        items-center
        justify-end
      "
    >
      <span
        className="
          mb-2
          text-sm
          font-black
          text-slate-700
        "
      >
        {valor}
      </span>

      <div
        className="
          flex
          h-[180px]
          w-full
          max-w-[42px]
          items-end
          overflow-hidden
          rounded-t-lg
          bg-slate-50
        "
      >
        <div
          className={`w-full rounded-t-lg bg-gradient-to-t ${gradiente} shadow-lg`}
          style={{
            height: `${altura}px`,
          }}
        />
      </div>

      <span
        className="
          mt-3
          text-center
          text-[11px]
          font-semibold
          text-slate-500
        "
      >
        {titulo}
      </span>
    </div>
  );
}

/* =====================================================
   MINI RESUMEN
===================================================== */

function MiniResumen({
  titulo,
  valor,
  clase,
}: {
  titulo: string;
  valor: string;
  clase: string;
}) {
  return (
    <div
      className={`
        rounded-xl
        p-3.5
        ${clase}
      `}
    >
      <p
        className="
          text-[11px]
          font-semibold
          opacity-70
        "
      >
        {titulo}
      </p>

      <p
        className="
          mt-1
          text-xl
          font-black
        "
      >
        {valor}
      </p>
    </div>
  );
}

/* =====================================================
   ALERTA
===================================================== */

function AlertaCard({ alerta }: { alerta: AlertaOperativa }) {
  const estilos =
    alerta.tipo === "danger"
      ? {
          contenedor: "border-rose-200 bg-gradient-to-r from-rose-50 to-red-50",
          icono: "bg-rose-100 text-rose-600",
        }
      : alerta.tipo === "warning"
        ? {
            contenedor:
              "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50",
            icono: "bg-amber-100 text-amber-600",
          }
        : alerta.tipo === "info"
          ? {
              contenedor:
                "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50",
              icono: "bg-blue-100 text-blue-600",
            }
          : {
              contenedor:
                "border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50",
              icono: "bg-emerald-100 text-emerald-600",
            };

  return (
    <div
      className={`
        flex
        gap-3
        rounded-2xl
        border
        p-4
        ${estilos.contenedor}
      `}
    >
      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${estilos.icono}
        `}
      >
        {alerta.tipo === "success" ? (
          <CheckCircle2 size={19} />
        ) : (
          <AlertTriangle size={19} />
        )}
      </div>

      <div>
        <p
          className="
            text-sm
            font-bold
            text-slate-800
          "
        >
          {alerta.titulo}
        </p>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-slate-500
          "
        >
          {alerta.descripcion}
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   MODULO CARD
===================================================== */

function ModuloCard({
  titulo,
  descripcion,
  valor,
  icono,
  gradiente,
  onClick,
}: {
  titulo: string;
  descripcion: string;
  valor: string;
  icono: ReactNode;
  gradiente: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        relative
        overflow-hidden
        rounded-[20px]
        border
        border-slate-200
        bg-white
        p-5
        text-left
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      <div
        className={`
          absolute
          left-0
          top-0
          h-1
          w-full
          bg-gradient-to-r
          ${gradiente}
        `}
      />

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div
          className={`
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-gradient-to-br
            text-white
            shadow-lg
            ${gradiente}
          `}
        >
          {icono}
        </div>

        <ArrowRight
          size={18}
          className="
            text-slate-300
            transition
            group-hover:translate-x-1
            group-hover:text-blue-500
          "
        />
      </div>

      <h3
        className="
          mt-4
          font-black
          text-slate-800
        "
      >
        {titulo}
      </h3>

      <p
        className="
          mt-1
          text-xs
          text-slate-500
        "
      >
        {descripcion}
      </p>

      <p
        className="
          mt-3
          text-sm
          font-bold
          text-slate-700
        "
      >
        {valor}
      </p>
    </button>
  );
}

/* =====================================================
   ACCESO RÁPIDO
===================================================== */

function AccesoRapido({
  titulo,
  icono,
  clase,
  onClick,
}: {
  titulo: string;
  icono: ReactNode;
  clase: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        items-center
        justify-center
        gap-2
        rounded-2xl
        border
        border-transparent
        px-4
        py-4
        text-sm
        font-bold
        transition-all
        hover:-translate-y-0.5
        hover:shadow-md
        ${clase}
      `}
    >
      {icono}

      {titulo}
    </button>
  );
}

export default DashboardPage;
