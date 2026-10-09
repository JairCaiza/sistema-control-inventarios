import { api } from "../../../services/api";

/* =====================================================
   TIPOS DE PAGOS
===================================================== */

export type ConceptoPagoContrato =
  | "alquiler"
  | "anticipo"
  | "penalidad"
  | "abono"
  | "saldo"
  | "otro";

export type ConceptoPagoCorregible = "alquiler" | "anticipo";

export type EstadoPagoContrato = "registrado" | "anulado";

/* =====================================================
   REGISTRAR PAGO
===================================================== */

export interface RegistrarPagoContratoData {
  cuenta_id: string;
  monto: number;
  metodo_pago: string;
  concepto: ConceptoPagoContrato;
  observaciones?: string;
  fecha?: string;
}

/* =====================================================
   CUENTAS FINANCIERAS
===================================================== */

export interface CuentaFinanciera {
  id: string;
  nombre: string;
  tipo: string;
  saldo_actual: number | string;
  activa?: boolean;
}

/* =====================================================
   PAGO REGISTRADO
===================================================== */

export interface PagoContrato {
  id: string;
  contrato_id: string;
  cuenta_id: string;
  cuenta?: string;

  monto: number | string;
  fecha: string;
  metodo_pago: string;
  concepto: ConceptoPagoContrato;

  observaciones?: string | null;
  fecha_creacion: string;

  /*
   * ESTADO DEL PAGO
   */

  estado: EstadoPagoContrato;

  /*
   * DATOS DE ANULACIÓN
   */

  motivo_anulacion?: string | null;
  fecha_anulacion?: string | null;
  anulado_por?: string | null;
  transaccion_reversion_id?: string | null;

  /*
   * DATOS DE CORRECCIÓN
   *
   * pago_original_id:
   * Identifica el pago anterior que fue
   * reemplazado por este registro.
   *
   * motivo_correccion:
   * Justificación de la modificación.
   *
   * corregido_por:
   * Identificador del usuario administrador
   * que realizó la corrección.
   */

  pago_original_id?: string | null;
  motivo_correccion?: string | null;
  corregido_por?: string | null;
}

/* =====================================================
   TRANSACCIÓN FINANCIERA
===================================================== */

export interface TransaccionPagoContrato {
  id: string;
  cuenta_id: string;
  tipo: string;
  monto: number | string;
  descripcion: string;
  fecha: string;
  origen_modulo: string;
  origen_id: string;

  referencia_id?: string | null;
}

/* =====================================================
   ESTADO FINANCIERO EFECTIVO
===================================================== */

export interface EstadoFinancieroContrato {
  id: string;
  numero_contrato: string;
  estado: string;

  total_previsto: number;
  total_efectivo: number;

  pagado: number;
  pagos_aplicables: number;

  total_penalidades_pagadas: number;

  saldo_previsto: number;
  saldo_efectivo_pendiente: number;

  saldo_a_favor_cliente: number;
  disponible_anticipo: number;
}

/* =====================================================
   RESULTADO DEL REGISTRO DE PAGO
===================================================== */

export interface ResultadoPagoContrato {
  contrato_id: string;
  numero_contrato: string;
  estado: string;

  /*
   * CAMPOS ORIGINALES
   * Se conservan para compatibilidad.
   */

  total: number;
  pagado: number;
  saldo_pendiente: number;

  /*
   * CAMPOS FINANCIEROS EFECTIVOS
   */

  total_previsto?: number;
  total_efectivo?: number;

  pagos_aplicables?: number;

  total_penalidades_pagadas?: number;

  saldo_previsto?: number;

  saldo_efectivo_pendiente?: number;

  saldo_a_favor_cliente?: number;

  disponible_anticipo?: number;

  /*
   * CONCEPTO REGISTRADO
   */

  concepto?: ConceptoPagoContrato;

  /*
   * RESULTADOS DEL MOTOR FINANCIERO
   */

  pago: PagoContrato;
  transaccion: TransaccionPagoContrato;

  mensaje: string;
}

/* =====================================================
   RESUMEN FINANCIERO DEL CONTRATO
===================================================== */

export interface ResumenPagosContrato {
  id: string;
  numero_contrato: string;
  estado: string;

  /*
   * CAMPOS ORIGINALES
   */

  total: number | string;
  pagado: number | string;
  saldo_pendiente: number | string;

  cantidad_pagos: number;
  total_pagos: number | string;

