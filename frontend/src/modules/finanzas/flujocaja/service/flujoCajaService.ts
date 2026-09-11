import { api } from "../../../../services/api";

/* =====================================================
   TIPOS
===================================================== */

export type TipoMovimiento = "ingreso" | "egreso" | "transferencia";

export interface MovimientoFlujoCaja {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: TipoMovimiento;
  monto: number;

  cuenta_id: string;
  cuenta_nombre: string;
  cuenta_tipo?: string | null;

  cuenta_destino_id?: string | null;
  cuenta_destino_nombre?: string | null;
  cuenta_destino_tipo?: string | null;

  referencia_id?: string | null;
  origen_modulo?: string | null;
  origen_id?: string | null;
  fecha_creacion?: string | null;
}

/* =====================================================
   EXTRAER DATOS DE LA RESPUESTA
===================================================== */

const extraerArreglo = (respuesta: unknown): Record<string, unknown>[] => {
  if (Array.isArray(respuesta)) {
    return respuesta as Record<string, unknown>[];
  }

  if (respuesta && typeof respuesta === "object" && "data" in respuesta) {
    const primerData = (
      respuesta as {
        data?: unknown;
      }
    ).data;

    if (Array.isArray(primerData)) {
      return primerData as Record<string, unknown>[];
    }

    if (primerData && typeof primerData === "object" && "data" in primerData) {
      const segundoData = (
        primerData as {
          data?: unknown;
        }
      ).data;

      if (Array.isArray(segundoData)) {
        return segundoData as Record<string, unknown>[];
      }
    }
  }

  return [];
};

/* =====================================================
   CONVERTIR VALORES
===================================================== */

const convertirNumero = (valor: unknown): number => {
  const numero = Number(valor ?? 0);

  return Number.isFinite(numero) ? numero : 0;
};

const convertirTexto = (valor: unknown, valorDefecto = ""): string => {
  if (valor === null || valor === undefined) {
    return valorDefecto;
  }

  return String(valor);
};

const convertirTextoOpcional = (valor: unknown): string | null => {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  return String(valor);
};

/* =====================================================
   NORMALIZAR MOVIMIENTO
===================================================== */

const normalizarMovimiento = (
  movimiento: Record<string, unknown>,
  tipo: TipoMovimiento,
): MovimientoFlujoCaja => {
  const cuentaNombre =
    movimiento.cuenta_nombre ??
    movimiento.nombre_cuenta ??
    movimiento.cuenta_origen_nombre ??
    movimiento.cuenta ??
    "Cuenta no disponible";

  const cuentaTipo =
    movimiento.cuenta_tipo ??
    movimiento.tipo_cuenta ??
    movimiento.cuenta_origen_tipo ??
    null;

  const descripcion =
    movimiento.descripcion ??
    movimiento.concepto ??
    movimiento.detalle ??
    "Sin descripción";

  return {
    id: convertirTexto(movimiento.id),

    fecha: convertirTexto(movimiento.fecha),

    descripcion: convertirTexto(descripcion, "Sin descripción"),

    tipo,

    monto: convertirNumero(movimiento.monto),

    cuenta_id: convertirTexto(movimiento.cuenta_id),

    cuenta_nombre: convertirTexto(cuentaNombre, "Cuenta no disponible"),

    cuenta_tipo: convertirTextoOpcional(cuentaTipo),

    cuenta_destino_id: convertirTextoOpcional(movimiento.cuenta_destino_id),

    cuenta_destino_nombre: convertirTextoOpcional(
      movimiento.cuenta_destino_nombre,
    ),

    cuenta_destino_tipo: convertirTextoOpcional(movimiento.cuenta_destino_tipo),

    referencia_id: convertirTextoOpcional(movimiento.referencia_id),

    origen_modulo: convertirTextoOpcional(movimiento.origen_modulo),

    origen_id: convertirTextoOpcional(movimiento.origen_id),

    fecha_creacion: convertirTextoOpcional(movimiento.fecha_creacion),
  };
};

/* =====================================================
   OBTENER FECHA PARA ORDENAR
===================================================== */

const obtenerTiempo = (movimiento: MovimientoFlujoCaja): number => {
  const fecha =
    movimiento.fecha_creacion ||
    (movimiento.fecha ? `${movimiento.fecha}T00:00:00` : "");

  const tiempo = new Date(fecha).getTime();

  return Number.isNaN(tiempo) ? 0 : tiempo;
};

/* =====================================================
   OBTENER FLUJO DE CAJA
===================================================== */

export const getFlujoCaja = async (): Promise<MovimientoFlujoCaja[]> => {
  const [responseIngresos, responseEgresos, responseTransferencias] =
    await Promise.all([
      api.get("/transacciones/ingresos"),

      api.get("/transacciones/egresos"),

      api.get("/transacciones/transferencias"),
    ]);

  const ingresos = extraerArreglo(responseIngresos.data).map((movimiento) =>
    normalizarMovimiento(movimiento, "ingreso"),
  );

  const egresos = extraerArreglo(responseEgresos.data).map((movimiento) =>
    normalizarMovimiento(movimiento, "egreso"),
  );

  const transferencias = extraerArreglo(responseTransferencias.data).map(
    (movimiento) => normalizarMovimiento(movimiento, "transferencia"),
  );

  return [...ingresos, ...egresos, ...transferencias].sort(
    (a, b) => obtenerTiempo(b) - obtenerTiempo(a),
  );
};
