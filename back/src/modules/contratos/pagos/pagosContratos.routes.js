
const express = require("express");
const router = express.Router();

// =====================================================
// MIDDLEWARES
// =====================================================

const protect = require(
    "../../../middlewares/auth.middleware"
);

const authorizeAnularPago = require(
    "../../../middlewares/authorizeAnularPago.middleware"
);

// =====================================================
// CONTROLLER
// =====================================================

const pagosContratosController = require(
    "./pagosContratos.controller"
);

// =====================================================
// REGISTRAR PAGO
// =====================================================

router.post(
    "/:id/pagos",
    protect,
    pagosContratosController.registrar
);

// =====================================================
// LISTAR PAGOS DEL CONTRATO
// =====================================================

router.get(
    "/:id/pagos",
    protect,
    pagosContratosController.listarPorContrato
);

// =====================================================
// RESUMEN FINANCIERO DEL CONTRATO
// =====================================================

router.get(
    "/:id/pagos/resumen",
    protect,
    pagosContratosController.resumen
);

// =====================================================
// ANULAR PAGO DE CONTRATO
// =====================================================

router.post(
    "/:id/pagos/:pagoId/anular",
    protect,
    authorizeAnularPago,
    pagosContratosController.anular
);

// =====================================================
// CORREGIR PAGO DE CONTRATO
// =====================================================

// Solo usuarios administradores autorizados.
//
// La corrección:
// - Conserva el historial del pago original.
// - Revierte el movimiento financiero anterior.
// - Registra un nuevo pago.
// - Vincula el pago corregido con el original.
// - Actualiza los saldos del contrato.
// - Registra el usuario responsable.
//
// Toda la operación se ejecuta dentro de una
// transacción PostgreSQL desde el service.

router.post(
    "/:id/pagos/:pagoId/corregir",
    protect,
    authorizeAnularPago,
    pagosContratosController.corregir
);

// =====================================================
// EXPORTAR RUTAS
// =====================================================

module.exports = router;