  /*
   * CANTIDAD DE PAGOS ANULADOS
   *
   * Incluye pagos anulados normalmente
   * y pagos originales reemplazados
   * mediante una corrección.
   */

  cantidad_pagos_anulados: number;

  /*
   * CAMPOS FINANCIEROS EFECTIVOS
   */

  total_previsto: number | string;

  total_efectivo: number | string;

  pagos_aplicables: number | string;

  total_penalidades_pagadas: number | string;

  saldo_previsto: number | string;

  saldo_efectivo_pendiente: number | string;

  saldo_a_favor_cliente: number | string;

  disponible_anticipo: number | string;

  /*
   * DESGLOSE DE PAGOS POR CONCEPTO
   */

  total_anticipos: number | string;

  total_pagos_alquiler: number | string;

  total_abonos: number | string;

  total_pagos_saldo: number | string;
}

/* =====================================================
   SOLICITUD DE ANULACIÓN DE PAGO
===================================================== */

export interface AnularPagoContratoData {
  motivo_anulacion: string;
}

/* =====================================================
   RESULTADO DE ANULACIÓN DE PAGO
===================================================== */

export interface ResultadoAnulacionPagoContrato {
  success: boolean;
  mensaje: string;

  contrato_id: string;
  numero_contrato: string;

  pago: PagoContrato;

  transaccion_reversion: TransaccionPagoContrato;

  resumen_financiero: EstadoFinancieroContrato;
}

/* =====================================================
   SOLICITUD DE CORRECCIÓN DE PAGO
===================================================== */

export interface CorregirPagoContratoData {
  /*
   * Cuenta donde se registrará el
   * nuevo ingreso financiero.
   */

  cuenta_id: string;

  /*
   * Nuevo monto del pago.
   * Debe ser mayor que cero.
   */

  monto: number;

  /*
   * Método de pago corregido.
   */

  metodo_pago: string;

  /*
   * El backend permite corregir
   * únicamente alquiler o anticipo.
   */

  concepto: ConceptoPagoCorregible;

  /*
   * Observaciones actualizadas.
   */

  observaciones?: string | null;

  /*
   * Fecha del nuevo registro.
   * Si no se envía, el backend
   * conserva la fecha del pago original.
   */

  fecha?: string;

  /*
   * Motivo obligatorio de corrección.
   * Mínimo 10 caracteres.
   */

  motivo_correccion: string;
}

/* =====================================================
   RESULTADO DE CORRECCIÓN DE PAGO
===================================================== */

export interface ResultadoCorreccionPagoContrato {
  success: boolean;
  mensaje: string;

  contrato_id: string;
  numero_contrato: string;

  /*
   * Pago original:
   * Queda anulado por corrección.
   */

  pago_original: PagoContrato;

  /*
   * Nuevo pago:
   * Queda registrado y vinculado
   * mediante pago_original_id.
   */

  pago: PagoContrato;

  /*
   * Movimiento de egreso que revierte
   * el ingreso financiero original.
   */

  transaccion_reversion: TransaccionPagoContrato;

  /*
   * Nuevo movimiento de ingreso.
   */

  transaccion: TransaccionPagoContrato;

  /*
   * Estado financiero actualizado
   * después de confirmar la corrección.
   */

  resumen_financiero: EstadoFinancieroContrato;
}

/* =====================================================
   REGISTRAR PAGO DEL CONTRATO
===================================================== */

export const registrarPagoContrato = async (
  contratoId: string,
  data: RegistrarPagoContratoData,
): Promise<ResultadoPagoContrato> => {
  const response = await api.post(`/contratos/${contratoId}/pagos`, data);

  return response.data.data;
};

/* =====================================================
   LISTAR PAGOS DEL CONTRATO
===================================================== */

export const listarPagosContrato = async (
  contratoId: string,
): Promise<PagoContrato[]> => {
  const response = await api.get(`/contratos/${contratoId}/pagos`);

  return response.data.data || response.data;
};

/* =====================================================
   OBTENER RESUMEN DE PAGOS
===================================================== */

export const obtenerResumenPagosContrato = async (
  contratoId: string,
): Promise<ResumenPagosContrato> => {
  const response = await api.get(`/contratos/${contratoId}/pagos/resumen`);

  return response.data.data || response.data;
};

/* =====================================================
   LISTAR CUENTAS FINANCIERAS
===================================================== */

export const listarCuentasFinancieras = async (): Promise<
  CuentaFinanciera[]
> => {
  const response = await api.get("/cuentas-financieras");

  return response.data.data || response.data;
};

