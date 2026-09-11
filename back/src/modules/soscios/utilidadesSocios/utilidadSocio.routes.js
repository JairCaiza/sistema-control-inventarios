const express = require("express");

const router = express.Router();

const protect =
    require("../../../middlewares/auth.middleware");

const authorizeRoles =
    require("../../../middlewares/role.middleware");

const {
    obtenerUtilidadPeriodo,
    calcular,
    generar,
    listar,
    misUtilidades,
    obtenerPorId,
    pagar,
    cambiarEstado,
    anular,
    obtenerResumen
} = require("./utilidadSocio.controller");

/* =====================================================
   RUTAS DE UTILIDADES DE SOCIOS
===================================================== */

/*
 * IMPORTANTE:
 *
 * Las rutas específicas:
 *
 * /mis-utilidades
 * /utilidad
 * /calculo
 * /resumen
 * /generar
 *
 * deben declararse ANTES de /:id.
 *
 * De lo contrario Express podría interpretar
 * "resumen", "calculo", "mis-utilidades", etc.
 * como si fueran UUID.
 */

/* =====================================================
   MIS UTILIDADES
   PORTAL PERSONAL DEL SOCIO
===================================================== */

/**
 * GET /api/utilidades-socios/mis-utilidades
 *
 * Devuelve únicamente las distribuciones
 * de utilidad pertenecientes al socio
 * autenticado.
 *
 * Seguridad:
 *
 * NO recibe socio_id.
 *
 * El backend obtiene:
 *
 * req.user.id
 *      ↓
 * socios.usuario_id
 *      ↓
 * socios.id
 *      ↓
 * distribuciones_utilidades.socio_id
 */
router.get(
    "/mis-utilidades",
    protect,
    authorizeRoles("Socio"),
    misUtilidades
);

/* =====================================================
   CONSULTAR UTILIDAD REAL DEL PERÍODO
===================================================== */

/**
 * GET /api/utilidades-socios/utilidad
 *
 * Ejemplo:
 *
 * /api/utilidades-socios/utilidad?periodo=2026-07
 *
 * Devuelve:
 *
 * - ingresos
 * - egresos
 * - utilidad del período
 *
 * NO guarda información.
 */
router.get(
    "/utilidad",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    obtenerUtilidadPeriodo
);

/* =====================================================
   SIMULAR / CALCULAR DISTRIBUCIÓN
===================================================== */

/**
 * GET /api/utilidades-socios/calculo
 *
 * Ejemplo:
 *
 * /api/utilidades-socios/calculo
 * ?periodo=2026-07
 * &monto_distribuir=5000
 *
 * Calcula:
 *
 * - utilidad
 * - capital total
 * - participación de cada socio
 * - monto correspondiente
 *
 * NO guarda información.
 */
router.get(
    "/calculo",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    calcular
);

/* =====================================================
   RESUMEN
===================================================== */

/**
 * GET /api/utilidades-socios/resumen
 *
 * Opcional:
 *
 * ?periodo=2026-07
 *
 * Devuelve:
 *
 * - total distribuido
 * - total pagado
 * - total pendiente
 * - cantidad pagada
 * - cantidad pendiente
 */
router.get(
    "/resumen",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    obtenerResumen
);

/* =====================================================
   GENERAR DISTRIBUCIÓN
===================================================== */

/**
 * POST /api/utilidades-socios/generar
 *
 * Genera realmente las distribuciones
 * correspondientes a cada socio.
 *
 * Ejemplo body:
 *
 * {
 *     "periodo": "2026-07",
 *     "monto_distribuir": 5000,
 *     "observaciones": "Distribución julio"
 * }
 *
 * El porcentaje NO se envía.
 *
 * El backend lo calcula automáticamente
 * según el capital neto de cada socio.
 */
router.post(
    "/generar",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    generar
);

/* =====================================================
   LISTAR DISTRIBUCIONES
===================================================== */

/**
 * GET /api/utilidades-socios
 *
 * Filtros opcionales:
 *
 * ?periodo=2026-07
 * ?socio_id=UUID
 * ?estado=pendiente
 * ?fecha_desde=2026-07-01
 * ?fecha_hasta=2026-07-31
 */
router.get(
    "/",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    listar
);

/* =====================================================
   OBTENER DISTRIBUCIÓN POR ID
===================================================== */

/**
 * GET /api/utilidades-socios/:id
 *
 * Ruta administrativa.
 *
 * Un socio NO debe utilizar esta ruta
 * para consultar distribuciones arbitrarias.
 *
 * Para el portal del socio se utiliza:
 *
 * GET /mis-utilidades
 */
router.get(
    "/:id",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    obtenerPorId
);

/* =====================================================
   PAGAR UTILIDAD
===================================================== */

/**
 * POST /api/utilidades-socios/:id/pagar
 *
 * Ejemplo:
 *
 * {
 *     "cuenta_id": "UUID",
 *     "fecha_pago": "2026-08-07",
 *     "metodo_pago": "transferencia",
 *     "referencia": "TRX-001",
 *     "observaciones": "Pago realizado"
 * }
 *
 * Esta operación:
 *
 * 1. Valida distribución
 * 2. Valida cuenta
 * 3. Valida saldo
 * 4. Crea transacción de egreso
 * 5. Disminuye saldo
 * 6. Marca utilidad como pagada
 */
router.post(
    "/:id/pagar",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    pagar
);

/* =====================================================
   ANULAR DISTRIBUCIÓN
===================================================== */

/**
 * PATCH /api/utilidades-socios/:id/anular
 *
 * Solo permite anular una distribución
 * que todavía NO haya sido pagada.
 */
router.patch(
    "/:id/anular",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    anular
);

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

/**
 * PATCH /api/utilidades-socios/:id/estado
 *
 * Actualmente se utiliza principalmente
 * para estado:
 *
 * {
 *     "estado": "anulado"
 * }
 *
 * No se permite marcar manualmente
 * una utilidad como pagada.
 */
router.patch(
    "/:id/estado",
    protect,
    authorizeRoles(
        "Administrador",
        "Contador"
    ),
    cambiarEstado
);

/* =====================================================
   EXPORTACIÓN
===================================================== */

module.exports = router;