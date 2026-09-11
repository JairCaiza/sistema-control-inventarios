const express = require("express");

const router = express.Router();

const protect =
    require("../../../middlewares/auth.middleware");

const {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    cambiarEstado,
    reporteInventario,
    exportarInventarioPDF,
    eliminar,
    exportarInventarioExcel
} = require("./activos.controller");

/* =====================================================
   RUTAS DE ACTIVOS
===================================================== */

/*
 * IMPORTANTE:
 *
 * Las rutas específicas como:
 *
 * /reporte
 * /reporte/pdf
 * /reporte/excel
 *
 * deben ir ANTES de "/:id".
 *
 * De lo contrario Express podría interpretar
 * "reporte" como si fuera el ID de un activo.
 */

/* =====================================================
   REPORTES
===================================================== */

/**
 * GET /api/activos/reporte
 *
 * Obtiene el inventario consolidado:
 *
 * - stock total
 * - disponible
 * - alquilado
 * - mantenimiento
 * - dañado
 * - perdido
 * - ubicaciones
 */
router.get(
    "/reporte",
    protect,
    reporteInventario
);

/**
 * GET /api/activos/reporte/pdf
 *
 * Descarga reporte general en PDF.
 */
router.get(
    "/reporte/pdf",
    protect,
    exportarInventarioPDF
);

/**
 * GET /api/activos/reporte/excel
 *
 * Descarga reporte general en Excel.
 */
router.get(
    "/reporte/excel",
    protect,
    exportarInventarioExcel
);

/* =====================================================
   CREAR ACTIVO
===================================================== */

/**
 * POST /api/activos
 *
 * CASO 1:
 *
 * tipo_control = unidad
 * cantidad_total = 3
 *
 * El backend crea:
 *
 * HR-0001
 * HR-0002
 * HR-0003
 *
 * como activos independientes.
 *
 *
 * CASO 2:
 *
 * tipo_control = cantidad
 * cantidad_total = 100
 *
 * Se crea un solo registro de activo y
 * una existencia inicial de 100 unidades.
 */
router.post(
    "/",
    protect,
    crear
);

/* =====================================================
   LISTAR ACTIVOS
===================================================== */

/**
 * GET /api/activos
 *
 * Devuelve:
 *
 * - información general
 * - categoría
 * - tipo de control
 * - cantidad total
 * - cantidad disponible
 * - cantidad alquilada
 * - cantidad en mantenimiento
 * - cantidad dañada
 * - cantidad perdida
 * - existencias por ubicación y estado
 */
router.get(
    "/",
    protect,
    listar
);

/* =====================================================
   OBTENER ACTIVO POR ID
===================================================== */

/**
 * GET /api/activos/:id
 *
 * Devuelve un activo junto con
 * sus existencias.
 */
router.get(
    "/:id",
    protect,
    obtenerPorId
);

/* =====================================================
   ACTUALIZAR INFORMACIÓN DEL ACTIVO
===================================================== */

/**
 * PUT /api/activos/:id
 *
 * Permite actualizar únicamente
 * información descriptiva:
 *
 * - nombre
 * - descripción
 * - categoría
 * - valor reposición
 * - marca
 * - color
 * - responsable
 * - observaciones
 * - activo
 *
 * NO modifica:
 *
 * - stock
 * - ubicación
 * - estado
 *
 * Esas operaciones deben pasar por
 * el control de existencias.
 */
router.put(
    "/:id",
    protect,
    actualizar
);

/* =====================================================
   CAMBIAR ESTADO DE EXISTENCIA
===================================================== */

/**
 * PATCH /api/activos/:id/estado
 *
 * Mueve una cantidad entre estados.
 *
 * Ejemplo:
 *
 * {
 *     "ubicacion_id": "UUID",
 *     "estado_origen": "disponible",
 *     "estado_destino": "mantenimiento",
 *     "cantidad": 2,
 *     "motivo": "Mantenimiento preventivo"
 * }
 *
 *
 * Antes:
 *
 * disponible = 10
 * mantenimiento = 0
 *
 *
 * Después:
 *
 * disponible = 8
 * mantenimiento = 2
 *
 *
 * IMPORTANTE:
 *
 * "alquilado" NO se gestiona manualmente aquí.
 *
 * Ese estado deberá ser generado por
 * Contratos y revertido por Devoluciones.
 */
router.patch(
    "/:id/estado",
    protect,
    cambiarEstado
);
/* =====================================================
   ELIMINAR ACTIVO
===================================================== */

/**
 * DELETE /api/activos/:id
 *
 * Solo elimina activos que todavía
 * no tengan operaciones relacionadas.
 */
router.delete(
    "/:id",
    protect,
    eliminar
);
/* =====================================================
   EXPORTACIÓN
===================================================== */

module.exports = router;