/* =====================================================
   ANULAR PAGO DE CONTRATO
===================================================== */

export const anularPagoContrato = async (
  contratoId: string,
  pagoId: string,
  motivoAnulacion: string,
): Promise<ResultadoAnulacionPagoContrato> => {
  /*
   * VALIDAR IDENTIFICADORES
   */

  if (!contratoId || !pagoId) {
    throw new Error("Debe identificar el contrato y el pago");
  }

  /*
   * VALIDAR MOTIVO DE ANULACIÓN
   */

  const motivo = motivoAnulacion.trim();

  if (motivo.length < 10) {
    throw new Error(
      "El motivo de anulación debe contener al menos 10 caracteres",
    );
  }

  /*
   * ENVIAR SOLICITUD AL BACKEND
   *
   * El token JWT es gestionado por la
   * configuración existente de api.
   *
   * El backend verifica que el usuario
   * tenga el rol Administrador.
   */

  const response = await api.post(
    `/contratos/${contratoId}/pagos/${pagoId}/anular`,
    {
      motivo_anulacion: motivo,
    },
  );

  return response.data.data;
};

/* =====================================================
   CORREGIR PAGO DE CONTRATO
===================================================== */

export const corregirPagoContrato = async (
  contratoId: string,
  pagoId: string,
  data: CorregirPagoContratoData,
): Promise<ResultadoCorreccionPagoContrato> => {
  // ===================================================
  // 1. VALIDAR IDENTIFICADORES
  // ===================================================

  if (!contratoId || !pagoId) {
    throw new Error(
      "Debe identificar el contrato y el pago que desea corregir",
    );
  }

  // ===================================================
  // 2. VALIDAR CUENTA FINANCIERA
  // ===================================================

  const cuentaId = String(data.cuenta_id || "").trim();

  if (!cuentaId) {
    throw new Error("Debe seleccionar una cuenta financiera");
  }

  // ===================================================
  // 3. VALIDAR MONTO
  // ===================================================

  if (data.monto === null || data.monto === undefined) {
    throw new Error("Debe ingresar el nuevo monto del pago");
  }

  const monto = Number(data.monto);

  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error("El monto corregido debe ser mayor a cero");
  }

  const centavos = Math.round(monto * 100);

  if (Math.abs(monto * 100 - centavos) > 0.0000001) {
    throw new Error("El monto no puede tener más de dos decimales");
  }

  // ===================================================
  // 4. VALIDAR CONCEPTO
  // ===================================================

  const concepto = String(data.concepto || "")
    .trim()
    .toLowerCase();

  if (concepto !== "alquiler" && concepto !== "anticipo") {
    throw new Error("El concepto debe ser alquiler o anticipo");
  }

  // ===================================================
  // 5. VALIDAR MOTIVO DE CORRECCIÓN
  // ===================================================

  const motivo = String(data.motivo_correccion || "").trim();

  if (motivo.length < 10) {
    throw new Error(
      "El motivo de corrección debe contener al menos 10 caracteres",
    );
  }

  // ===================================================
  // 6. PREPARAR DATOS DEL PAGO CORREGIDO
  // ===================================================

  const payload: CorregirPagoContratoData = {
    cuenta_id: cuentaId,
    monto: centavos / 100,
    metodo_pago: data.metodo_pago,
    concepto: concepto as ConceptoPagoCorregible,
    observaciones: data.observaciones,
    fecha: data.fecha,
    motivo_correccion: motivo,
  };

  // ===================================================
  // 7. ENVIAR SOLICITUD DE CORRECCIÓN
  // ===================================================

  /*
   * El backend se encarga de:
   *
   * - Verificar el usuario administrador.
   * - Bloquear el contrato y el pago original.
   * - Validar el movimiento financiero.
   * - Revertir el ingreso anterior.
   * - Marcar el pago original como anulado.
   * - Registrar el nuevo pago.
   * - Guardar pago_original_id.
   * - Registrar motivo_correccion.
   * - Registrar corregido_por.
   * - Actualizar los saldos.
   * - Confirmar o revertir la transacción SQL.
   *
   * El usuario_id no se envía desde React.
   * El backend lo obtiene del JWT.
   */

  const response = await api.post(
    `/contratos/${contratoId}/pagos/${pagoId}/corregir`,
    payload,
  );

  // ===================================================
  // 8. DEVOLVER RESULTADO
  // ===================================================

  return response.data.data;
};
